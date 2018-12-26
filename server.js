const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const cache = {}

const chatserver = require("./lib/chat_server.js")
var server = http.createServer((req, res) => {
  let filePath = false;
  if (req.url == '/') {
    filePath = 'public/index.html'
  } else {
    filePath = 'public' + req.url
  }

  let absPath = './' + filePath;
  serverStatic(res, cache, absPath)
})

server.listen(4321, () => {
  console.log('server listen to 4321...');
})

// chatserver.listen(server)

function serverStatic(res, cache, absPath) {
  if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath])
  } else {
    fs.exists(absPath, function (exists) {
      if (exists) {
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(res)
          } else {
            cache[absPath] = data;
            sendFile(res, absPath, data)
          }
        })
      } else {
        send404(res)
      }
    })
  }
}

function sendFile(res, filePath, fileContents) {
  res.writeHead(200, {
    'Content-Type': mime.getType(path.basename(filePath))
  })
  res.end(fileContents)
}

function send404(res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  })
  res.write('error: 404, resource not found')
  res.end()
}