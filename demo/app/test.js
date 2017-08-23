module.exports = {
  get,
  post
}

function get(request, response, params) {
  return 'hola caracola'
}

function post(request, response, params) {
  console.log(request.body)
  return request.body
}
