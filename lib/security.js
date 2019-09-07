/**
 * Protect the server against attacks
 */

const logger = require('../lib/Logger').getLogger('security')
const http = require('http')

module.exports = {
  protect,
  block,
  purifyError,
  checkManySubfolders,
  isCriticalHeader
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
 * Examples:
 *  - throw(409) or throw('409'), error is set by developer->OK, send error number
 *  - throw new Error(409), idem->OK, send error number
 *  - throw nodeError, node has error.code but it is sensitive->KO send generic 500 error
 *  - throw err, generic error, if err.message is not a number->KO, send  generic 500 error
 * Note: this is NOT a PURE function, since response object can change its status code
 * @param error {Error|NodeError|String|Number}
 * @param response {the HTTP response object}
 * @returns {Error}
 */
function purifyError(error, response) {
  // get HTTP status code, do not send the node error description
  const errNumber = !isNaN(error) ? Number.parseInt(error) :
    !isNaN(error.message) ? Number.parseInt(error.message) : 500
  const status = response.statusCode < 400 ? errNumber : response.statusCode // if error status was set in response, keep that one
  // modify response status code and message
  let message = http.STATUS_CODES[status]
  response.statusCode = status
  response.message = message
  // send a purified error
  return new Error(status + '. ' + message + '.')
}

/**
 * Check if url path contains lots of subfolders. For rest services this would result into having lots of path params and files
 */
function checkManySubfolders(path) {
  if (path.split('/').length > 20) throw new Error(' For security and performance reasons, a path cannot have more than 20 subpaths')
}

/**
 * Return if the header is a security header and it should be removed from logs, etc 
 * @param {string} name 
 */
function isCriticalHeader(name) {
  return name.includes('authorization') ? true : false
}