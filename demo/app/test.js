module.exports = { get, post, put }

function get(request, response, params) {
  return 'hola caracola'
}

function post(request, response, params) {
  console.log(request.body)
  return request.body
}

function put(request, response, params) {
  if (Object.keys(params).length === 0) throw new Error('params are required')
  else return params
}