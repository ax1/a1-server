let UrlPattern = require('url-pattern')
const Logger = require('../lib/Logger')
const fs = require('fs')
const security = require('./security')
let logger

module.exports = {
  load,
  add,
  match,
  resolve
}

const patterns = {}

function load(rules) {
  logger = Logger.getLogger('router')
  for (let name of Object.keys(rules)) {
    let pattern = patchIPParameters(name)
    let address = rules[name]
    if (!address) address = pattern.stringify()
    patterns[name] = {
      pattern: pattern,
      address: address
    }
  }
}

/**
 * REST params can contain dots. I.e: ips/17.223.37.12, properties/database.user
 * @return {URLPattern}
 */
function patchIPParameters(name) {
  const pattern = new UrlPattern(name)
  let regex = pattern.regex.toString()
  if (regex.includes('[')) {
    regex = regex.split('[').map((el, i) => i === 0 ? el : '\\.' + el).reduce((a, el) => a + '[' + el)
    regex = regex.substring(1, regex.length - 2)
    pattern.regex = new RegExp(regex, pattern.flags)
  }
  return pattern
}

function add(rules) {
  load(rules)
}

function match(path) {
  for (let name of Object.keys(patterns)) {
    let match = patterns[name].pattern.match(path)
    if (match) {
      logger.trace(match + ' ' + patterns[name].pattern.stringify() + ' ' + patterns[name].pattern.stringify(match))
    }
  }
}

/**
 * Get the real path and REST params
 * Note that querystring params are located along with the path
 * @param {String} path -A URL path to match against current routing table
 *@return {Object} {path:the real path, params: the REST params}
 */
function resolve(path, cb) {
  if (process.env.SERVER_PERFORMANCE) return { path, params: null }
  security.checkManySubfolders(path)
  let result
  for (let name of Object.keys(patterns)) {
    let pattern = patterns[name].pattern
    let match = pattern.match(path)
    let params = (match && Object.keys(match).length == 0) ? null : match
    if (match) {
      let mainpath = patterns[name].address
      if (match['_']) {
        //pure URL (/p/a/t/h/?abcd)
        let subpath = match['_']
        if (!subpath) subpath = ''
        if (mainpath.endsWith('/') === false) mainpath = mainpath + '/'
        if (subpath.startsWith('/')) subpath = subpath.substring(1)
        result = {
          path: mainpath + subpath,
          params: params
        }
      } else {
        //REST service
        result = {
          path: mainpath,
          params: params
        }
      }
      return result;
    }
  }
  //if not found try to resolve if automatic routing or not
  return resolveAutomaticRouting(path, cb)
}

/**
 * A service can be a REST service but no need to be defined in config rules
 * This is useful when dropping js files in the /app/ folder directly anz zero configuration
 * The list of params p0, p1, etc can be set when guessing the route 
 * Example:
 *  - if a file is /app/people.js and service is /app/people/id/permissions
 *  - result should be {path:app/people, params:{p0:id,p1:permissions}}
 * @param {string} path  
 */
function resolveAutomaticRouting(path, cb) {
  let concat = path
  let index = concat.lastIndexOf('/')
  let found = false;

  while (index && index > 0) {
    concat = concat.substring(0, index)
    const realPath = cb(concat)
    if (fs.existsSync(realPath)) { found = true; break }
    index = concat.lastIndexOf('/')
  }

  if (found) {
    const realPath = concat
    const tail = path.substring(index + 1).split('/')
    const params = {}
    tail.forEach((el, i) => params['p' + i] = el)

    // add to routing table THE FIRST TIME so next time this rule will be executed eagerly
    let route = realPath
    tail.forEach((el, i) => route = `${route}(/:p${i})`)
    add({ route: '' })

    // return route
    return { path: realPath, params }

  } else {
    //if not found return the path 
    return { path, params: null }
  }
}
