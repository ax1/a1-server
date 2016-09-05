var WebSocket = require('ws')
var ws = new WebSocket('ws://localhost:8080')

ws.on('open', function open() {
  setInterval(()=>  ws.send('hola don pepito'),5000)
})

ws.on('message', function(data, flags) {
  console.log(data)
})
