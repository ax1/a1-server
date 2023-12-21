# a1-server

Small, efficient, web server.

All the basic features in one module, routing, static & dynamic pages, REST services and reverse-proxy.

Built-in logger, or use external loggers at any time with no code refactoring.

Install express/connect middleware or create your own plugins.

Check the [release notes](VERSIONS.md) for changes when updating the server.


## Installation

```bash
npm install a1-server
```

## 1 min Tutorial

The default configuration is port 8080, static files at folder `/public` and dynamic files at folder `/app`. The server can be used either on ESM projects or CJS projects.

---

### Project structure:
- /app
  - hello.js
- /public
  - index.html
- index.js
- package.json

---
### ESM syntax

Startup file at /index.js or /main.js :
```javascript
import * as server from 'a1-server'
await server.start()
```

Dynamic page at /app/hello.js;
```javascript
export function get() {
  return 'Now is '+ new Date()
}
```

Now start the server and browse to http://localhost:8080/hello
```sh
node index
```
---

### CJS syntax

Startup file at /index.js or /main.js :
```javascript
require('a1-server').start().catch(console.error)
```

Dynamic page at /app/hello.js;
```javascript
module.exports = { get }

function get() {
  return 'Now is '+ new Date()
}
```
Now start the server and browse to http://localhost:8080/hello
```sh
node index
```

## Full documentation

> HINT: check demo application in the module (node_modules/a1-server/demo)


### Starting the server

This module returns a promise after start(). The parameter returned is a node [http server](https://nodejs.org/api/http.html#http_class_http_server). Then you could use the node httpServer object to, for instance, attach a web socket.

```javascript
// --index.js page--
import * as server from 'a1-server'
// select start type (different options)
server.start()   // default 8080 port
server.start(8081) // custom port
server.start({...}) // config options, port, routing, etc
server.start().then(httpServer => {}).catch(err => {}) // perform actions after starting
```

now open terminal and type:

```sh
cd yourApp
node index.js
```

### Setting the port

- default port is 8080, no config required
- using the env variable PORT when starting `PORT=8081 node index`
- or use the port property in the index.js code `server.start(8081)`


### Configuration

To create a configuration object just add the properties you want to change, and pass the object when calling server.start()

```javascript
const configuration = {
  port: 3000,
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
    '/': 'index.html'
  },
  Logger: Logger,
  debug:false
}
```
### Environment variables

These variables are optional. Only for starting the app *without modifying the code* (config file, loggers, etc).

- PORT: override port `PORT=9000 node index`
- DEBUG: trace http requests and other hidden messages `DEBUG=true node index`
- PERFORMANCE: only for benchmarks and performance regressions detection `PERFORMANCE=true node index`

### Routing

Routing allows to:

- serve static resources and dynamically generated resources.
- beautify any .html request by removing the extension in the url.
- use plain .js files to process requests, or to create REST APIs.
- reverse proxying requests to other servers you trust in.


#### Automatic routing (the less config, the better)

- if the request has any extension (.html, .js, .css, .png, ...), a static file is served. This file should be located at the 'public' directory.
- if the request has not extension:
  - if name + ".html" exists, that static file is served.
  - otherwise, a js file is executed in the server, and the result is sent back.

Examples:
- /index.html will serve /public/index.html
- /index will serve /public/index.html, since it exists
- /process will execute /app/process.js

> Note: for REST services, automatic routing is also enabled to detect path parameters (and therefore no need to add routing rules in most of the cases). See in sub-section REST.

#### Custom Routing

By adding rules to the configuration. See  ['url-pattern'](https://www.npmjs.com/package/url-pattern) npm module.

> Note: For the same resources, the stricter rules must be written before the general ones because the routing will go to the first rule matching the url 

```javascript
const rules = {
  '/': '/index.html', // root page
  '/governance(/*)': 'http://server1:8081', // proxy to private server
  '/cars(/:id)': '', // REST service
  '/bikes(/:id)': '/other/', // another REST example
  '/machines/:id/search': 'search', // go to search service
  '/machines/:id/latest': 'latest', //go to latest service
  '/machines(/:id(/:date))': 'machines', // /machines /machines/abc or machines/abc/20201231
}
const configuration = { rules }
await server.start(configuration)
```

#### External Routing

> Note: external routing is only useful on development phase (for convenience) or when reusing static resources. For the rest of cases it is better to provide the external features in another server address and then add a rule for proxying the resource (e.g.:`'/governance(/*)': 'http://server1:8081'` or using Nginx to redirect).

> Note2: this is the same behaviour as default Nginx configuration for symbolic links.

In order to reuse /public and /app resources from other locations without copying them, you can create a symbolic link to the folder of the external resource. Only the files inside that folder (so no way to access parent resources by tricking with ../../) are provided. Note also that this feature should be used only in few cases and **as a general rule, for security, you should not add symbolic links in the server folders (public, app, )**.

Example:
- server1/app/control folder has persons.js and machines.js
- server2/app/ has a symbolic link to control, so persons and machines can be executed


### Static files

- drop the resources (html, js, css) into the `public` folder
- request the resources as usual `http://server/css/main.css`
- As a nice feature, the html files can also be requested without the extension (.html)




### Dynamic files
- create a .js file in the `app` folder
- exports the http methods you want to process (get post put delete options)
- implement the exported functions as [promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) or  [async](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/async_function) functions (or normal functions if no I/O processing). The output of the function should be either a JSON object, a simple type (number, string), or a [stream](https://nodejs.org/api/stream.html).


```javascript

// normal (synchronous) function since no blocking code
export function options(request, response, params) {
  return ['GET']
}

// async keyword to avoid blocking
export async function get(request, response, params) {
  return await database.get(params.id)
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
export function get(req, res, params) {
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
import { STATUS_CODES } from 'http'
export { get, post, put, remove} // note `remove` instead of delete, this is translated automatically to DELETE method 

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
    return STATUS_CODES[404] // optional, send status message
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

async function post(request, response, params) {
  const data = JSON.parse(request.body)
  if (!data.id) data.id = new Date().valueOf()
  db[data.id] = data
  response.statusCode = 201
  let location = request.url.endsWith('/')? request.url + data.id:request.url + '/' + data.id
  response.setHeader('Location', location)
  return data
}

async function put(...){...}

async function remove(...){...}
```

> Note: since `delete` is already a JS keyword, you can implement `remove()` method instead. Another option is to export any function name as an alias `export { remove as delete }`.

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
- **Setting the status code and text in the response**: You are responsible of sending useful info to the user or to the service client. But be careful not to send exception error texts from node core or modules (error.text = sensitive info).

```javascript
async function getItem(request, response, params) {
  const obj = cars[params.id]
  if (!obj) {
    response.statusCode = 404
    return 'Item not found'
    // return STATUS_CODES[404]
  }
  else return obj
}
```

### POST, PUT, DELETE & PATCH methods

Unlike GET method, these ones can contain data (payload) in the request. The built-in feature for these methods is to get the **payload and add it to the `request.body` parameter. The body type is always a `String`**. This is not applicable for files (see below). This is a trade-off between usability and performance. For small bodies it is handy just to call request.body instead of parsing the event, and for big forms or files, the content must be parsed manually. The default should be check authorization headers and so on before parsing a body (to reject content early), for small bodies it is useful to get them available, but for bigger ones, like files, it is better to force the application to process the request event.

Depending of body content-type to be sent:
- `http://server/?param1=value1 (application/x-www-form-urlencoded)`. `request.body` is available
- `JSON or text in body (text/plain, application/json)`. `request.body` is available as String
- `File or keyValue form (multipart/form-data)`. `request.body` not available. The body content must be parsed manually. See example in `demo` folder.

You can disable the built-in feature and use third party plugins ( [body-parser](https://www.npmjs.com/package/body-parser) and others) for parsing the body. These plugins usually add the `files` or `body` properties in the request.

### Plugins

A plugin is a function to be executed **before** a request is processed. Plugins can be useful to check if user is authenticated, to insert headers, to log every request to the server, and so on. Plugins can also be executed **after** the response output is created but not sent to client yet. This case is also useful for adding custom headers to the response based on the output. 

Plugins are executed when requesting dynamic content, not on static pages like html, css, etc (they are static!). In case any static resource should be processed, create it as a dynamic file, then process custom content as dynamic page or with a plugin. Note also that plugins can be slow because they are executed in **sequential** order. Once a plugin throws error, the request process will stop. In the long term, this is better, because it is easier to understand the list of steps just by looking the order of installation for the plugins.

There are two types of plugins:
- **standard plugins**. These plugins can be sync or async functions, and they can also be easily added to the *before* or to the *after* events. 
- **middleware plugins**. You can create or attach Express-like middleware with the `server.use()` method. Useful for reusing well-known, battle-tested middleware (passport, morgan, etc.). For custom middleware, do not forget to add next() or next(err) at the end of the function.


```javascript
import * as server from 'a1-server'

// standard sync plugin
server.addBefore((req, res) => console.log(req.url))

// standard async plugin
server.addBefore(async (req, res) => await checkAuthorization(req))

// standard plugin executed after output created but before sent to client
server.addAfter((req, res) => res.setHeader('X-verification', createToken(res)))

// express-type plugin (middleware)
const expressPlugin = require('expressPlugin')
server.use(expressPlugin())

// custom plugin in middleware format
server.use( (req, res, next) => {
  console.log('middleware executed')
  next()
})
```

### WebSockets [@Deprecated since Node21 has experimental websocket]

The code below is a full example of starting an http server and a websocket server. For more details, see the [ws](https://www.npmjs.com/package/ws) module package.

```javascript
import * as server from 'a1-server'
import { Server as WebSocketServer } from 'ws'

server.start()
  .then(httpServer => startWebsocket(httpServer))
  .catch(err => throw err)

function startWebsocket(httpServer) {
  let wss = new WebSocketServer({ server: httpServer })
  wss.on('connection', ws => {
    console.log('client open')
    ws.on('close', client => console.log('client closed'))
    ws.on('message', msg => ws.send('websocket server received ' + msg))
    ws.on('error', console.error)
    ws.on('pong', client => console.log('client is alive'))
  })
  return wss
} 
```

### Logging

There is a default built-in Logger tracing all requests and error responses into the console, so no need to use other logging systems. Anyway, if another Logger is preferred  (winston, bunyan, log4js, pino, etc...), this can be added into the configuration object before starting. This way, the log statements and the log imports do not need to be updated in the code when changing from one Logger to another.

```javascript
// STEP-1 configure the Logger to use when starting the server
const configuration = {
  Logger: require('winston')
}
server.start(configuration)

// STEP-2 use the standard logger (it behaves as a proxy for the real logger)
// in your js files
import * as server from 'a1-server'
const Logger = server.Logger
const logger = Logger.getLogger('your-logger-name')
// ...
logger.error(err) // logged by using winston
logger.info('hi') // logged by using winston
```
In development time, the default logger is attached to the console, so use logging instead of console.* methods from the beginning. If you prefer to have another logger later, just add it into the config object. 

```javascript
import {start,Logger} from 'a1-server'
start({ Logger: Logger.NoOutputLogger })
```

## Tips on development

- to reload automatically when files are saved, use nodemon or [pm2](https://www.npmjs.com/package/pm2) (`pm2 start app.js --watch`)

## Tips in production

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
