const assert = require('assert')
const fetch = require('node-fetch')
const host = 'http://localhost:8080'

module.exports = { test }

async function test() {
  let path = host + '/governance'
  let res = await fetch(`${path}`)
  assert(res.ok, `Should access to ${res.url}`)

  path = host + '/governance?q=test'
  res = await fetch(path)
  assert(res.ok, `Should access to ${res.url}`)
  assert(res.url.includes('?q=test'), `Should access to ${res.url} with querystring`)
}
