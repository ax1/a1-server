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
//     key: fs.readFileSync('/etc/x/projects/a1server/demo/config/server.key'),
//     cert: fs.readFileSync('/etc/x/projects/a1server/demo/config/server.crt')
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
