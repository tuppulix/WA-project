'use strict';

// ────────────────────────────────────────────────────────────
// External dependencies
// ────────────────────────────────────────────────────────────
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local');


// ────────────────────────────────────────────────────────────
// Internal modules (DAOs)
// ────────────────────────────────────────────────────────────
const userDAO = require('./dao/user-dao');

// ────────────────────────────────────────────────────────────
// import routes
// ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authentication');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const flagRoutes = require('./routes/flags'); 

// ────────────────────────────────────────────────────────────
// App setup and middlewares
// ────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('dev')); // Log HTTP requests to the console
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Enable CORS for client
app.use(express.json()); // Parse incoming JSON requests
app.use(session({
  secret: 'ForumExamSecret', // Used to sign the session ID cookie
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());

// ────────────────────────────────────────────────────────────
// Authentication setup (passport.js)
// ────────────────────────────────────────────────────────────
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const user = await userDAO.verifyPassword(email, password);
      if (!user)
        return done(null, false, { message: 'Invalid email or password' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize and deserialize user info to store in session
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userDAO.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});


// ────────────────────────────────────────────────────────────
// Route mounting
// ────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', postRoutes);
app.use('/api', commentRoutes);
app.use('/api', flagRoutes); 

// ────────────────────────────────────────────────────────────
// Start the server
// ────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
