const express = require('express');
const router = express.Router();
const passport = require('passport');
const otplib = require('otplib');

// ────────────────────────────────────────────────────────────
// AUTH APIs (Login, Logout, Current Session)
// ────────────────────────────────────────────────────────────
router.post('/sessions', (req, res, next) => {
  const { otp = '', adminLogin = false } = req.body;

  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ error: info?.message || 'Invalid credentials' });

    req.login(user, errLogin => {
      if (errLogin) return next(errLogin);

      /* ───── LOGICA 2-FA ─────────────────────────────────── */

      if (!user.is_admin && adminLogin) {
        return res.status(403).json({ error: 'You are not allowed to log in as admin' });
      }

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




router.get('/sessions/current', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    is_admin: req.user.is_admin,
    isAdminAuthenticated: req.session.isAdminAuthenticated
  });
});

router.delete('/sessions/current', (req, res) => {
  req.logout(() => res.status(200).json({}));
});

module.exports = router;
