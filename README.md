# a1-server

Next-gen **async/await** style web server. No need of callback style programming.

All the basic features in one module, routing, static & dynamic pages, REST services and reverse-proxy.

Built-in logger, or use preferred loggers at any time with no code refactoring.

Install express/connect middleware or create your own plugins.

## Main changes

### 2.0
- `params` contain the parameters in the queryString. No parsing queryString anymore!
- `params` is never null. Replace `if (!params)` by `(Object.keys(params).length==0)`
- Add MIME types in header automatically


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
// index.js page
const server = require('a1-server')
server.start()   // default
// server.start().then(httpServer => {...}).catch(err => {...}) // continue initializing server
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
  externalBodyParser: false, /* buil-in parser, if using external parsers (i.e: body-parser), enable this option*/
  Logger: Logger
}
```


### Routing

When routing you can:

- serve static resources and dynamically generated resources.
- beautify any .html request by removing the extension in the url.
- use plain .js files to process requests, or to create REST APIs.
- reverse proxying requests to other servers you trust in.


#### Automatic routing (recommended-no config!)

- if the request has an extension (.html, .js, .css, .png, ...), a static file is served. This file should be located at the 'public' directory
- if the request has not extension:
  - if name + ".html" exists, that static file is served.
  - otherwise, a js file is executed in the server, and the result is sent back.

Examples:
- /index.html will serve /public/index.html
- /index will serve /public/index.html, since it exists
- /process will execute /app/process.js

#### Custom Routing

By adding rules to the configuration. See  ['url-pattern'](https://www.npmjs.com/package/url-pattern) npm module.

```javascript
const rules = {
  '/': '/index.html', // root page
  '/governance(/\*)': 'http://server1:8081', // proxy to private server
  '/cars(/:id)': '', // REST service
  '/bikes(/:id)': '/other/' // another REST example
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

async function list(request, response, params) {
  return Object.keys(cars)
}
```
### POST, PUT, DELETE & PATCH methods

Unlike GET method, these ones can contain data (payload) in the request. The built-in feature for these methods is to get the **payload and add it to the `request.body` parameter. The body type is always a `String`**.

This allows *fastest* processing of the request, instead of parsing body data for unwanted requests. Besides, documentation keeps easier to understand and it allows flexible solutions. JSON parsing was enabled before but for real world projects you usually have to check things before parsing JSON (user authenticated, resource exists in the database, etc, and discard the request promptly, so in the end, best is to leave the developer when to parse the data).   

You can disable the built-in feature and use third party plugins ( [body-parser](https://www.npmjs.com/package/body-parser) and others) for parsing the body. Set `externalBodyParser == true` in the configuration object.

### Plugins

A plugin is a function to be executed **before** a request has been processed. Plugins can be useful to check if user is authenticated, to insert headers, to log every request to the server, and so on.

```
request -> is static file?
  |- yes -> send the file
  |- no -> executePlugins -> execute and send the dynamic file
```

Add plugins **the same way as connect or express middleware**. The plugins for these applications are **also valid** here (passport, morgan, cookie-parser, etc...).

For custom plugins, **don't forget** to add next() or next(err) at the end of the function.

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
