const WebSocketServer = require('ws').Server

module.exports = { startWebsocket }

function startWebsocket(server, events) {
  if (!events) events = {}
  const wss = new WebSocketServer({ server })
  wss.on('connection', ws => {
    ws.on('open', events.open ? events.open : ev => ws.send('websocket open'))
    ws.on('close', events.close ? events.close : () => console.log('client closed'))
    ws.on('message', events.message ? events.message : msg => ws.send('websocket server received ' + msg.toString()))
    ws.on('pong', events.pong ? events.pong : ev => console.log('pong closed'))
  })
  return wss
}