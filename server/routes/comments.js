const express = require('express');
const { check, validationResult } = require('express-validator');
const commentDAO = require('../dao/comment-dao');
const postDAO = require('../dao/post-dao');
const { isLoggedIn, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// ────────────────────────────────────────────────────────────
// COMMENTS APIs
// ────────────────────────────────────────────────────────────
// Count comments for a post
router.get('/posts/:postId/comments/count', async (req, res) => {
  try {
    const count = await commentDAO.getCommentCountByPost(req.params.postId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment (anonymous allowed)
router.post('/posts/:postId/comments', async (req, res) => {
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

// View comments (everyone can access, but filter if anonymous)
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const allComments = await commentDAO.getCommentsByPost(req.params.postId);

    // if the user is not authenticated, filter to show only anonymous comments
    if (!req.isAuthenticated()) {
      const anonymousOnly = allComments.filter(c => c.author_id === null);
      return res.json(anonymousOnly);
    }

    // If the user is logged in, show all comments
    res.json(allComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit own comment
router.put('/comments/:id', isLoggedIn, [check('text').trim().notEmpty()], async (req, res) => {
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
router.put('/admin/comments/:id', isLoggedIn, isAdmin, [check('text').trim().notEmpty()], async (req, res) => {
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
router.delete('/comments/:id', isLoggedIn, async (req, res) => {
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
router.delete('/admin/comments/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const comment = await commentDAO.getCommentById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    await commentDAO.deleteComment(comment.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
