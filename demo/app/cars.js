const http = require('http')
/**
 * REST example
 */

const db = {
  "doKnnvbRCpt7fQaC": {
    name: "toyota",
    engine: "2222",
    id: "doKnnvbRCpt7fQaC"
  },
  "tibP9rhyyu3dzTtX": {
    name: "toyota",
    engine: "1111",
    id: "tibP9rhyyu3dzTtX"
  }
}

module.exports = {
  get,
  post,
  put,
  delete: remove
}

async function get(request, response, params) {
  if (params && Object.keys(params).length > 0) return db[params.id]
  else return db
}

async function post(request, response, params) {
  const data = JSON.parse(request.body)
  if (!data.id) data.id = new Date().valueOf()
  db[data.id] = data
  response.statusCode = 201
  let location = request.url
  if (location.endsWith('/')) location = location + data.id
  else location = location + '/' + data.id
  response.setHeader('Location', location)
  return data
}

async function put(request, response, params) {
  const data = JSON.parse(request.body)
  if (db[data.id]) {
    db[data.id] = data
    response.statusCode = 204
    return data
  } else {
    response.statusCode = 404
    return http.STATUS_CODES[404]
  }
}

async function remove(request, response, params) {
  if (params) {
    if (db[params.id]) {
      delete db[params.id];
      return 1
    } {
      response.statusCode = 404
      return http.STATUS_CODES[404]
    }
  } else {
    response.statusCode = 400
    return http.STATUS_CODES[400]
  }
}