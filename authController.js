const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const createToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: 'Valid email is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (role === 'admin') return res.status(403).json({ message: 'Cannot register as admin' });
    if (role === 'student' && !email.endsWith('@gmail.com')) return res.status(400).json({ message: 'Students must use a @gmail.com email' });
    if (role === 'trainer' && !email.endsWith('@fitmanager.com')) return res.status(400).json({ message: 'Trainers must use a @fitmanager.com email' });

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(400).json({ message: 'Username or email already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword, role: role || 'student' });
    const token = createToken(user);
    res.status(201).json({ message: 'Registered', username: user.username, role: user.role, userId: user._id, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid username or password' });

    const token = createToken(user);
    res.json({ message: 'Login successful', username: user.username, role: user.role, userId: user._id, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const me = async (req, res) => {
  res.json({
    userId: req.user._id,
    username: req.user.username,
    role: req.user.role,
    email: req.user.email
  });
};

module.exports = { register, login, me };
