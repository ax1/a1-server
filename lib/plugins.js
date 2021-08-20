/**
 * Adapt a server to install standard plugins or express-like compatible middleware.
 * See README.md for examples.
 */

module.exports = { use, executeMiddleware, addBefore, addAfter, executeBefore, executeAfter }


/*
 █████╗ ███████╗██╗   ██╗███╗   ██╗ ██████╗    ██████╗ ██╗     ██╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗
██╔══██╗██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝    ██╔══██╗██║     ██║   ██║██╔════╝ ██║████╗  ██║██╔════╝
███████║███████╗ ╚████╔╝ ██╔██╗ ██║██║         ██████╔╝██║     ██║   ██║██║  ███╗██║██╔██╗ ██║███████╗
██╔══██║╚════██║  ╚██╔╝  ██║╚██╗██║██║         ██╔═══╝ ██║     ██║   ██║██║   ██║██║██║╚██╗██║╚════██║
██║  ██║███████║   ██║   ██║ ╚████║╚██████╗    ██║     ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║███████║
╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝    ╚═╝     ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝

*/
const pluginsBefore = []
const pluginsAfter = []

function addBefore(fn, options) {
  pluginsBefore.push([fn, options])
}

function addAfter(fn, options) {
  pluginsAfter.push([fn, options])
}

/**
 * Execute plugins IN SEQUENTIAL ORDER.
 * Even if performance is poorer due to sequence instead of Parallel.
 * This is due to preserve pluging execution. If the first one is a 
 * general app control, no other pluging is executed until this one is OK. 
 */
async function executeBefore(route, req, res) {
  for (let [fn, options] of pluginsBefore) {
    await fn(req, res)
  }
}

async function executeAfter(route, req, res) {
  for (let [fn, options] of pluginsAfter) {
    await fn(req, res)
  }
}

/*
███████╗██╗  ██╗██████╗ ██████╗ ███████╗███████╗███████╗    ███╗   ███╗██╗██████╗ ██████╗ ██╗     ███████╗██╗    ██╗ █████╗ ██████╗ ███████╗
██╔════╝╚██╗██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝    ████╗ ████║██║██╔══██╗██╔══██╗██║     ██╔════╝██║    ██║██╔══██╗██╔══██╗██╔════╝
█████╗   ╚███╔╝ ██████╔╝██████╔╝█████╗  ███████╗███████╗    ██╔████╔██║██║██║  ██║██║  ██║██║     █████╗  ██║ █╗ ██║███████║██████╔╝█████╗
██╔══╝   ██╔██╗ ██╔═══╝ ██╔══██╗██╔══╝  ╚════██║╚════██║    ██║╚██╔╝██║██║██║  ██║██║  ██║██║     ██╔══╝  ██║███╗██║██╔══██║██╔══██╗██╔══╝
███████╗██╔╝ ██╗██║     ██║  ██║███████╗███████║███████║    ██║ ╚═╝ ██║██║██████╔╝██████╔╝███████╗███████╗╚███╔███╔╝██║  ██║██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═╝     ╚═╝╚═╝╚═════╝ ╚═════╝ ╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝

*/

let middleware = []

/**
 * Install express plugin
 * @param {function} func should be a func(request,response,next)
 */
function use(func) {
  middleware.push(func)
}

/**
 * Execute all the plugins installed before the request is processed
 */
async function executeMiddleware(route, req, res) {
  let index = -1

  /**
   * To allow async middleware functions next is async.
   * To keep middleware-like, next behaves as sync, so the async is executed  in the fn as a promise
   */
  function next(err) {
    if (err) throw (err)
    index++
    if (index >= middleware.length) return
    let fn = middleware[index]
    if (!fn) next(err)
    fn(req, res, next)
  }

  next()
}