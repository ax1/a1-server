/**
 * Logger wrapper(abstracting the real logger implementation)
 * Main implementations get the logger either logger.getLogger or new Logger. This library uses getLogger() to acomplish both methods
 */

let Logger
let loggers=new Map()

module.exports={configure,getLogger}

function configure(loggerSystem){
  Logger=loggerSystem
}

function getLogger(name){
  if (loggers.has(name)){
    return loggers.has(name)
  } else{
    if (!Logger) Logger=DefaultLogger
    let logger
    if (Logger.getLogger)  logger=Logger.getLogger(name)
    else logger=new Logger(name)
    loggers.set(name,logger)
    return logger
  }
}

class DefaultLogger{
  constructor(name){this.name=name}
  log(type,msg){this[type].message}
  configure(){}
  
  fatal(msg){console.error(msg)}
  warn(msg){console.log(msg)}
  error(msg){console.error(msg)}
  info(msg){console.log(msg)}
  debug(msg){console.log(msg)}
  trace(msg){console.log(msg)}

  //aliases
  critical(msg){this.fatal(msg)}
  warning(msg){this.warn(msg)}
  verbose(msg){this.debug(msg)}
  silly(msg){this.trace(msg)}
}
