module.exports = { get }

const { Readable } = require('stream')

function get(req, res) {
  const s = new Readable()
  s.push('this is a stream response, it could be as big as you want')
  s.push(null)
  return s
}
