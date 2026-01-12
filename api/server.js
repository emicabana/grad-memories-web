const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server script');
console.log('Node version:', process.version);
console.log('Working dir:', process.cwd());
console.log('Env PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV || '');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradmemories';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Mongo connect error', err));

app.use(cors());
app.use(bodyParser.json());

// Routes
const authRoutes = require('./routes/auth');
const uploadsRoutes = require('./routes/uploads');
const paymentsRoutes = require('./routes/payments');
const downloadsRoutes = require('./routes/downloads');
const adminRoutes = require('./routes/admin');

// Serve public previews
const uploadsDir = path.join(__dirname, '..', 'uploads');
const previewsDir = path.join(uploadsDir, 'previews');
app.use('/previews', express.static(previewsDir));

app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Global error handlers to capture unexpected crashes
process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err && (err.stack || err));
});
process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection', err && (err.stack || err));
});

console.log('Process PID:', process.pid);
console.log('MONGODB_URI:', MONGODB_URI);

// Bind to all interfaces explicitly to avoid localhost resolution issues
let server;
try{
    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`API server listening on port ${PORT}`);
        try{ console.log('server.address():', server.address()); }catch(e){}
    });
}catch(e){
    console.error('Error calling app.listen', e && (e.stack || e));
}

process.on('exit', (code) => {
    console.log('Process exiting with code', code);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down');
    try{ console.log('SIGINT stack:', new Error().stack); }catch(e){}
    try{ console.log('uptime (s):', process.uptime()); }catch(e){}
    try{ if(server && server.close) server.close(); }catch(e){}
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down');
    try{ if(server && server.close) server.close(); }catch(e){}
    process.exit(0);
});

