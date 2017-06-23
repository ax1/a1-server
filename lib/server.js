/**
 * Simple web server.
 *
 * Usage:
 *  let server=require("./server")
 *  server.start() //default config
 *  server.start(configuration) //non default configuration
 *  server.start(configuration).then((s)=>{...}) //once the server has started, execute the callback
 *
 * Application default skeleton:
 * --app [folder] (REST services, custom html, templates, etc)
 * --public[folder] (html,js,css static files)
 * --other stuff (private to the server, but it could be accessed from js files at /app by using require('../'))
 * --main.js (start the web server)
 */

module.exports = {
  start: start,
  use: use
}

const http = require("http")
const https = require("https")
const path = require("path")
const url = require("url")
const fs = require("fs")
const router = require("./router")
const plugins = require('./plugins')
const proxy = require('./proxy-external') // reverse proxy
const security = require('./security')
const Logger = require('./Logger')
//const proxy=require('./proxy-custom')

let server // the HTTP server
let pathStatic // path to static resources (html,css,js,img,...)
let pathDynamic // path to dynamic resources (server-side templates, REST services,...)
let logger

/*
 ██████  ██████  ███    ██ ███████ ██  ██████  ██    ██ ██████   █████  ████████ ██  ██████  ███    ██
██      ██    ██ ████   ██ ██      ██ ██       ██    ██ ██   ██ ██   ██    ██    ██ ██    ██ ████   ██
██      ██    ██ ██ ██  ██ █████   ██ ██   ███ ██    ██ ██████  ███████    ██    ██ ██    ██ ██ ██  ██
██      ██    ██ ██  ██ ██ ██      ██ ██    ██ ██    ██ ██   ██ ██   ██    ██    ██ ██    ██ ██  ██ ██
 ██████  ██████  ██   ████ ██      ██  ██████   ██████  ██   ██ ██   ██    ██    ██  ██████  ██   ████
*/


let configuration = {
  ssl: {
    /*key: fs.readFileSync('~/webapp/server.key'),
    cert: fs.readFileSync('~/webapp/server.crt')
    */
  },
  serverName: '',
  welcomePage: 'index.html',
  port: '8080',
  staticFolder: 'public',
  dynamicFolder: 'app',
  rules: {
    '/': 'index.html'
  },
  Logger: Logger
}

function configure(customConfiguration) {
  if (customConfiguration) {
    for (let prop of Object.keys(customConfiguration)) {
      if (prop !== 'rules') configuration[prop] = customConfiguration[prop]
      else {
        let newRules = customConfiguration[prop]
        for (let name of Object.keys(newRules)) configuration[prop][name] = newRules[name]
      }
    }
  }
  pathStatic = path.join(process.cwd(), configuration.staticFolder)
  pathDynamic = path.join(process.cwd(), configuration.dynamicFolder)
  router.load(configuration.rules)
}

/*
███████ ████████  █████  ██████  ████████
██         ██    ██   ██ ██   ██    ██
███████    ██    ███████ ██████     ██
     ██    ██    ██   ██ ██   ██    ██
███████    ██    ██   ██ ██   ██    ██
*/


/**
 * Start the server
 * @param {object} customConfiguration. Override default configuration
 * @return {http.Server} server
 */
async function start(customConfiguration) {
  try {
    configure(customConfiguration)
    configureDefaultFatalErrors()
    logger = configuration.Logger.getLogger('opamp')
    use(security.protect())
    if (configuration.ssl.key) {
      server = https.createServer(configuration.ssl).listen(configuration.port)
    } else {
      server = http.createServer().listen(configuration.port)
    }
    logger.info('---------------------------')
    logger.info("server at localhost:" + configuration.port)
    logger.info('---------------------------')
    server.on('request', function(request, response) {
      logRequest(request)
      request.on('error', (request, response) => dynamicPage('500', null, request, response))
      dispatch(request, response)
    })
    return server
  } catch (err) {
    logger.error(err)
    return err
  }
}

function getRoute(request) {
  let page = url.parse(request.url).pathname
  page = securityPreventPrivateFiles(page)
  return router.resolve(page)
}

async function executePlugins(route, request, response) {
  return plugins.executePlugins(route, request, response)
}

/*
██████  ██ ███████ ██████   █████  ████████  ██████ ██   ██ ███████ ██████
██   ██ ██ ██      ██   ██ ██   ██    ██    ██      ██   ██ ██      ██   ██
██   ██ ██ ███████ ██████  ███████    ██    ██      ███████ █████   ██████
██   ██ ██      ██ ██      ██   ██    ██    ██      ██   ██ ██      ██   ██
██████  ██ ███████ ██      ██   ██    ██     ██████ ██   ██ ███████ ██   ██
*/


async function dispatch(request, response) {
  try {
    let route = getRoute(request)
    if (isStaticPage(route.path)) {
      await dispatchContent(route, request, response) //if static, no need to execute plugins (fast responses)
    } else {
      await executePlugins(route, request, response)
      await dispatchContent(route, request, response)
    }
  } catch (err) {
    if (!response.finished) await dynamicPage('500', null, request, response)
    logger.error(err)
    throw err
  }
}

async function dispatchContent(route, request, response) {
  try {
    let realPath = route.path
    if (realPath !== '/' && realPath.endsWith('/')) realPath = realPath.substring(0, realPath.length - 1)
    if (isProxyPage(realPath, request)) {
      proxyPage(realPath, request, response)
    } else if (isDynamicPage(realPath)) {
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        let body = ''
        request.on('data', function(data) {
          body = body + data
          if (body.length > 1000000) security.block(request)
        })
        request.on('end', function() {
          this.body = body
          dynamicPage(realPath, route.params, request, response).catch(err => dynamicPage('500', err, request, response))
        })
      } else {
        dynamicPage(realPath, route.params, request, response).catch(err => {
          dynamicPage('500', err, request, response)
        })
      }
    } else {
      await staticPage(realPath, request, response)
    }
  } catch (err) {
    logger.error(err)
    await dynamicPage('500', request, response)
  }
}

/*
███████ ████████  █████  ████████ ██  ██████     ██████   █████   ██████  ███████
██         ██    ██   ██    ██    ██ ██          ██   ██ ██   ██ ██       ██
███████    ██    ███████    ██    ██ ██          ██████  ███████ ██   ███ █████
     ██    ██    ██   ██    ██    ██ ██          ██      ██   ██ ██    ██ ██
███████    ██    ██   ██    ██    ██  ██████     ██      ██   ██  ██████  ███████
*/

/**
 * HML page,js, css,images...etc
 */
function isStaticPage(page) {
  return hasExtension(page)
}

/**
 * Serve static content (html,js,css,img,...)
 */
async function staticPage(page, request, response) {
  let fullPath = path.join(process.cwd(), configuration.staticFolder, page)
  fs.exists(fullPath, function(exists) {
    if (!exists) {
      response.writeHead(404, { "Content-Type": "text/plain" })
      response.write('NOT FOUND')
      response.end()
    } else {
      fs.createReadStream(fullPath).pipe(response)
    }
  })
}

/*
██████  ██    ██ ███    ██  █████  ███    ███ ██  ██████     ██████   █████   ██████  ███████
██   ██  ██  ██  ████   ██ ██   ██ ████  ████ ██ ██          ██   ██ ██   ██ ██       ██
██   ██   ████   ██ ██  ██ ███████ ██ ████ ██ ██ ██          ██████  ███████ ██   ███ █████
██   ██    ██    ██  ██ ██ ██   ██ ██  ██  ██ ██ ██          ██      ██   ██ ██    ██ ██
██████     ██    ██   ████ ██   ██ ██      ██ ██  ██████     ██      ██   ██  ██████  ███████
*/

/**
 * Private Javascript or template processing
 */
function isDynamicPage(page) {
  return !hasExtension(page)
}

/**
 * Serve dynamic content:
 * - server-side templates(by js or by template engines)
 * - REST services (/services/resource/param1/param2/...)
 */
async function dynamicPage(page, paramsREST, request, response) {
  let resource = page
  let params = paramsREST
  try {
    let fullResourcePath = path.join(process.cwd(), configuration.dynamicFolder, resource + '.js')
    if (fs.existsSync(fullResourcePath) === false) return staticPage(page + '.html', request, response) // server/test=server/test.html
    let service = require(fullResourcePath)
    let output
    let data = await service[request.method.toLowerCase()](request, response, params)
    if (data && data.pipe) {
      return data.pipe(response) // big data is sent as stream
    } else {
      if (!data) {
        output = ''
      } else if (typeof(data) === 'object') {
        output = JSON.stringify(data)
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
      } else if (isNaN(data) == false) {
        output = String(data)
      } else {
        output = data
      }
      response.write(output)
      response.end()
    }

  } catch (err) {
    logger.error(err)
    throw err
  }
}

/*
██████  ██████   ██████  ██   ██ ██    ██     ██████   █████   ██████  ███████
██   ██ ██   ██ ██    ██  ██ ██   ██  ██      ██   ██ ██   ██ ██       ██
██████  ██████  ██    ██   ███     ████       ██████  ███████ ██   ███ █████
██      ██   ██ ██    ██  ██ ██     ██        ██      ██   ██ ██    ██ ██
██      ██   ██  ██████  ██   ██    ██        ██      ██   ██  ██████  ███████
*/

/**
 * Calling to aother server http://... instead of the current page
 * A page can be a proxy:
 *  - if current page fulfills an external route
 *  - if referer header fulfills an external route
 */
function isProxyPage(page, request) {
  if (page.indexOf('http:') === 0 || page.indexOf('https:') === 0) {
    return true
  } else {
    //TODO remove if not needed
    // if (request && request.headers.referer){
    //   let route=router.resolve(request.headers.referer)
    //   let realPath=route.path
    //   return isProxyPage(realPath)
    // }else return false
    return false
  }
}

/**
 * Request is actually addressing another server (reverse proxy).
 */
function proxyPage(page, request, response, stop) {
  proxy.proxyPage(page, request, response, stop)
}

/*
██    ██ ████████ ██ ██      ███████
██    ██    ██    ██ ██      ██
██    ██    ██    ██ ██      ███████
██    ██    ██    ██ ██           ██
 ██████     ██    ██ ███████ ███████
*/


function hasExtension(page) {
  let index = page.lastIndexOf('?')
  if (index > -1) page = page.substring(0, index)
  if (page.indexOf('.') > -1) return true
  else return false
}

/**
 * Prevent unwanted access to non server files (static or dynamic)
 * IMPORTANT: any security hole in this function may lead to execute or display any js inside the server,
 * SO BE CAUTIOUS WHEN MODIFYING THIS CODE
 * Some tampering examples:
 * - /public/private/pasword.txt/../../private/pasword.txt
 */
function securityPreventPrivateFiles(page) {
  if (page === '/') {
    page = configuration.welcomePage
  }
  let fullPath1 = path.join(process.cwd(), configuration.staticFolder, page)
  let fullPath2 = path.join(process.cwd(), configuration.dynamicFolder, page)
  if (fullPath1.indexOf(pathStatic) !== 0 && fullPath2.indexOf(pathDynamic) !== 0) page = '404.html'
  return page
}

/**
 * Install plugins that are compatible with connect and express
 * Express middleware can also be used as input
 */
function use(func) {
  plugins.use(func)
}

/**
 * Log every request to the server
 */
function logRequest(request) {
  let obj = {}
  for (let header in request.headers) {
    if ((header === 'accept' || header === 'accept-language' || header === 'accept-encoding' || header === '') === false) {
      obj[header] = request.headers[header]
    }
  }
  obj.path = request.url
  obj.method = request.method
  logger.info(JSON.stringify(obj))
}

/**
 * Handle critical errors
 * External apps can add their own listener (and restart the app if needed).
 * Anyway, set a default log message
 */
function configureDefaultFatalErrors() {
  //if (!process.listeners('uncaugthException'))
  process.addListener('uncaugthException', (err) => logger.critical(err.toString()))
  process.addListener('unhandledRejection', (msg, promise) => logger.critical(msg))
}
