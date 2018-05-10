module.exports = { get, post, put }

function get(request, response, params) {
  if (params) throw new Error('No params are allowed')
  else return 'hola caracola'
}

function post(request, response, params) {
  console.log(request.body)
  return request.body
}

function put(request, response, params) {
  if (!params) throw new Error('No params are allowed')
  else return params
}