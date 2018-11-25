module.exports = { get, post, put }

function get(request, response, params) {
  return 'hola caracola'
}

async function post(request, response, params) {
  if (request.headers['content-type'].startsWith('multipart/form-data')) {
    // multipart/form body-> process event manually
    return new Promise((resolve, reject) => {
      let body = ''
      request.on('data', function (data) { body = body + data; if (body.length > 1000000) throw (500) })
      request.on('end', () => { request.body = body; console.log(body); resolve(body) })
      request.on('error', err => reject(err))
    })
  } else {
    return request.body
  }
}

function put(request, response, params) {
  if (!params) throw new Error('No params are not allowed')
  else return params
}