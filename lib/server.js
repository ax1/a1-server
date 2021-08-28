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
const fsp = require("fs").promises
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

module.exports = { start, stop, use, addBefore, addAfter, Logger }

/*
 ██████  ██████  ███    ██ ███████ ██  ██████  ██    ██ ██████   █████  ████████ ██  ██████  ███    ██
██      ██    ██ ████   ██ ██      ██ ██       ██    ██ ██   ██ ██   ██    ██    ██ ██    ██ ████   ██
██      ██    ██ ██ ██  ██ █████   ██ ██   ███ ██    ██ ██████  ███████    ██    ██ ██    ██ ██ ██  ██
██      ██    ██ ██  ██ ██ ██      ██ ██    ██ ██    ██ ██   ██ ██   ██    ██    ██ ██    ██ ██  ██ ██
 ██████  ██████  ██   ████ ██      ██  ██████   ██████  ██   ██ ██   ██    ██    ██  ██████  ██   ████
*/

let configuration = {
  ssl: {
    /*key: '~/webapp/server.key',
     cert: '~/webapp/server.crt'
    */
  },
  serverName: '',
  welcomePage: 'index.html',
  port: '8080',
  staticFolder: 'public',
  dynamicFolder: 'app',
  rules: {
    '/': '/index.html'
  },
  Logger: Logger,
  debug: false /**No request logs by default*/
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
        if (prop === 'port') configuration[prop] = parseInt(customConfiguration[prop])
        else if (prop !== 'rules') configuration[prop] = customConfiguration[prop]
        else {
          const rules = customConfiguration[prop]
          Object.keys(rules).forEach(k => { if (!k.startsWith('/')) { rules['/' + k] = rules[k]; delete rules[k] } }) // if root not set in definition rule, add root to prevent route fail in runtime
          configuration.rules = { ...rules, ...configuration.rules }
        }
      }
    }
  }

  // The same as express, if PORT env, override defults
  if (process.env.PORT) configuration.port = parseInt(process.env.PORT)

  // Set DEBUG mode when user needs temporary to trace data
  if (process.env.DEBUG) configuration.debug = process.env.DEBUG === 'true' ? true : false

  setLogger(customConfiguration)
  pathRoot = process.env.SERVER_ROOT || process.cwd()
  pathStatic = path.join(pathRoot, configuration.staticFolder)
  pathDynamic = path.join(pathRoot, configuration.dynamicFolder)
  router.load(configuration.rules)
  security.init()
}

/*
███████ ████████  █████  ██████  ████████
██         ██    ██   ██ ██   ██    ██
███████    ██    ███████ ██████     ██
     ██    ██    ██   ██ ██   ██    ██
███████    ██    ██   ██ ██   ██    ██
*/

async function stop() {
  server.close()
}

/**
 * Start the server
 * @param {Object} customConfiguration Override default configuration. Example: { port: 8081 }
 * @return {Promise<http.Server>} server
 */
async function start(customConfiguration) {
  try {
    configure(customConfiguration)
    configureDefaultFatalErrors()
    if (configuration.ssl.key) {
      const options = { key: fs.readFileSync(configuration.ssl.key), cert: fs.readFileSync(configuration.ssl.cert) }
      server = https.createServer(options).listen(configuration.port)
    } else {
      server = http.createServer().listen(configuration.port)
    }
    printStartLog(configuration)
    const dispatcherNoLog = async (req, res) => await dispatch(req, res)
    const dispatcherNormal = async (req, res) => { if (configuration.debug) logRequest(req); await dispatch(req, res) }
    const dispatcherPerf = async (req, res) => res.end('hello world')
    const dispatcher = process.env.PERFORMANCE ? dispatcherPerf : process.env.SERVER_NO_LOG ? dispatcherNoLog : dispatcherNormal
    server.on('request', (req, res) => dispatcher(req, res).catch(err => logger ? logger.error(err) : console.log(err)))
    // server.on('request', (req, res) => {
    //   console.log('pasa por request'); res.end('eee')
    // })
    server.on('error', err => { logger.error(err); console.error(err) })
    return server
  } catch (err) {
    logger ? logger.error(err) : console.log(err)
    return err
  }
}

/**
 * Configure logger before doing anything else
 */
function setLogger(customConfiguration) {
  if (process.env.PERFORMANCE) configuration.Logger = Logger.NoOutputLogger
  else if (customConfiguration && customConfiguration.Logger) Logger.configure(customConfiguration.Logger)
  logger = Logger.getLogger('a1-server')
  if (customConfiguration && (customConfiguration.Logger === Logger.NoOutputLogger)) process.env.SERVER_NO_LOG = "true"
}

function getRoute(request) {
  let page = url.parse(request.url).pathname
  page = securityPreventPrivateFiles(page)
  return router.resolve(page, getDynamicPage)
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
    // check first if dynamic (because static pages are served by static servers in general)
    if (isDynamicPage(route.path)) {
      await plugins.executeBefore(route, request, response) // standard plugins
      await plugins.executeMiddleware(route, request, response) // express-like middleware
      await dispatchContent(route, request, response)
    } else {
      await dispatchContent(route, request, response) // if static, no need to execute plugins (fast responses)
    }
  } catch (err) {
    logger.error(err)
    if (!response.finished) await dispatchError(request, response, err)
  }
}

async function dispatchContent(route, request, response) {
  try {
    let realPath = route.path
    if (realPath !== '/' && realPath.endsWith('/')) realPath = realPath.substring(0, realPath.length - 1)
    if (isProxyPage(realPath, request)) {
      proxyPage(realPath, request, response)
    } else if (isDynamicPage(realPath)) {
      if (mustProcessBody(request, response)) {
        let body = ''
        request.on('data', function (data) {
          body = body + data
          if (body.length > 1000000) security.block(request)
        })
        request.on('end', function () {
          request.body = body
          dynamicPage(realPath, route.params, request, response).catch(async err => { logger.error(err); return await dispatchError(request, response, err) })
        })
        request.on('error', err => { throw err })
      } else {
        await dynamicPage(realPath, route.params, request, response)
      }
    } else {
      await staticPage(realPath, request, response)
    }
  } catch (err) {
    logger.error(err)
    await dispatchError(request, response, err)
  }
}

const bodyMethods = ['POST', 'PUT', 'DELETE', 'PATCH']

/**
 * Decide if the body must be processed  automatically or delegated to te controller file.
 * 
 * Automatic parsing is useful for REST services with JSON payload, but multipart is better to check twice before (because they can rise an evil denial of service, not authenticate user, etc)
 * See issue #6 
 * 
 * If content is file or multipart->delegated
 * else->parse automatically 
 */
function mustProcessBody(request, response) {
  if (request.body || request.files) return false // an external bodyparser or middleware is already set
  else if (bodyMethods.includes(request.method)) {
    if (request.headers['content-type'] && request.headers['content-type'].startsWith('multipart/form-data')) return false // security: files must be managed by the controller ( to decide if user can download or not)
    else return true //JSON data, plain text, etc
  }
}

async function dispatchError(request, response, error) {
  const err = security.purifyError(error, response)
  const page = response.statusCode.toString()
  const fn = await getStaticPage(page, request) ? staticPage : getDynamicPage(page) ? dynamicPage : defaultErrorPage
  fn(page, null, request, response, err).catch(error => defaultErrorPage(page, null, request, response, error))
}

/*
███████ ████████  █████  ████████ ██  ██████     ██████   █████   ██████  ███████
██         ██    ██   ██    ██    ██ ██          ██   ██ ██   ██ ██       ██
███████    ██    ███████    ██    ██ ██          ██████  ███████ ██   ███ █████
     ██    ██    ██   ██    ██    ██ ██          ██      ██   ██ ██    ██ ██
███████    ██    ██   ██    ██    ██  ██████     ██      ██   ██  ██████  ███████
*/

/*
 * Get file path of static page, null if not found
 */
async function getStaticPage(page, request) {
  const cleanPage = decodeURIComponent(page) // if the URL file has encoded whitespaces
  // check the exact path
  let fullPath = path.join(pathRoot, configuration.staticFolder, cleanPage)
  try {
    const stat = await fsp.stat(fullPath)
    if (stat.isFile()) return fullPath
    else if (request.url.endsWith('/')) {
      // if folder return the default index page
      const defaultPage = fullPath + '/' + configuration.welcomePage
      if (fs.existsSync(defaultPage)) return defaultPage
      else throw 404
    } else {
      throw 301 // if /folder (and no /folder/) the /folder/index.html could be returned BUT resources inside index.html (js files etc) are not requested properly from client browser
    }
  } catch (err) {
    if (err === 301) throw 301
    // if file is a .html file
    const realPage = hasExtension(fullPath) ? fullPath : fullPath + '.html'
    if (fs.existsSync(realPage)) return realPage
    else return null
  }
}

/**
 * Serve static content (html,js,css,img,...)
 */
async function staticPage(page, request, response) {
  let fullPath
  try {
    fullPath = await getStaticPage(page, request)
    if (fullPath) {
      response.setHeader('Content-Type', mime.contentType(path.extname(fullPath)))
      fs.createReadStream(fullPath).pipe(response)
    } else {
      response.writeHead(404, { "Content-Type": "text/plain" })
      response.end('NOT FOUND')
    }
  } catch (err) {
    if (err === 301) {
      const location = request.url.endsWith('/') ? request.url : request.url + '/'
      response.writeHead(301, { 'Location': location })
      response.end()
    } else throw err
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
  if (hasExtension(page)) return false
  else return true
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
function addQueryStringParams(request, params) {
  const u = url.parse(request.url)
  new url.URLSearchParams(u.search).forEach((value, key) => {
    if (!params) params = {}
    if (params[key] == null) params[key] = value
  })
  return params
}

const cacheImports = new Map() //import() is way slower than require() so we need to use cache
/**
 * Serve dynamic content:
 * - server-side templates(by js or by template engines)
 * - REST services (/services/resource/param1/param2/...)
 * - if not found, check if index.html exists
 */
async function dynamicPage(page, paramsREST, request, response) {
  let params = paramsREST
  let fullResourcePath = getDynamicPage(page)
  if (!fullResourcePath) return staticPage(page, request, response)

  // check service is available
  if (!cacheImports.has(fullResourcePath)) cacheImports.set(fullResourcePath, await import(fullResourcePath))
  const service = cacheImports.get(fullResourcePath)

  // check method is available
  const method = service[request.method.toLowerCase()]
  if (!method) throw (405)

  // process request
  params = addQueryStringParams(request, params)
  let data = await method(request, response, params)
  let output = null
  if (data?.pipe) {
    preventUnhandledStreamCrash(data, response)
    data.pipe(response) // big data is sent as stream
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
    if (!process.env.PERFORMANCE) {
      if (!response.getHeader('Content-Type')) response.setHeader('Content-Type', 'text/plain; charset=utf-8')
      await plugins.executeAfter(getRoute(request), request, response)
    }
    response.write(output)
    response.end()
  }
}

/**
 * Force closing connection
 * if developer didn't attach error event function, at least display in logs instead of failing silently.
 * If not controlled, the error is logged in the uncaughtException handler, but the front-end app remains in a loop waiting for the response object to be closed.
 */
function preventUnhandledStreamCrash(data, response) {
  //DISABLE the following line FOR NOW. because if developer is good, the strem error management should be done ok (sending data and closing the connection etc) but if developer is an scatterbrain, the socket will remain be open. So for the server itself it is better for now to force closing the socket.
  //if (data.listeners('error') && data.listeners('error').length > 0) return //existing handler, the developer should be responsible of closing  connection, freeing resources etc)
  data.on('error', err => {
    logger.error(err)
    data.close()
    if (response.statusCode < 400) response.statusCode = 500 //if developer did not set the real status problem
    response.end()
  })
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
 * Install standard plugins to be executed BEFORE processing the request
 * @param {Function|} func Sync or async function
 */
function addBefore(func, opts) {
  plugins.addBefore(func, opts)
}

/**
 * Install standard plugins to be executed AFTER processing the request and before sending the response
 * @param {Function|} func Sync or async function
 */
function addAfter(func, opts) {
  plugins.addAfter(func, opts)
}


/**
 * Log every request to the server
 */
function logRequest(request) {
  let obj = {}

  // general data
  const date = new Date()
  obj.date = date.toLocaleString()
  obj.method = request.method
  obj.path = request.url

  // only relevant headers to keep small logs
  const data = {}
  for (let header in request.headers) {
    if ((header === 'accept' || header === 'accept-language' || header === 'accept-encoding' || header === '') === false) {
      if (!security.isCriticalHeader(header)) data[header] = request.headers[header]
    }
  }

  // print
  const log = { ...obj, ...data, timestamp: date.getTime() }
  logger.info(JSON.stringify(log))
}

function printStartLog(configuration) {
  logger.info('\x1b[36m')
  const protocol = (configuration.ssl && configuration.ssl.key) ? 'https' : 'http'
  const url = `Server at ${protocol}://localhost:${configuration.port}`
  const len = url.length
  logger.info('―'.repeat(len))
  logger.info(url)
  logger.info('―'.repeat(len))
  logger.info('\x1b[0m')
}

async function defaultErrorPage(page, restParams, request, response, err) {
  let message = 'Internal Server Error'
  try { message = err.toString() } catch (e) { logger.error('Internal server error') }
  response.writeHead(page, { "Content-Type": "text/plain" })
  response.end(message)
}

/**
 * IMPORTANT: Handle critical errors (and prevent crashing the app)
 * External apps can add their own listener (and restart the app if needed).
 * Anyway, set a default log message
 * This is a good resource https://medium.com/dailyjs/how-to-prevent-your-node-js-process-from-crashing-5d40247b8ab2
 */
function configureDefaultFatalErrors() {
  //if (!process.listeners('uncaughtException'))

  // for callbacks, EventEmmiter and Stream unhandled errors (very common to forget adding the .on('error') implementation 
  process.addListener('uncaughtException', (err) => {
    console.error(err) //log even if logger is disabled!
    logger.critical(err.toString())
  })

  // for promises, or async/await not controlled by catch() 
  process.addListener('unhandledRejection', (msg, promise) => {
    const text = 'CRITICAL (unhandledRejection):' + msg
    console.error(text) //log even if logger is disabled!
    logger.critical(text)
  })

  // (not sure if useful, since eventEmmiter is only taken by uncaughtException) https://nodejs.org/api/errors.html#errors_err_unhandled_error
  process.addListener('unhandledError', (msg, promise) => {
    const text = 'CRITICAL (unhandledError):' + msg
    console.error(text) //log even if logger is disabled!
    logger.critical(text)
  })
}
