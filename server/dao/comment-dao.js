'use strict';
const db = require('../db');

/*─────────────────────────────────────────────*/
/* Fetch all comments for a given post         */
/* Includes author's name and flag count       */
/*─────────────────────────────────────────────*/
exports.getCommentsByPost = (postId) =>
  new Promise((resolve, reject) => {
    const sql = `
      SELECT C.id, C.text, C.timestamp, C.author_id, C.edited,
             U.name AS author,
             (SELECT COUNT(*) FROM InterestingFlags IF
              WHERE IF.comment_id = C.id) AS interesting_count
      FROM Comments C
      LEFT JOIN Users U ON C.author_id = U.id
      WHERE C.post_id = ?
      ORDER BY C.timestamp DESC`; // Newest comments first
    db.all(sql, [postId], (err, rows) =>
      err ? reject(err) : resolve(rows)
    );
  });

/*─────────────────────────────────────────────*/
/* Return the number of comments for a post    */
/*─────────────────────────────────────────────*/
exports.getCommentCountByPost = (postId) =>
  new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) AS count FROM Comments WHERE post_id = ?';
    db.get(sql, [postId], (err, row) =>
      err ? reject(err) : resolve(row.count)
    );
  });

/*─────────────────────────────────────────────*/
/*  Get ONE comment by id                      */
/*─────────────────────────────────────────────*/
exports.getCommentById = (commentId) =>
  new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Comments WHERE id = ?';
    db.get(sql, [commentId], (err, row) =>
      err ? reject(err) : resolve(row)
    );
  });

/*─────────────────────────────────────────────*/
/* Add a new comment to a post                 */
/* Anonymous if authorId is null               */
/* Timestamp is set to current datetime        */
/*─────────────────────────────────────────────*/
exports.addComment = (postId, authorId, text) =>
  new Promise((resolve, reject) => {
    const sql =
      `INSERT INTO Comments (post_id, author_id, text, timestamp)
       VALUES (?, ?, ?, datetime('now'))`; // 'edited' defaults to 0
    db.run(sql, [postId, authorId, text], function (err) {
      err ? reject(err) : resolve(this.lastID); // Return inserted comment ID
    });
  });

/*─────────────────────────────────────────────*/
/* Update comment text (by author or admin)    */
/* Sets edited flag to 1                       */
/*─────────────────────────────────────────────*/
exports.editComment = (commentId, newText) =>
  new Promise((resolve, reject) => {
    const sql =
      `UPDATE Comments
       SET text = ?, edited = 1
       WHERE id = ?`;
    db.run(sql, [newText, commentId], function (err) {
      err ? reject(err) : resolve(this.changes); // Number of rows changed
    });
  });

/*─────────────────────────────────────────────*/
/* Delete comment (only by its author)         */
/*─────────────────────────────────────────────*/
exports.deleteComment = (commentId) =>
  new Promise((resolve, reject) => {
    const sql =
      `DELETE FROM Comments WHERE id = ?`;
    db.run(sql, [commentId], function (err) {
      err ? reject(err) : resolve(this.changes); // Success if 1 row affected
    });
  });

/*─────────────────────────────────────────────*/
/* Delete all comments of a given post         */
/* Used when deleting a post                   */
/*─────────────────────────────────────────────*/
exports.deleteCommentsByPostId = (postId) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM Comments WHERE post_id = ?`;
    db.run(sql, [postId], function (err) {
      if (err) reject(err);
      else resolve(this.changes); // Return how many comments were deleted
    });
  });
};
