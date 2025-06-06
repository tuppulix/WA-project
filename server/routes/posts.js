const express = require('express');
const { check, validationResult } = require('express-validator');
const postDAO = require('../dao/post-dao');
const commentDAO = require('../dao/comment-dao');
const { isLoggedIn, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// ────────────────────────────────────────────────────────────
// POSTS APIs
// ────────────────────────────────────────────────────────────
router.get('/posts', async (req, res) => {
  try {
    const posts = await postDAO.getAllPosts(); // senza limit e offset
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await postDAO.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new post (only for authenticated users)
router.post('/posts', isLoggedIn, [
  check('title').trim().notEmpty(),
  check('text').trim().notEmpty(),
  check('maxComments').optional().isInt({ min: 0 })
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
router.delete('/posts/:id', isLoggedIn, async (req, res) => {
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
router.delete('/admin/posts/:id', isLoggedIn, isAdmin, async (req, res) => {
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

module.exports = router;
