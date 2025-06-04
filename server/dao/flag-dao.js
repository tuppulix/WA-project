'use strict';

const db = require('../db');

/*─────────────────────────────────────────────────────────────*/
/* Add a "flag" (mark as interesting) to a comment             */
/* Only one flag per user per comment is allowed               */
/* 'INSERT OR IGNORE' avoids duplicates                        */
/*─────────────────────────────────────────────────────────────*/
exports.addFlag = (userId, commentId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO InterestingFlags (user_id, comment_id) VALUES (?, ?)
    `;
    db.run(sql, [userId, commentId], function (err) {
      if (err) reject(err);
      else resolve(this.changes); // 1 if inserted, 0 if already existed
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Remove a flag from a comment by the specified user          */
/*─────────────────────────────────────────────────────────────*/
exports.removeFlag = (userId, commentId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM InterestingFlags WHERE user_id = ? AND comment_id = ?
    `;
    db.run(sql, [userId, commentId], function (err) {
      if (err) reject(err);
      else resolve(this.changes); // 1 if removed, 0 if none existed
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Get all comment IDs flagged as interesting by a user        */
/* Used to highlight flags in the UI (only for the current user)*/
/*─────────────────────────────────────────────────────────────*/
exports.getFlagsForUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT comment_id FROM InterestingFlags WHERE user_id = ?
    `;
    db.all(sql, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.comment_id)); // Return list of comment IDs
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Check if a specific comment is flagged by a specific user   */
/* Returns true or false                                       */
/*─────────────────────────────────────────────────────────────*/
exports.isFlaggedByUser = (userId, commentId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT 1 FROM InterestingFlags WHERE user_id = ? AND comment_id = ?`;
    db.get(sql, [userId, commentId], (err, row) => {
      if (err) reject(err);
      else resolve(!!row); // true if found, false otherwise
    });
  });
};
