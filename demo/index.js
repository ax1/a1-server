let server = require("../lib/server")
//let server=require("../lib/server")
//let morgan=require('morgan')
let configuration = require("./config/config").configuration
//let fs = require("fs")
let WebSocketServer = require('ws').Server
//require('../lib/persistence').start(__dirname+ '/database')

// server.use(require('express-winston').logger({
//   transports: [
//     new (require('winston')).transports.Console({ json: true })
//   ]
// }))

/**
 * Add express type plugins
 */
// server.use((req,res,next)=>{console.log('middleware executed');next()})
// server.use((req,res,next)=>{
//   if (!res.getHeader("Server")) res.setHeader("Server","Coyote")
//   next()
// })
// server.use(morgan('combined'))

console.log('starting demo server')
/**
 * Start an HTTP server
 */
server.start(configuration)
  .then(httpServer => startWebsocket(httpServer))
  .catch(err => {
    throw err
  })

/**
 * Start the websocket server
 */
function startWebsocket(httpServer) {
  let wss = new WebSocketServer({
    server: httpServer
  })
  wss.on('connection', ws => {
    ws.on('message', message => {
      ws.send('you said: ' + message)
      ws.send('and I am saying to you: shut the fuck up!!!')
    })
  })
}
