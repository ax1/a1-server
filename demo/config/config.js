/**
 * Configure redirection rules (internal and/or proxies)
 */
// let serverConfiguration={
//   port:8443,
//   rules:{
//     '/prueba(/*)':'http://serverfault.com',
//     '/rest/*':'/services/*'
//   },
//   ssl:{
//     key: fs.readFileSync('server.key'),
//     cert: fs.readFileSync('server.crt')
//   }
// }

const Logger = require('../../lib/Logger')
Logger.configure(Logger.NoOutputLogger) //no output

const serverConfiguration = {
  port: 8080,
  rules: {
    '/cars(/:id)': '/cars',
    '/prueba(/*)': 'http://serverfault.com',
    '/rest/*': '/services/*'

  },
  Logger: Logger
}

module.exports = {
  configuration: serverConfiguration
}
