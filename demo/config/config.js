/**
 * Configure redirection rules (internal and/or proxies)
 */
// let serverConfiguration = {
//   port: 8080,
//   rules: {
//     '/prueba(/*)': 'http://serverfault.com',
//     '/rest/*': '/services/*'
//   },
//   ssl: {
//     key: './config/server.key',
//     cert: './config/server.crt'
//   }
// }

// const Logger = require('../../lib/Logger')
// Logger.configure(Logger.NoOutputLogger) //no output

const serverConfiguration = {
  port: 8080,
  rules: {
    '/cars(/:id)': '/cars',
    '/prueba(/*)': 'http://serverfault.com',
    '/rest/*': '/services/*'
  },
  /*Logger: Logger,*/
}

module.exports = {
  configuration: serverConfiguration
}
