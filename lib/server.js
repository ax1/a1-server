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
const mime = require('mime-types')
//const proxy=require('./proxy-custom')

let server // the HTTP server
let pathRoot // path where app and public folders should be located
let pathStatic // path to static resources (html,css,js,img,...)
let pathDynamic // path to dynamic resources (server-side templates, REST services,...)
let logger

module.exports = { start, use, Logger }

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
  externalBodyParser: false,
  /* buil-in parser, if using external parsers (i.e: body-parser), enable this option*/
  Logger: Logger
}
/**
 * Configure the server before starting it
 * @param  {Object|int} customConfiguration either the port address, or object containing the properties to be overriden
 * @return {void}
 */
function configure(customConfiguration) {
  if (customConfiguration) {
    if (Number.isInteger(customConfiguration)) {
      configuration.port = parseInt(customConfiguration)
    } else {
      for (let prop of Object.keys(customConfiguration)) {
        if (prop !== 'rules') configuration[prop] = customConfiguration[prop]
        else {
          let newRules = customConfiguration[prop]
          for (let name of Object.keys(newRules)) configuration[prop][name] = newRules[name]
        }
      }
    }
  }
  pathRoot = process.cwd()
  pathStatic = path.join(pathRoot, configuration.staticFolder)
  pathDynamic = path.join(pathRoot, configuration.dynamicFolder)
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
 * @param {Object} customConfiguration Override default configuration. Example: { port: 8081 }
 * @return {Promise<http.Server>} server
 */
async function start(customConfiguration) {
  try {
    configure(customConfiguration)
    configureDefaultFatalErrors()
    logger = configuration.Logger.getLogger('a1-server')
    use(security.protect())
    if (configuration.ssl.key) {
      server = https.createServer(configuration.ssl).listen(configuration.port)
    } else {
      server = http.createServer().listen(configuration.port)
    }
    printStartLog(configuration)
    server.on('request', function (request, response) {
      // dispatch2(request, response)
      logRequest(request)
      dispatch(request, response)
    })
    server.on('error', err => { logger.error(err); console.error(err) })

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

async function dispatch2(request, response) {
  response.end('hello world')
}

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
    logger.error(err)
    if (!response.finished) await serverError(request, response, err)
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
      if (!configuration.externalBodyParser && (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE' || request.method === 'PATCH')) {
        let body = ''
        request.on('data', function (data) {
          body = body + data
          if (body.length > 1000000) security.block(request)
        })
        request.on('end', function () {
          request.body = body
          dynamicPage(realPath, route.params, request, response).catch(err => serverError(request, response, err))
        })
      } else {
        await dynamicPage(realPath, route.params, request, response)
      }
    } else {
      await staticPage(realPath, request, response)
    }
  } catch (err) {
    logger.error(err)
    await serverError(request, response, err)
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
 * DEV: this function must be fast as hell so use getStaticPage for hard check
 */
function isStaticPage(page) {
  return hasExtension(page)
}

/*
 * Get file path of static page, null if not found
 */
function getStaticPage(page) {
  let fullPath = path.join(pathRoot, configuration.staticFolder, page)
  const realPage = hasExtension(fullPath) ? fullPath : fullPath + '.html'
  const defaultPage = fullPath + '/' + configuration.welcomePage //on every folder, the default index page
  if (fs.existsSync(realPage)) return realPage
  else if (fs.existsSync(defaultPage)) return defaultPage
  else return null
}

/**
 * Serve static content (html,js,css,img,...)
 */
async function staticPage(page, request, response) {
  let fullPath = getStaticPage(page)
  if (fullPath) {
    response.setHeader('Content-Type', mime.contentType(path.extname(fullPath)))
    fs.createReadStream(fullPath).pipe(response)
  } else {
    response.writeHead(404, { "Content-Type": "text/plain" })
    response.end('NOT FOUND')
  }
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
 * DEV: this function must be fast as hell so use getDynamicPage for hard check
 */
function isDynamicPage(page) {
  return (!hasExtension(page)) ? true : false
}

/*
 * Get file path of dynamic page, null if not found
 */
function getDynamicPage(page) {
  if (hasExtension(page)) return null
  let fullResourcePath = path.join(pathRoot, configuration.dynamicFolder, page + '.js')
  if (fs.existsSync(fullResourcePath)) return fullResourcePath
  else return null
}

/**
 * Add querystring parameters without overriding REST params
 * @param {router} route
 */
function addQueryStringParams(request, params = {}) {
  const u = url.parse(request.url)
  new url.URLSearchParams(u.search).forEach((value, key) => {
    if (params[key] == null) params[key] = value
  })
}

/**
 * Serve dynamic content:
 * - server-side templates(by js or by template engines)
 * - REST services (/services/resource/param1/param2/...)
 * - if not found, check if index.html exists
 */
async function dynamicPage(page, paramsREST, request, response) {
  let params = paramsREST
  try {
    let fullResourcePath = getDynamicPage(page)
    if (!fullResourcePath) return staticPage(page, request, response)
    let service = require(fullResourcePath)
    addQueryStringParams(request, params)
    let output = null
    let data = await service[request.method.toLowerCase()](request, response, params)
    if (data && data.pipe) {
      return data.pipe(response) // big data is sent as stream
    } else {
      if (!data) {
        output = ''
      } else if (typeof (data) === 'object') {
        output = JSON.stringify(data)
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
      } else if (isNaN(data) == false) {
        output = String(data)
      } else {
        output = data
      }
      if (!response.getHeader('Content-Type')) response.setHeader('Content-Type', 'text/plain; charset=utf-8')
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
 * Calling to another server http://... instead of the current page
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
  let fullPath1 = path.join(pathRoot, configuration.staticFolder, page)
  let fullPath2 = path.join(pathRoot, configuration.dynamicFolder, page)
  if (fullPath1.indexOf(pathStatic) !== 0 && fullPath2.indexOf(pathDynamic) !== 0) page = '404.html'
  return page
}


/**
 * Install plugins that are compatible with connect and express
 * Express middleware can also be used as input
 * @param {Function} func
 */
function use(func) {
  plugins.use(func)
}

/**
 * Log every request to the server
 */
function logRequest(request) {
  if (!logger || logger instanceof Logger.NoOutputLogger) return
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

function printStartLog(configuration) {
  logger.info('\x1b[36m')
  logger.info('---------------------------')
  logger.info("server at localhost:" + configuration.port)
  logger.info('---------------------------')
  logger.info('\x1b[0m')
}

async function defaultErrorPage(page, restParams, request, response, err) {
  let message = 'Server error'
  try { message = err.toString() } catch (e) { logger.error('Internal server error') }
  response.writeHead(page, { "Content-Type": "text/plain" })
  response.end(message)
}

function serverError(request, response, err) {
  const page = '500'
  const fn = getDynamicPage(page) ? dynamicPage :
    getStaticPage(page) ? staticPage :
      defaultErrorPage
  fn(page, null, request, response, err).catch(error => defaultErrorPage(page, null, request, response, error))
}

/**
 * Handle critical errors
 * External apps can add their own listener (and restart the app if needed).
 * Anyway, set a default log message
 */
function configureDefaultFatalErrors() {
  //if (!process.listeners('uncaugthException'))
  process.addListener('uncaugthException', (err) => {
    console.error(err) //log even if logger is disabled!
    logger.critical(err.toString())
  })
  process.addListener('unhandledRejection', (msg, promise) => {
    console.error(msg) //log even if logger is disabled!
    logger.critical(msg)
  })
}
