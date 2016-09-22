/*
████████  ██████  ██████   ██████
   ██    ██    ██ ██   ██ ██    ██
   ██    ██    ██ ██   ██ ██    ██
   ██    ██    ██ ██   ██ ██    ██
   ██     ██████  ██████   ██████
*/

/* eslint-env node, mocha */
const chai=require('chai')
const should=chai.should()
const Logger=require('../lib/Logger')
const router=require('../lib/routes')

function test(){
  let rules={
    '/':'/index.html',
    '/governance(/*)':'http://google.com',
    '/cars(/:id)':'',
    '/bikes(/:id)':'/other/'
  }
  let examples=[
    '/',
    '/governance',
    '/governance/car/test/?users.html',
    '/bikes/33'
  ]
  router.load(rules)
  for (let example of examples) {
    router.match(example)
    console.log(router.resolve(example).path)
  }
}

test()
