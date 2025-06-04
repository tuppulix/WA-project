const express = require('express');
const flagDAO = require('../dao/flag-dao');
const { isLoggedIn } = require('../middlewares/auth');

const router = express.Router();
// ────────────────────────────────────────────────────────────
// FLAGS APIs (user "flags" comments as interesting)
// ────────────────────────────────────────────────────────────
router.post('/comments/:id/flag', isLoggedIn, async (req, res) => {
  try {
    await flagDAO.addFlag(req.user.id, req.params.id);
    res.status(201).json({ message: 'Flag added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/comments/:id/flag', isLoggedIn, async (req, res) => {
  try {
    await flagDAO.removeFlag(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/me/flags', isLoggedIn, async (req, res) => {
  try {
    const flags = await flagDAO.getFlagsForUser(req.user.id);
    res.json(flags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
