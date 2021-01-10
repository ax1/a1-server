const server = require("../lib/server")
//let morgan=require('morgan')
const configuration = require("./config/config").configuration
const WebSocketServer = require('ws').Server

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

console.log(`\x1b[32mstarting demo server at ${configuration.port}\x1b[0m`)
/**
 * Start an HTTP server
 */
server.start(configuration)
  .then(httpServer => startWebsocket(httpServer))
  .catch(err => { throw err })

/**
 * Start the websocket server
 */
function startWebsocket(httpServer) {
  let wss = new WebSocketServer({ server: httpServer })
  wss.on('connection', ws => {
    console.log('client open')
    ws.on('close', client => console.log('client closed'))
    ws.on('message', msg => ws.send('websocket server received ' + msg))
    ws.on('error', console.error)
    ws.on('pong', client => console.log('client is alive'))
  })
  return wss
}