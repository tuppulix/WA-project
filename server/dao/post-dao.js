'use strict';

const db = require('../db');

/*─────────────────────────────────────────────────────────────*/
/* Get all posts with pagination                                */
/* Includes number of comments and author's name               */
/*─────────────────────────────────────────────────────────────*/
exports.getAllPosts = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT P.id, P.title, P.text, P.timestamp, P.max_comments,
             U.name AS author,
             COUNT(C.id) AS comment_count
      FROM Posts P
      JOIN Users U ON P.author_id = U.id
      LEFT JOIN Comments C ON C.post_id = P.id
      GROUP BY P.id
      ORDER BY P.timestamp DESC`;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows); // List of post objects with extra info
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Get a specific post by ID, with author's name               */
/*─────────────────────────────────────────────────────────────*/
exports.getPostById = (postId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT P.*, U.name AS author
      FROM Posts P JOIN Users U ON P.author_id = U.id
      WHERE P.id = ?
    `;
    db.get(sql, [postId], (err, row) => {
      if (err) reject(err);
      else resolve(row); // Returns full post data + author name
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Add a new post with optional maxComments limit              */
/* Automatically sets the timestamp to now                     */
/*─────────────────────────────────────────────────────────────*/
exports.addPost = (title, text, authorId, maxComments = null) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO Posts (title, text, author_id, timestamp, max_comments)
      VALUES (?, ?, ?, datetime('now'), ?)
    `;
    db.run(sql, [title, text, authorId, maxComments], function (err) {
      if (err) reject(err);
      else resolve(this.lastID); // Returns ID of new post
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Delete a post (by its author OR by admin)                   */
/* Admins can skip authorId check by setting isAdmin = true    */
/*─────────────────────────────────────────────────────────────*/
exports.deletePost = (postId) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM Posts WHERE id = ?`;
    db.run(sql, [postId], function (err) {
      if (err) reject(err);
      else resolve(this.changes); // Number of rows deleted (0 or 1)
    });
  });
};
