// End-to-end smoke test using native http/https and form-data
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const FormData = require('form-data');

const base = process.env.SERVER_URL || 'http://127.0.0.1:3000';
const wait = (ms)=> new Promise(r=>setTimeout(r,ms));

function log(){ console.log.apply(console, arguments); }

function isHttps(u){ return u.startsWith('https://'); }

function doRequest(method, url, headers={}, body=null){
  return new Promise((resolve, reject)=>{
    try{
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const opts = { method, hostname: u.hostname, port: u.port, path: u.pathname + (u.search||''), headers };
      const req = lib.request(opts, (res)=>{
        const bufs = [];
        res.on('data', c=> bufs.push(c));
        res.on('end', ()=>{
          const text = Buffer.concat(bufs).toString('utf8');
          let json = null;
          try{ json = JSON.parse(text); }catch(e){}
          resolve({ status: res.statusCode, headers: res.headers, text, json });
        });
      });
      req.on('error', reject);
      if(body && body.pipe && typeof body.pipe === 'function'){
        body.pipe(req);
      }else if(body){
        req.write(body);
        req.end();
      }else req.end();
    }catch(e){ reject(e); }
  });
}

(async function(){
  // wait for health
  for(let i=0;i<30;i++){
    try{
      const h = await doRequest('GET', `${base}/api/health`);
      if(h.status === 200){ log('Server healthy'); break; }
      log('Health returned', h.status, h.text);
    }catch(e){ log('Health fetch error:', e && e.message); }
    log('Waiting for server...');
    await wait(1000);
  }

  // register admin
  const email = `testadmin+${Date.now()}@example.com`;
  const password = 'testpass';
  log('Registering admin', email);
  let r = await doRequest('POST', `${base}/api/auth/register`, { 'Content-Type':'application/json' }, JSON.stringify({ email, password, role: 'admin' }));
  log('register:', r.status, r.json || r.text);

  // login
  r = await doRequest('POST', `${base}/api/auth/login`, { 'Content-Type':'application/json' }, JSON.stringify({ email, password }));
  if(!r.json || !r.json.token){ log('Login failed', r); process.exit(1); }
  const token = r.json.token; log('Logged in, token length', (token||'').length);

  // create small test image
  const tmpDir = path.join(__dirname, '..', 'uploads', 'test_tmp'); if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive:true });
  const imgPath = path.join(tmpDir, 'test.jpg');
  const b64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAIBAQEBAQEBAQEBAQECAgICAgQDAgIDBAMEBQQFBQYGBQUHBwYICQoKCgoKCg0NDQ0NDQ0NDQ0NDQ0N/2wBDARESEhgVFBgVGBgYGRgYGRgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCAAQABADASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAABwYHCP/EAB8QAAICAgMBAQAAAAAAAAAAAAECAxEABBIhMUFRYf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD0gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=';
  fs.writeFileSync(imgPath, Buffer.from(b64, 'base64'));

  // upload via form-data
  log('Uploading test file...');
  const Form = new FormData();
  Form.append('file', fs.createReadStream(imgPath), { filename: 'test.jpg' });
  const headers = Object.assign(Form.getHeaders(), { 'Authorization': `Bearer ${token}` });
  const up = await doRequest('POST', `${base}/api/uploads`, headers, Form);
  log('upload:', up.status, up.json || up.text);
  if(!up.json || !up.json.asset){ log('Upload failed'); process.exit(1); }
  const assetId = up.json.asset._id; log('Uploaded assetId', assetId);

  // create preference
  log('Creating MP preference for asset', assetId);
  const pref = await doRequest('POST', `${base}/api/payments/create_preference`, { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, JSON.stringify({ assetId }));
  log('preference:', pref.status, pref.json || pref.text);

  // simulate webhook
  log('Simulating webhook POST');
  const wh = await doRequest('POST', `${base}/api/payments/webhook/mercadopago`, { 'Content-Type':'application/json' }, JSON.stringify({ id: '12345', type: 'payment' }));
  log('webhook result:', wh.status, wh.json || wh.text);

  log('E2E script finished');
  process.exit(0);
})();
