
let UrlPattern=require('url-pattern')

module.exports={
  load:load,
  add:add,
  match:match,
  resolve:resolve
}

const patterns={}

function load(rules){
  for(let name of Object.keys(rules)){
    let pattern=new UrlPattern(name)
    let address=rules[name]
    if (!address) address=pattern.stringify()
    patterns[name]={pattern:pattern,address:address}
  }
}

function add(rules){
    load(rules)
}

function match(path){
  console.log('---------------')
  for(let name of Object.keys(patterns)){
    let match=patterns[name].pattern.match(path)
    if (match){
      console.log(match)
      console.log(patterns[name].pattern.stringify())
      console.log(patterns[name].pattern.stringify(match))
    }
  }
}

/**
 * Get the real path and REST params
 * Note that querystring params are located along with the path
 * @param {String} path -A URL path to match against current routing table
  *@return {Object} {path:the real path, params: the REST params}
 */
function resolve(path){
  let result
  for(let name of Object.keys(patterns)){
    let pattern=patterns[name].pattern
    let match=pattern.match(path)
    if (match){
      let mainpath=patterns[name].address
      if (match['_']){
        //pure URL (/p/a/t/h/?abcd)
        let subpath=match['_']
        if(!subpath) subpath=''
        if(mainpath.endsWith('/')===false) mainpath=mainpath+'/'
        if(subpath.startsWith('/')) subpath=subpath.substring(1)
        result={path:mainpath+subpath,params:match}
      }else{
        //REST service
        result={path:mainpath,params:match}
      }
      return result;
    }
  }
  //if not found return the path itself
  return {path:path,params:null}
}



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
  load(rules)
  for (let example of examples) {
    match(example)
    console.log(resolve(example).path)
  }
}

// test()
