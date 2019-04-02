const B = require("bluebird");

var arr = []

for(var i=0; i < 999999; i++) {
  arr.push(i)
}

const start = Date.now();

function test() {
  return new Promise((_resolve, rej) => {
    const ps = B.map(arr, (n)=>{ 
      return new Promise((resolve,reject)=>{ 
        resolve(n)
      })
    }, {concurrency: 8}).then( res => {
      console.log(res)
      _resolve(Date.now())
    })
  })
}

test().then((end) => {
  console.log(end - start)
})
