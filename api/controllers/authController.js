const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SECRET = process.env.JWT_SECRET || 'secretdev';

async function register(req, res){
  const { email, password, role } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try{
    const u = new User({ email, role: role || 'user' });
    await u.setPassword(password);
    await u.save();
    res.json({ ok: true, id: u._id });
  }catch(e){
    res.status(400).json({ error: e.message });
  }
}

async function login(req, res){
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const u = await User.findOne({ email });
  if(!u) return res.status(401).json({ error: 'Invalid' });
  const valid = await u.validatePassword(password);
  if(!valid) return res.status(401).json({ error: 'Invalid' });
  const token = jwt.sign({ id: u._id, role: u.role }, SECRET, { expiresIn: '7d' });
  res.json({ ok: true, token, user: { id: u._id, email: u.email, role: u.role } });
}

module.exports = { register, login };
