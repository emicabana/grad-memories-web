const http = require('http');

function request(options, body){
  return new Promise((resolve,reject)=>{
    const req = http.request(options, res=>{
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>{
        try{ resolve({status:res.statusCode, body: JSON.parse(data)}); }catch(e){ resolve({status:res.statusCode, body: data}); }
      });
    });
    req.on('error', reject);
    if(body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run(){
  try{
    const login = await request({ hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST', headers: {'Content-Type':'application/json'}}, { email: 'admin@gradmemories.com', password: 'admin123' });
    console.log('login', login.status, login.body);
    const token = login.body && login.body.token;
    if(!token) return console.error('no token');
    const assetId = '693f476bc421c94330e3317b';
    const pref = await request({ hostname:'localhost', port:3000, path:'/api/payments/create_preference', method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': 'Bearer '+token } }, { assetId });
    console.log('create_pref', pref.status, pref.body);
  }catch(e){ console.error(e); }
}
run();
