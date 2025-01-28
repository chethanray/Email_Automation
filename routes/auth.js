const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && user.password === password) {
    req.session.user = user;
    res.redirect('/index.html');
  } else {
    res.status(401).send('Invalid email or password');
  }
});

// Register route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = new User({ email, password });
    await user.save();
    res.redirect('/login.html');
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send('Email already in use. Please use a different email.');
    } else {
      res.status(500).send('Error during registration. Please try again later.');
    }
  }
});



// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.clearCookie('connect.sid');
    res.status(200).send('Logout successful');
  });
});

module.exports = router;



