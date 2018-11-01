/**
 * Protect the server against attacks
 */

const logger = require('../lib/Logger').getLogger('proxy-custom')
const http = require('http')

module.exports = {
  protect,
  block,
  purifyError
}

let blacklist = []
let lastClean = Date.now()

function getClient(request) {
  if (request.headers['x-forwarded-for']) return request.headers['x-forwarded-for']
  else return request.connection.remoteAddress
}

/**
 * Block rogue user
 */
function block(request) {
  let client = getClient(request)
  blacklist.push(client)
  logger.warn('blocking rogue ' + client)
  request.destroy()
}

/**
 * Install protection against rogue users
 */
function protect() {
  var plugin = function (request, response, next) {
    //if rogue client, screw him (and do not execute next middlewares)
    if (blacklist.includes(getClient(request))) {
      request.destroy()
      response.end()
      //clean if 10 min passed
      if (Date.now() - lastClean > 10 * 60 * 1000) {
        blacklist = []
        lastClean = Date.now()
      }
    } else next()
  }
  return plugin
}

/**
 * Create a new error object with meaning, but secure against hackers
 * Prevent any Error object to send sensitive data as ENOENT-file location or whatever other errors 
 * Modify response status and message codes only if user did not set
 * Note: this is NOT a PURE function, since response object can change its status code
 * @param error {Error|NodeError|String|Number}
 * @param response {the HTTP response object}
 * @returns {Error}
 */
function purifyError(error, response) {
  // get HTTP status code, do not send the node error
  const errNumber = Number.isInteger(error) ? error : 500
  const status = response.statusCode < 400 ? errNumber : response.statusCode // if error status was set in response, keep that one
  // modify response status code and message
  let message = http.STATUS_CODES[status]
  response.statusCode = status
  response.message = message
  // send a purified error
  return new Error(status + '. ' + message)
}