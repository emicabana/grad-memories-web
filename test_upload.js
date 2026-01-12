const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000';

// Crear una imagen PNG simple de 100x100 con texto (simulado con buffer)
// Para este test, usaremos un archivo de texto con contenido simulado
const testImagePath = path.join(__dirname, 'test_image.png');
if (!fs.existsSync(testImagePath)) {
  // Crear una imagen PNG válida mínima (1x1 rojo)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x02, // bit depth = 8, color type = 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xde, // CRC
    0x00, 0x00, 0x00, 0x0c, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xfe, 0xff, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, // CRC
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);
  fs.writeFileSync(testImagePath, pngHeader);
  console.log('Created test PNG image:', testImagePath);
}

async function makeRequest(method, path, body = null, token = null, files = null) {
  const url = `${BASE_URL}${path}`;
  const options = { method };

  if (files) {
    // FormData para upload con archivos
    const form = new FormData();
    if (files.file) {
      form.append('file', fs.createReadStream(files.file.path), files.file.filename);
    }
    options.body = form;
    options.headers = form.getHeaders();
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    if (body) options.body = JSON.stringify(body);
  }

  if (token) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    console.error(`Fetch error for ${path}:`, err.message);
    throw err;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('[PRUEBA] Subir asset con marca de agua');
  console.log('='.repeat(60));

  // Login
  console.log('\n[1] Login admin...');
  let result = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@gradmemories.com',
    password: 'admin123'
  });
  if (result.status !== 200) {
    console.error('ERROR: No se pudo hacer login');
    process.exit(1);
  }
  const token = result.data.token;
  console.log('✅ Login OK. Token:', token.substring(0, 30) + '...');

  // Upload image
  console.log('\n[2] Subiendo imagen de prueba...');
  result = await makeRequest('POST', '/api/uploads', null, token, {
    file: { path: testImagePath, filename: 'test-photo.png' }
  });
  console.log(`Status: ${result.status}`);
  if (result.status === 200) {
    const asset = result.data.asset;
    console.log('✅ Upload OK');
    console.log('Asset ID:', asset._id);
    console.log('Filename:', asset.filename);
    console.log('Preview path:', asset.previewPath);
    console.log('MIME type:', asset.mimeType);
  } else {
    console.error('❌ Upload failed:', result.data);
    process.exit(1);
  }

  // List assets
  console.log('\n[3] Listando todos los assets...');
  result = await makeRequest('GET', '/api/admin/assets', null, token);
  if (result.status === 200) {
    console.log('✅ Assets list OK');
    console.log(`Total assets: ${result.data.assets.length}`);
    result.data.assets.forEach((a, i) => {
      console.log(`\n  [${i + 1}] ${a.filename} (ID: ${a._id})`);
      console.log(`      Preview: ${a.previewPath}`);
      console.log(`      MIME: ${a.mimeType}`);
      console.log(`      Price: ${a.priceCents} centavos`);
    });
  } else {
    console.error('❌ List failed:', result.data);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Prueba de upload completada!');
  console.log('='.repeat(60));
  console.log('\nPróximos pasos:');
  console.log('1. Fijar precio del asset con /api/admin/assets/:id (PUT)');
  console.log('2. Crear preferencia de pago con /api/payments/create_preference (POST)');
  console.log('3. Configurar ngrok para webhook público');
  console.log('');
}

runTests().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});
