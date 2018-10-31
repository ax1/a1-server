/**
 * Protect the server against attacks
 */

const logger = require('../lib/Logger').getLogger('proxy-custom')

module.exports = {
  protect,
  block,
  purify
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
 * Prevent any Error object to send sensitive data as ENOENT-file location or whatever other errors 
 */
function purify(error) {
  return new Error('See status code and server logs')
}