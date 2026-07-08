const bcrypt = require('bcryptjs');
const User = require('../models/User');

const sanitizeUser = (u) => ({
  _id: u._id,
  username: u.username,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt
});

const getMe = async (req, res) => {
  res.json(sanitizeUser(req.user));
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('username email role createdAt').sort({ createdAt: -1 }).limit(200);
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username !== undefined) {
      const u = String(username).trim();
      if (!/^[a-zA-Z0-9_]{3,}$/.test(u)) return res.status(400).json({ message: 'Username: min 3 chars, letters/numbers/underscore only' });
      const exists = await User.findOne({ username: u, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
      user.username = u;
    }

    if (email !== undefined) {
      const e = String(email).trim().toLowerCase();
      if (!e.includes('@')) return res.status(400).json({ message: 'Valid email is required' });
      const exists = await User.findOne({ email: e, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ message: 'Email already taken' });
      user.email = e;
    }

    if (role !== undefined) {
      const r = String(role);
      if (!['admin', 'trainer', 'student'].includes(r)) return res.status(400).json({ message: 'Invalid role' });
      user.role = r;
    }

    await user.save();
    res.json({ message: 'Updated', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password required' });
    if (String(newPassword).length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) return res.status(400).json({ message: 'Current password is wrong' });

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminResetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password required' });
    if (String(newPassword).length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    res.json({ message: `Password reset for ${user.username}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMe, listUsers, adminUpdateUser, changeMyPassword, adminResetPassword };

