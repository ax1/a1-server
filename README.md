# a1-server

Next-gen **async/await** style web server. No need of callback style programming.

All the basic features in one module, routing, static & dynamic pages, REST services and reverse-proxy.

Built-in logger, or use preferred loggers at any time with no code refactoring.

Install express/connect middleware or create your own plugins.

## Upgrading version

check the [release notes](VERSIONS.md)


## Installation

```bash
npm install a1-server
```

## 1 min Tutorial

Creating your own server has never been easier. The default configuration is quite handy (port 8080, static files at folder `/public` and dynamic files at `folder /app`)

Startup file at /index.js or /main.js :
```javascript
const server = require('a1-server')
server.start()
```

Dynamic page at /app/hello.js;
```javascript
module.exports = { get }
function get() {
  return 'Now is '+ (new Date()).toTimeString()
}
```

Now start the server and browse to http://localhost:8080/hello
```sh
node index
```

## 30 min Tutorial (or less)

> HINT: check demo application in the module (node_modules/a1-server/demo)


### starting the server

This module returns a promise after started. The parameter returned is a node [http server](https://nodejs.org/api/http.html#http_class_http_server). Then you could use the node httpServer object to, for instance, attach a web socket.

```javascript
// --index.js page--
const server = require('a1-server')
// select start type (3 options)
server.start()   // default
server.start(8081) // custom port
server.start({...}) // config options, port, routing, etc
server.start().then(httpServer => {}).catch(err => {}) // perform actions after starting
```

now open terminal and type:

```sh
cd yourApp
node index.js
```


### Configuration

To create a configuration object just add the properties you want to change, and pass the object when calling server.start()

```javascript
const configuration = {
  port: 80,
  rules: {
    '/': 'landing.html',
    '/intranet/*': '/private/'
  }
}

server.start(configuration)
```

Available options, and their default values:

```javascript
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
```


### Routing

Routing allows to:

- serve static resources and dynamically generated resources.
- beautify any .html request by removing the extension in the url.
- use plain .js files to process requests, or to create REST APIs.
- reverse proxying requests to other servers you trust in.


#### Automatic routing (the less config, the better)

- if the request has an extension (.html, .js, .css, .png, ...), a static file is served. This file should be located at the 'public' directory.
- if the request has not extension:
  - if name + ".html" exists, that static file is served.
  - otherwise, a js file is executed in the server, and the result is sent back.

Examples:
- /index.html will serve /public/index.html
- /index will serve /public/index.html, since it exists
- /process will execute /app/process.js

> Note: for REST services, automatic routing is also enabled to detect path parameters (and therefore no need to add routing rules in most of the cases). See in sub-section REST

#### Custom Routing

By adding rules to the configuration. See  ['url-pattern'](https://www.npmjs.com/package/url-pattern) npm module.

> Note: For the same resources, the stricter rules must be written before the general ones because the routing will go to the first rule matching the url 

```javascript
const rules = {
  '/': '/index.html', // root page
  '/governance(/\*)': 'http://server1:8081', // proxy to private server
  '/cars(/:id)': '', // REST service
  '/bikes(/:id)': '/other/', // another REST example
  '/machines/:id/search': 'search', // go to search service
  '/machines/:id/latest': 'latest', //go to latest service
  '/machines(/:id(/:date))': 'machines', // /machines /machines/abc or machines/abc/20201231
}
const configuration = { rules }
server.start(configuration)
```



### Static files

- drop the resources (html, js, css) into the `public` folder
- request the resources as usual `http://server/css/main.css`
- As a nice feature, the html files can also be requested without the extension (.html)




### Dynamic files
- create a .js file in the `app` folder
- exports the http methods you want to process (get post put delete options)
- implement the exported functions as [promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) or  [async](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/async_function) functions (or normal functions if no I/O processing). The output of the function should be either a JSON object, a simple type (number, string), or a [stream](https://nodejs.org/api/stream.html).

> IMPORTANT: no callbacks!!!

```javascript
module.exports = { options, get }

// normal (synchronous) function since no blocking code
function options(request, response, params) {
  return ['GET']
}

// async keyword to avoid blocking
async function get(request, response, params) {
  return database.get(params.id)
}
```

When the URL has a queryString, the `params` object is filled with these parameters.

### Creating a REST API

The same as with normal dynamic files. The only difference is to add a rule in the server configuration to be able to extract the 'path' parameters.
Since zero-config routing is also enabled for REST services, you could create a rest service  with no rule and read the rest parameters named p0, p1, etc. No decorators or dependency injection is required.

Thanks to automatic REST rule generation, no need to manual typing in most of the cases. Example: `/a/b/c/d` results in `file: app/a/b.js` and `params:{p0:c, p1:d}`. This allows direct reusability of REST services either by dropping or by linking into the /app folder. This also allows to generate REST services in real-time.


### Creating a ZERO-CONFIG REST API (most of the time you should use this)

Configuration: none (that's the key to reuse code without pain)

REST service:

```javascript
// file /app/people.js
module.exports = { get }

function get(req, res, params) {
  const name = params.p0
  const consult = params.p1
  return params
}
```

URL request:

http://localhost:8080/people/Harris/permissions where the service is `/people/`



### Creating a CUSTOM API

Sometimes you need or prefer explicit handling of the REST parameters, in this case add a custom rule in the configuration object when starting the server

Configuration:

```javascript
const rules = {
  '/cars(/:id)': '', /* /app/cars.js*/
  '/bikes(/:id)': '/inventory/motorbikes' /* /app/inventory/motorbikes.js*/
}
```

REST service:

The `params` object is already filled as declared in the rule. If the URL has a queryString, these parameters are also added to the `params` (but they do not override the REST ones if same keys).

```javascript
// file at /app/cars.js

const http = require('http')
module.exports = { get }

// emulate a database
var cars = {
  '1': { name: 'volvo', engine: '6V' },
  '2': { name: 'seat', engine: '4L' }
}

// in this case (no I/O code) async is not needed
// but in real world cases the methods should be asynchronous
async function get(request, response, params) {
  if (params.id) return await getItem(request, response, params)
  else return await list(request, response, params)
}

async function getItem(request, response, params) {
  const obj = cars[params.id]
  if (!obj) {
    response.statusCode = 404
    return http.STATUS_CODES[404] // optional, send status message
  }
  else return obj
}

// the same function, but simpler, throwing error instead of managing the response manually
async function getItem(request, response, params) {
  if (!cars[params.id]) throw(404) // also throw('404') and throw new Error('404')
  else return obj
}

async function list(request, response, params) {
  return Object.keys(cars)
}
```

> Note: to use the `delete` method, and avoid eslint or typescript warnings, declare the method with your preferred name (remove(), _delete(), etc...) in the `module.exports` variable. E.g: `module.exports = { get, post, put, delete: remove}`

### throw() vs response error

> Log errors is ok. Sending stack traces to users is silly.

There are two ways of sending errors:

- **Using throw(number) or throw(error)**: Recommended. Easy to code and to reason about. If you want to send a response error throw the HTTP error code as a number or throw the Exception. Since unhandled exceptions also throw errors, for security reasons, the response text is not sent to the client (i.e: if error is ENOENT file /home/gina/server/doc/3377 you would send that in that machine there is a user "gina", and the file location of your server, etc). **So by default, and for your safety**, the real error is not sent unless you handle the exception.

```javascript
async function getItem(request, response, params) {
  if (!cars[params.id]) throw(404)
  else return obj
}
```
- **Setting the status code and text in the response**: You are responsible of sending useful info to the user or to the service client. But be careful not to send exception error texts from node core or modules (error.text = sentitive info).

```javascript
async function getItem(request, response, params) {
  const obj = cars[params.id]
  if (!obj) {
    response.statusCode = 404
    return 'Item not found'
    // return http.STATUS_CODES[404]
  }
  else return obj
}
```

### POST, PUT, DELETE & PATCH methods

Unlike GET method, these ones can contain data (payload) in the request. The built-in feature for these methods is to get the **payload and add it to the `request.body` parameter. The body type is always a `String`**. This is not applicable for files (see below). This is a trade-off between usability and performance. For small bodies it is handy just to call request.body instead of parsing the event, and for big forms or files, the content must be parsed manually. The default should be check authorization headers and so on before parsing a body (to reject content early), for small bodies it is useful to get them available, but for bigger ones, like files, it is better to force the application to process the request event.

Depending of body content-type to be sent:
- `http://server/?param1=value1 (application/x-www-form-urlencoded)`. `request.body` is available
- `JSON or text in body (text/plain, application/json)`. `request.body` is available as String
- `File or keyvalue form (multipart/form-data)`. `request.body` not available. The body content must be parsed manually. See example in `demo` folder.

You can disable the built-in feature and use third party plugins ( [body-parser](https://www.npmjs.com/package/body-parser) and others) for parsing the body. These plugins usually add the `files` or `body` properties in the request.

### Plugins

A plugin is a function to be executed **before** a request has been processed. Plugins can be useful to check if user is authenticated, to insert headers, to log every request to the server, and so on.

```
request -> is static file?
  |- yes -> send the file
  |- no -> executePlugins -> execute and send the dynamic file
```

Add plugins **the same way as connect or express middleware**. The plugins for these applications are **also valid** here (passport, morgan, cookie-parser, etc...).

For custom plugins, **remember** to add next() or next(err) at the end of the function.

```javascript
// express-type plugin (middleware)
const morgan = require('morgan')
server.use(morgan('combined'))

// custom plugin
server.use( (req, res, next) => {
  console.log('middleware executed')
  next()
})
```

### WebSockets

The simplest way is by using the [ws](https://www.npmjs.com/package/ws) module, already downloaded with the server.

```javascript
const WebSocketServer = require('ws').Server

server.start(serverConfiguration)
  .then(httpServer => startWebsocket(httpServer))
  .catch(err => throw err)

  function startWebsocket(httpServer) {
    const wss = new WebSocketServer({ server: httpServer })
    wss.on('connection', ws => {
      ws.on('message', message => {
        ws.send('response from the server')
      })
    })
  }  
```

### Logging

By default no logging module is required (for better performance), but if any of the most popular logging systems (winston, bunyan, log4js, etc...) is a requirement, that logging component can be added in the configuration object.

This way, a developer only needs to use the Logger class shipped with the server. If in the future, the real logger is replaced by a new one, no code changes are required, just set the new logger you want to use in the configuration object.

```javascript
// STEP-1 configure the Logger to use when starting the server
const configuration = {
  Logger: require('winston')
}
server.start(configuration)

// STEP-2 use the standard logger (it behaves as a proxy for the real logger)
// in the js files
const Logger = require('a1-server').Logger
const logger = Logger.getLogger('your-logger-name')
// ...
logger.error(err) // logged by using winston
logger.info('hi')
```
In development time, the default logger is attached to the console, so use logging instead of console.* methods from the beginning. If you prefer to have no logger output in development mode (for instance, to test requests performance), configure the Logger to NoOutputLogger.

```javascript
let Logger = require('a1-server').Logger
Logger.configure(Logger.NoOutputLogger) //no output
```

## Tips on development

- to reload automatically when files are saved, use nodemon or [pm2](https://www.npmjs.com/package/pm2) (`pm2 start app.js --watch`)

## Tips on production

To get the maximum performance, there are several useful techniques:
- to use all CPU cores, use the cluster API or [pm2](https://www.npmjs.com/package/pm2) (`pm2 start app.js -i 0`)
- to serve static files, either put the /public folder directly in a nginx location or keep the /public folder into the application and add a rule in the nginx (`location ~* \.(css|js|gif|jpe?g|png)$ { expires 168h; }`)
- to hide servers and/or ports, use nginx as reverse-proxy (it's faster than the built-in proxy)
- to scale horizontally, use nginx as a load balancer

Example of nginx config:
```nginx
upstream project {
    #ip_hash to keep users talking to the same server.
    ip_hash ;
    #the multiple servers, each running pm2
    server 22.22.22.2:3000;
    server 22.22.22.3:3000;
    server 22.22.22.5:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://project;
    }
    location ~* \.(css|js|gif|jpe?g|png)$ {
        expires 168h;
    }
}
```
More info at:

https://www.reddit.com/r/node/comments/6uwbh2/ive_used_pm2_to_scale_my_app_across_cores_on_a/

https://www.nginx.com/blog/5-performance-tips-for-node-js-applications/


## Final note for benchmarks

99% of the time , the default config is OK.

For benchmarking against other platforms, add the `SERVER_PERFORMANCE` environment var. E.g:`SERVER_PERFORMANCE=true npm start`. This mode disables custom routing and logs (as other frameworks do) but it is useful only to 1-compare relative speed and 2-check performance regressions on new node or lib versions.