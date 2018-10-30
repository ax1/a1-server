let UrlPattern = require('url-pattern')
const logger = require('../lib/Logger').getLogger('proxy-custom')

module.exports = {
  load,
  add,
  match,
  resolve
}

const patterns = {}

function load(rules) {
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
function resolve(path) {
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
  //if not found return the path itself
  return {
    path: path,
    params: null
  }
}