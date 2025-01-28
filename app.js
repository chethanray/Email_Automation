// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const emailExtractorRoutes = require('./routes/emailExtractor');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login.html');
  }
}
s
// Routes
app.use('/auth', authRoutes);
app.use('/api', ensureAuthenticated, emailExtractorRoutes);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/public/assets')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
