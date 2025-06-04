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
const otplib = require('otplib');
const { check, validationResult } = require('express-validator');

// ────────────────────────────────────────────────────────────
// Internal modules (DAOs)
// ────────────────────────────────────────────────────────────
const postDAO = require('./dao/post-dao');
const commentDAO = require('./dao/comment-dao');
const flagDAO = require('./dao/flag-dao');
const userDAO = require('./dao/user-dao');
const db = require('./db');  // for direct DB access if needed

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
// Utility middlewares
// ────────────────────────────────────────────────────────────
const isLoggedIn = (req, _res, next) => {
  if (req.isAuthenticated()) return next();
  return _res.status(401).json({ error: 'Not authenticated' });
};

const isAdmin = (req, res, next) => {
  if (req.user?.is_admin && req.session?.isAdminAuthenticated) return next();
  return res.status(403).json({ error: 'Administrator privileges (2FA) required' });
};

// ────────────────────────────────────────────────────────────
// AUTH APIs (Login, Logout, Current Session)
// ────────────────────────────────────────────────────────────
app.post('/api/sessions', (req, res, next) => {
  const { otp = '', adminLogin = false } = req.body;   

  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ error: info?.message || 'Invalid credentials' });

    req.login(user, errLogin => {
      if (errLogin) return next(errLogin);

      /* ───── LOGICA 2-FA ─────────────────────────────────── */
      if (user.is_admin) {
        if (adminLogin) {
          // Richiesto login admin → OTP obbligatorio e valido
          const secret = user.totp_secret
          const validOtp = otplib.authenticator.check(otp.trim(), secret, { window: 0 });

          if (!validOtp)
            return res.status(401).json({ error: 'Invalid or missing OTP code' });

          req.session.isAdminAuthenticated = true;      // privilegi admin
        } else {
          // Login standard: entra come utente normale
          req.session.isAdminAuthenticated = false;
        }
      } else {
        // Utente non-admin
        req.session.isAdminAuthenticated = false;
      }
      /* ───────────────────────────────────────────────────── */

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        isAdminAuthenticated: req.session.isAdminAuthenticated
      });
    });
  })(req, res, next);
});




app.get('/api/sessions/current', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    is_admin: req.user.is_admin,
    isAdminAuthenticated: req.session.isAdminAuthenticated
  });
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => res.status(200).json({}));
});

// ────────────────────────────────────────────────────────────
// POSTS APIs
// ────────────────────────────────────────────────────────────
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await postDAO.getAllPosts(); // senza limit e offset
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await postDAO.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new post (only for authenticated users)
app.post('/api/posts', isLoggedIn, [
  check('title').trim().notEmpty(),
  check('text').trim().notEmpty(),
  check('maxComments').optional().isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  const { title, text, maxComments } = req.body;

  try {
    const id = await postDAO.addPost(title, text, req.user.id, maxComments ?? null);
    const post = await postDAO.getPostById(id);
    res.status(201).json(post);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Title must be unique' });
    res.status(500).json({ error: err.message });
  }
});

// Delete post (by author only)
app.delete('/api/posts/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await postDAO.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    await commentDAO.deleteCommentsByPostId(post.id);
    await postDAO.deletePost(post.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post as admin
app.delete('/api/admin/posts/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const post = await postDAO.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    await commentDAO.deleteCommentsByPostId(post.id);
    await postDAO.deletePost(post.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// COMMENTS APIs
// ────────────────────────────────────────────────────────────
// Count comments for a post
app.get('/api/posts/:postId/comments/count', async (req, res) => {
  try {
    const count = await commentDAO.getCommentCountByPost(req.params.postId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment (anonymous allowed)
app.post('/api/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  const authorId = req.isAuthenticated() ? req.user.id : null;
  const content = (req.body.text ?? '').toString().trim();

  if (!content.length) return res.status(422).json({ error: 'Comment text is required' });

  try {
    const post = await postDAO.getPostById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.max_comments !== null) {
      const count = await commentDAO.getCommentCountByPost(postId);
      if (count >= post.max_comments) return res.status(400).json({ error: 'Comment limit reached' });
    }

    await commentDAO.addComment(postId, authorId, content);
    const comments = await commentDAO.getCommentsByPost(postId);
    res.status(201).json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View comments (authenticated users only)
app.get('/api/posts/:postId/comments', isLoggedIn, async (req, res) => {
  try {
    const comments = await commentDAO.getCommentsByPost(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit own comment
app.put('/api/comments/:id', isLoggedIn, [check('text').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const comment = await commentDAO.getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await commentDAO.editComment(comment.id, req.body.text.trim());
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin edit any comment
app.put('/api/admin/comments/:id', isLoggedIn, isAdmin, [check('text').trim().notEmpty()], async (req, res) => {
  try {
    const comment = await commentDAO.getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    await commentDAO.editComment(comment.id, req.body.text.trim());
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete own comment
app.delete('/api/comments/:id', isLoggedIn, async (req, res) => {
  try {
    const comment = await commentDAO.getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await commentDAO.deleteComment(comment.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin delete any comment
app.delete('/api/admin/comments/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const comment = await commentDAO.getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    await commentDAO.deleteComment(comment.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// FLAGS APIs (user "flags" comments as interesting)
// ────────────────────────────────────────────────────────────
app.post('/api/comments/:id/flag', isLoggedIn, async (req, res) => {
  try {
    await flagDAO.addFlag(req.user.id, req.params.id);
    res.status(201).json({ message: 'Flag added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:id/flag', isLoggedIn, async (req, res) => {
  try {
    await flagDAO.removeFlag(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/me/flags', isLoggedIn, async (req, res) => {
  try {
    const flags = await flagDAO.getFlagsForUser(req.user.id);
    res.json(flags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// Start the server
// ────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
