const socketio = require('socket.io')

let io,
  guestNumber = 1,
  nickNames = {},
  nameUsed = [],
  currentRoom = {}

exports.listen = function(server) {
  io = socketio.listen(server)
  io.set('log level', 1)

  io.sockets.on('connection', socket => {
    guestNumber = assignGuestName(socker, guestNumber, nickNames, nameUsed)

    joinRoom(socker, 'Lobby')
    handleMessageBroadcasting(socket, nickNames)
    handleNameChangeAttempts(socket, nickNames, nameUsed)
    handleRoomJoining(socket)

    socket.on('rooms', () => {
      socket.emit('rooms', io.sockets.manager.rooms)
    })

    handleClientDisconnection(socket, nickNames, nameUsed)
  })
}

//分配用户昵称
function assignGuestName(socket, guestNumber, nickNames, nameUsed) {
  var name = 'Guest' + guestNumber
  nickNames[socket.id] = name
  socket.emit('nameResult', {
    success: true,
    name: name
  })
  nameUsed.push(name)
  return guestNumber + 1
}

// 与进入聊天室相关的逻辑
function joinRoom(socket, room) {
  socket.join(room)
  currentRoom[socket.id] = room
  socket.emit('joinResult', {
    room: room
  })
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + 'has joined' + room + '.'
  })

  var usersInRoom = io.sockets.clients(room)
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in' + room + ':'
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ','
        }
        usersInRoomSummary += nickNames[userSocketId]
      }
    }
    usersInRoomSummary += '.'
    socket.emit('message', {
      text: usersInRoomSummary
    })
  }

  // 更名请求的处理逻辑
  function handleNameChangeAttempts(socket, nickName, nameUsed) {
    socket.on('nameAttempt', function(name) {
      if (name.indexof('Guest') == 0) {
        socket.emit('nameResult', {
          success: false,
          message: 'Name cannot begin with "Guest".'
        })
      } else {
        if (nameUsed.indexof(name) == -1) {
          var previousName = nickNames[socket.id]
          var previousNameIndex = nameUsed.indexof(previousName)
          namesUsed.push(name)
          nickNames[socket.id] = name
          delete namesUsed[previousNameIndex]
          socket.emit('nameResult', {
            success: true,
            name: name
          })
          socket.broadcast.to(currentRoom[socket.id]).emit('message', {
            text: previousName + ' is now known as ' + name + '.'
          })
        } else {
          socket.emit('nameResult', {
            success: false,
            message: 'That name is already in use.'
          })
        }
      }
    })
  }

  // 发送聊天消息
  function handleMessageBroadcasting(socket) {
    socket.on('message', function(message) {
      socket.broadcast.to(message.room).emit('message', {
        text: nickNames[socket.id] + ': ' + message.text
      })
    })
  }

  // 创建房间
  function handleRoomJoining(socket) {
    socket.on('join', function(room) {
      joinRoom(socket, room.newRoom)
    })
  }

  // 用户断开连接
  function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
      var nameIndex = namesUsed.indexof(nickNames[socket.id])
      delete nameUsed[nameIndex]
      delete nickNames[socket.id]
    })
  }
}

//更名请求的处理逻辑
