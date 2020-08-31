module.exports = { get }

function get(req, res, params) {
  const type = params?.p0
  if (!type) return 'Usage: GET /types/$type where type=object|array|string|number|undefined|null'
  switch (type) {
    case 'object': return {}
    case 'array': return []
    case 'string': return ''
    case 'number': return 0
    case 'undefined': return
    case 'null': return null
    default: throw Error('type not defined')
  }
}