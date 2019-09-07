/**
 * simple but powerful, zero npm dependencies, http 1.1 compliant reverse proxy
 */
let http = require("http")
let url = require("url")
let router = require("./router")
const logger = require('./Logger').getLogger('proxy-custom')

module.exports = {
  proxyPage: proxyPage
}

function proxyPage(page, request, response, stop) {
  let target
  if (request.headers.referer) {
    let externalAddr
    let route = router.resolve(url.parse(request.headers.referer).path)
    var urlReferer = url.parse(route.path)
    if (page.startsWith('/')) {
      externalAddr = urlReferer.protocol + '//' + urlReferer.host + page
    } else {
      var directory = route.path.substring(0, route.path.lastIndexOf('/'))
      externalAddr = directory + page
    }
    target = url.parse(externalAddr)
  } else {
    target = url.parse(page)
  }
  let headers = request.headers
  headers.host = target.host
  //by default only http 1.1 allowed, if errors in redirecting do:
  //Sending a 'Content-length' header will disable the default chunked encoding, probably hostname and port must be added instead of the host
  let options = {
    host: target.host,
    /*http 1.1*/
    hostname: target.hostname,
    port: target.port,
    /*http 1.0*/
    path: target.path,
    method: request.method,
    headers: headers
  }

  let req = http.request(options, function (res) {
    //res.setEncoding('utf8')
    res.on('data', (chunk) => {
      if (stop || (res.statusCode !== 301 && res.statusCode !== 302)) {
        response.write(chunk)
      }
    })
    res.on('end', () => {
      if (!stop && (res.statusCode === 301 || res.statusCode === 302)) {
        // for instance when requesting http://myserver and not http://myserver/, the server returns 302
        logger.trace(res.headers.location)
        proxyPage(res.headers.location, request, response, true)
      } else {
        response.end()
      }
    })
  })

  req.on('error', (error) => {
    logger.error(error)
    response.statusCode = 500
    response.write(error)
    response.end()
  })
  if (request.method === 'POST' || request.method === 'PUT') {
    req.write(request.body)
  }
  req.end()
}
