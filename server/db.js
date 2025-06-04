'use strict';

const sqlite = require('sqlite3');

// connessione al database creato con db-init.sql
const db = new sqlite.Database('db.sqlite3', (err) => {
  if (err) throw err;
});

module.exports = db;
// export the database connection
// to be used in other modules
// e.g., in the index.js file
// const db = require('./db.js');   