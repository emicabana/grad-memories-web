const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SECRET = process.env.JWT_SECRET || 'secretdev';

async function authRequired(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'No token' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ error: 'Bad token' });
  const token = parts[1];
  try{
    const payload = jwt.verify(token, SECRET);
    const user = await User.findById(payload.id);
    if(!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role){
  return (req, res, next) => {
    if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if(req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { authRequired, requireRole };
