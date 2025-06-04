// middleware/auth.js


// ────────────────────────────────────────────────────────────
// Utility middlewares
// ────────────────────────────────────────────────────────────


// middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user?.is_admin && req.session?.isAdminAuthenticated) return next();
  return res.status(403).json({ error: 'Administrator privileges (2FA) required' });
};

// export the middlewares
module.exports = {
  isLoggedIn,
  isAdmin
};
