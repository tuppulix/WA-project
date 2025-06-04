'use strict';

const db = require('../db');
const crypto = require('crypto');

/*─────────────────────────────────────────────────────────────*/
/* Get a user from the database by email                       */
/* Used for login and password verification                    */
/*─────────────────────────────────────────────────────────────*/
exports.getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM Users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
      if (err) reject(err);
      else resolve(row); // Returns user object or undefined
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Verify user password using scrypt + stored salt             */
/* Returns the user if the password matches, otherwise null    */
/* Uses timingSafeEqual to prevent timing attacks              */
/*─────────────────────────────────────────────────────────────*/
exports.verifyPassword = async (email, password) => {
  const user = await exports.getUserByEmail(email);
  if (!user) return null;

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, user.salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      const hashBuffer = Buffer.from(user.password_hash, 'hex');
      if (crypto.timingSafeEqual(hashBuffer, derivedKey)) {
        resolve(user); // Auth success
      } else {
        resolve(null); // Auth failed
      }
    });
  });
};

/*─────────────────────────────────────────────────────────────*/
/* Get a user by ID (used during session restore)              */
/*─────────────────────────────────────────────────────────────*/
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM Users WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row); // Returns user object or undefined
    });
  });
};
