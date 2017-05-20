/**
 * Reverse proxy based on htpp-proxy
 */
let url = require("url")
let router = require("./router")
let http_proxy = require('http-proxy')
const logger = require('../lib/Logger').getLogger('proxy-custom')

module.exports = {
  proxyPage: proxyPage
}

let proxy = http_proxy.createProxyServer()
configureProxy()


function configureProxy() {

  proxy.on('error', function(err, req, res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });

    res.end('Something went wrong. And we are reporting a custom error message.');
  });

  //
  // Listen for the `proxyRes` event on `proxy`.
  //
  proxy.on('proxyRes', function(proxyRes, req, res) {
    logger.debug('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
  });

  //
  // Listen for the `open` event on `proxy`.
  //
  proxy.on('open', function(proxySocket) {
    // listen for messages coming FROM the target here
    proxySocket.on('data', function() {
      logger.trace('proxied')
    });
  });

  //
  // Listen for the `close` event on `proxy`.
  //
  proxy.on('close', function(res, socket, head) {
    // view disconnected websocket connections
    logger.trace('disconnected');
  });
}

//http-proxy cannot reverse rules line /customfolder/=>http://tecnalia.com because if calling /customfolder/a.txt is requested as http://tecnalia.com/customfolder/a.txt
//it only works well with server to server redirections server1:port=>server2:port
//it expects the same path for both servers
//very important ignorePath: true, if not , the real target is automatically created to target+path
function proxyPage(page, request, response, stop) {
  var externalAddr = page
  if (request && request.headers.referer) {
    let route = router.resolve(url.parse(request.headers.referer).path)
    var urlReferer = url.parse(route.path)
    if (page.startsWith('/')) {
      externalAddr = urlReferer.protocol + '//' + urlReferer.host + page
    } else {
      var directory = route.path.substring(0, route.path.lastIndexOf('/'))
      externalAddr = directory + page
    }
  }
  let target = url.parse(externalAddr)
  request.headers.host = target.host
  request.headers.hostname = target.hostname
  proxy.web(request, response, {
    target: externalAddr,
    ignorePath: true
  })
}
