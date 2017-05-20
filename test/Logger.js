/* eslint-env node, mocha */
// const chai = require('chai')
// const should = chai.should()
const Logger = require('../lib/Logger')
const winston = require('winston')

describe('built-in logger', () => {
  let logger
  it('should create the logger object', () => {
    logger = Logger.getLogger('built-in')
    logger.should.not.be.undefined
    logger.should.have.property('info')
  })
  it('should display info log', () => {
    logger.info('     this is one info message')
  })
})

describe('winston logger', () => {
  let logger
  it('should create the logger object', () => {
    logger = winston
    logger.should.not.be.undefined
    logger.should.have.property('info')
  })
  it('should display info log', () => {
    logger.info('     this is the same info message')
  })
})
