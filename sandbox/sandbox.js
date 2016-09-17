

async function a(){
  //return 2456
  throw "this function throws errors "
}

async function b(){
  try{
    var val=await a()
    console.log('ha pasado por aquí')
    console.log(val)
  }catch(e){
    console.error(e)
  }

}


function c(){
    b()
}

c()
console.log('starting')
