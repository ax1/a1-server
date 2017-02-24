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
//     key: fs.readFileSync('/etc/x/projects/opamp/demo/config/server.key'),
//     cert: fs.readFileSync('/etc/x/projects/opamp/demo/config/server.crt')
//   }
// }

let Logger = require('../../lib/Logger')
//Logger.configure(Logger.DummyLogger) //no output

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
