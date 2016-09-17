let persistence=require('../lib/persistence')
console.log('--------persistence--------')
async function test(){
  let db=await persistence.start(__dirname+'/../demo/database')
  let res=await db.findAsync({})
  assert('persistence ok')

}
test()
