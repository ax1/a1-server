

async function a(){
  return 2456
}

async function b(){
  var val=await a()
  console.log('ha pasado por aquí')
  console.log(val)
}

b()
console.log('starting')
