/**
 * Reverse proxy based on htpp-proxy
 */

/*
  //The simplest version of this proxy would be: (server at 8080 but retrieving 8082 content)
  const httpProxy = require('http-proxy')
  httpProxy.createProxyServer({ target: 'http://localhost:8082' }).listen(8080)
*/

const url = require("url")
const http_proxy = require('http-proxy')
const URL = url.URL

module.exports = { proxyPage }

let proxy = http_proxy.createProxyServer()

/**
 * IMPORTANT: when using plain HTTP, the destination server could be redirecting(302) to an HTTPS address.
 * This may lead to think there is a bug in this fuction, but it is OK.
 * Examples:
 *   - [OK] if rule "/security(/*)"="https://google.com" the URL in the address baris http://localhost/security
 *   - [LOOKOUT] if rule "/security(/*)"="http://google.com" the URL IN THE ADDRESS BAR is https://google.com. The response is redirected perfectly but take into account that the host in the addres bar has changed!
 */
function proxyPage(page, req, response, stop) {
  let target = new URL(page)
  req.headers.host = target.host
  req.headers.hostname = target.hostname

  const q = req.url.indexOf('?')
  const h = req.url.indexOf('#')
  const qstring = q > 0 ? req.url.substring(q) : ''
  const params = q > 0 ? qstring : h > 0 ? req.url.substring(h) : ''
  let externalAddr = page + params
  proxy.web(req, response, { target: externalAddr, ignorePath: true })
}
