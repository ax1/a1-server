const plugins = require('../lib/plugins')

module.exports = { test }
//---------------------- Standard plugins--------------------------------
// standard sync plugin
const pluginBefore = (req, res) => { }
const pluginBeforeAsync = async (req, res) => { }
const pluginAfter = (req, res) => { }

async function testPlugins() {
  plugins.addBefore(pluginBefore)
  plugins.addBefore(pluginBeforeAsync)
  plugins.addAfter(pluginAfter)
  await plugins.executeBefore()
  await plugins.executeAfter()
}

//---------------------- Middleware plugins--------------------------------
const pluginMiddleware = function (req, res, next) { next() }
const pluginMiddlewareAsync = function (req, res, next) { process.nextTick(function () { next() }) }

async function testMiddleware() {
  // install
  plugins.use(pluginMiddleware)
  plugins.use(pluginMiddlewareAsync)
  // execute
  await plugins.executeMiddleware()
}

async function test() {
  await testPlugins()
  await testMiddleware()
}