-- Drop existing tables if any
DROP TABLE IF EXISTS InterestingFlags;
DROP TABLE IF EXISTS Comments;
DROP TABLE IF EXISTS Posts;
DROP TABLE IF EXISTS Users;

-- Users table
CREATE TABLE Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  totp_secret TEXT
);

-- Posts table (ri-definizione con DEFAULT CURRENT_TIMESTAMP)
CREATE TABLE Posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL UNIQUE,
  text          TEXT    NOT NULL,
  author_id     INTEGER NOT NULL,
  timestamp     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  max_comments  INTEGER,
  FOREIGN KEY (author_id) REFERENCES Users(id)
);


-- Comments table
CREATE TABLE Comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL,
  author_id  INTEGER,
  text       TEXT    NOT NULL,
  timestamp  TEXT    NOT NULL,
  edited     INTEGER NOT NULL DEFAULT 0,   -- ← nuovo campo
  FOREIGN KEY (post_id)   REFERENCES Posts(id),
  FOREIGN KEY (author_id) REFERENCES Users(id)
);

-- InterestingFlags table
CREATE TABLE InterestingFlags (
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, comment_id),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  FOREIGN KEY (comment_id) REFERENCES Comments(id)
);

-- Sample users with actual password hashes and salts
INSERT INTO Users (email, name, password_hash, salt, is_admin, totp_secret)
VALUES
  ('marta.rossi@example.com', 'Marta Rossi', '3dc113757d96a9237e9da4bd12166d02800d286402140c04a815b1cced26e57b5f86e479b20b806159225bb4aab0c907421f12b3a881b79422a868df2177ab1d', '2169def965e393b613b4f8be94edfc4d', 1, 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
  ('giovanni.bianchi@example.com', 'Giovanni Bianchi', '18e3481e0a994b4f1c2193017be33c72f192dc2689c4e23a697b5615bd635440c31889948177bcb3b890b889983940ad42e763b5b295da965f4a37e8ec811de1', '416b7f443cea61fc7bf68c75e22cae02', 1, 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
  ('luca.verdi@example.com', 'Luca Verdi', '52e79260f4de75c8d491c13f06079a54c46453edb97c2a84881b24e24e92851b273d4b00a5e4a76d84110cb5aa4c6db77c92bcae5949448a5745b604cf4d7603', '710bf7f49bb4900c5c2c051905604449', 0, NULL),
  ('sara.neri@example.com', 'Sara Neri', '3a53c5b1726174cbe4baf713d22d551656ccac1a817565859865a72ec039b131f35096fa12cc9c48467f175f4bc6dc14fb985fd1b4811e3b59123524a3191d5e', '10d4ab15af041b0a9b3a14c1848ac6eb', 0, NULL),
  ('alessio.galli@example.com', 'Alessio Galli', 'f98d1cd12f82a3f32d07eb7fa006aaa4ca007db17c60f4b9d21206401eb080186fa7b2c7290981160f57b8f08fa12f608a73c64c982b3f051680ee03df5e07ce', '2c9e95de17fc77deb8241bf33fcf18bf', 0, NULL),
   ('elena.ferrari@example.com', 'Elena Ferrari', '9a122743a6822f39c8db86f726013f4f0a9abc59ed99ab5de3b1c39abfb59e47a5960bd2d8d8163f7c395cfb7a61e8f73293fb5e678375a47cac0d453af9b0c3', '095e8f2df041287352e7a20136fb08f1', 0, NULL),
  ('marco.ricci@example.com', 'Marco Ricci', 'cc823f611ff2c9b85e3f962c42afddc8264a21beeeaeeec13dc5a649b2f395eda31ddc4d998462e13ada9db76f1dbaa5bc112225ca598859c299668e84d6c91c', '98bb7d37fdb8e0c37e5d68e60287ec9f', 1, 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
  ('chiara.martini@example.com', 'Chiara Martini', '6dcdae8e67d9a897a9038ff54396a343dbe70c999974684e6ea445fcdc8153ce6b6ce3e02404f28d14182aba47b8c10a8d384a5aed2bf110270d22182c33acd5', '4e5d1964548361909af9eae24b1decde', 0, NULL),
  ('lorenzo.barbieri@example.com', 'Lorenzo Barbieri', '54c8ba3e8b6cd64c00aef050a05d2f07099f8e23d9cbb844ecee976eff1e98beb0851c191ed3b9150a66ce26761ef9710abe3474e54f28444cb961d05141384e', '1f713bf5e275961bb600fec90124dbd0', 0, NULL),
  ('giulia.conti@example.com', 'Giulia Conti', '1b4d0fb7eba7c2723925bafffafb06a7f5fd3b8f1a49860d231d24721723556f7e3317568ddbb19d70aa49ff1bd213dcff75c232ef886e964b4e26273ab6e134', '4cdef52db07f39b029367ff0726c600a', 1, 'LXBSMDTMSP2I5XFXIYRGFVWSFI');

-- Hacker-themed sample posts (replacing original ones)
INSERT INTO Posts (title, text, author_id, timestamp, max_comments)
VALUES
  ('Buffer Overflow Blues',
   'I discovered a buffer overflow in the old Telnet service. Any remediation advice?',
   1, '2025-05-01 10:00:00', 3),
  ('SQL Injection Safety',
   'Sanitize all input fields to prevent SQL injection attacks. Share your dev tips!',
   1, '2025-05-01 11:00:00', NULL),
  ('2FA Bypass Attempts',
   'I''m testing two-factor bypass using token replay. Anyone else tried this?',
   2, '2025-05-02 10:30:00', 2),
  ('Terminal Theme Request',
   'Requesting custom ANSI terminal themes for glitch aesthetics. Suggestions?',
   2, '2025-05-02 12:00:00', 5),
  ('SSH Key Permissions',
   'SSH key auth failing due to file permissions. Any chmod recommendations?',
   3, '2025-05-03 09:15:00', 2),
  ('Event Loop Hijacking',
   'Best practices for event-loop hijacking in Node.js? Looking for advanced patterns.',
   3, '2025-05-03 10:45:00', NULL),
  ('Adaptive Shell Prompts',
   'Creating responsive shell prompts with dynamic segments. How to optimize performance?',
   4, '2025-05-04 08:00:00', 3),
  ('Packet Stream Alignment',
   'Having trouble aligning packet streams, getting misordered frames. Advice?',
   4, '2025-05-04 08:30:00', NULL),
  ('Kernel Panic Analysis',
   'Encountered frequent kernel panics on suspend. Could faulty drivers be the cause?',
   5, '2025-05-05 09:00:00', 3),
  ('OAuth Scopes Misuse',
   'Which OAuth scopes are safe to expose in frontend codebases?',
   6, '2025-05-05 10:00:00', 2),
  ('Regex Catastrophes',
   'Regex takes forever to evaluate user input. Are lookbehinds killing performance?',
   7, '2025-05-05 11:00:00', 5),
  ('Privilege Escalation Logs',
   'Can someone explain weird log entries during sudo session escalations?',
   8, '2025-05-05 12:00:00', NULL),
  ('TLS Handshake Debugging',
   'TLS handshake fails intermittently. Could server clock skew be a factor?',
   9, '2025-05-05 13:00:00', 3),
  ('WebSocket Flooding Defense',
   'Strategies for mitigating WebSocket flooding in chat apps?',
   10, '2025-05-05 14:00:00', NULL),
  ('Sudo Timestamp Confusion',
   'Sudo keeps timing out randomly. Is the timestamp file getting corrupted?',
   5, '2025-05-05 15:00:00', 2),
  ('Filesystem Mount Tricks',
   'Bind mounts behave oddly on nested filesystems. Workarounds welcome.',
   6, '2025-05-05 16:00:00', 3);

-- Hacker-themed sample comments (replacing original ones)
INSERT INTO Comments (post_id, author_id, text, timestamp)
VALUES
  (1,    3, 'Check buffer sizes with AFL fuzzer.',                            '2025-05-05 10:00:00'),
  (1, NULL, 'Did you try bypassing ASLR in anonymous mode?',                 '2025-05-05 10:05:00'),
  (3,    4, 'I managed to replay TOTP codes within the 30s window.',         '2025-05-06 09:00:00'),
  (5,    1, 'Ensure ~/.ssh is chmod 700 and private key 600.',              '2025-05-07 11:00:00'),
  (5, NULL, 'Run ssh-agent with GID 0 privileges.',                          '2025-05-07 11:10:00'),
  (7,    2, 'Use PS1 with conditional inserts based on the $COLUMNS env var.','2025-05-08 08:00:00'),
  (7,    5, 'I used Starship prompt with performance plugin.',                '2025-05-08 08:10:00'),
  (4,    3, 'Dark ASCII themes FTW.',                                        '2025-05-09 09:00:00'),
  (4,    4, 'Counting ANSI color codes…',                                    '2025-05-09 09:10:00'),
  (4,    5, 'Shoutout to the Terminator emulator for theming.',               '2025-05-09 09:20:00'),
  (4, NULL, 'Embrace the dark terminal, hacker style.',                     '2025-05-09 09:30:00'),
  (4,    1, 'Merged your theme request into my dotfiles.',                   '2025-05-09 09:40:00'),
  (2,    4, 'Always use parameterized queries for SQL safety.',                '2025-05-06 12:00:00'),
  (2, NULL, 'Prepared statements are your best friend!',                       '2025-05-06 12:05:00'),
  (3,    5, 'Try using device fingerprinting for extra 2FA security.',         '2025-05-07 08:45:00'),
  (6,    2, 'Monitor the event loop lag with async_hooks.',                    '2025-05-08 14:00:00'),
  (6, NULL, 'Node.js event loop can be hijacked by heavy sync code.',          '2025-05-08 14:10:00'),
  (8,    3, 'Check packet order with Wireshark filters.',                      '2025-05-09 10:00:00'),
  (8,    4, 'Try increasing the buffer size for better alignment.',            '2025-05-09 10:15:00'),
  (9,    6, 'Update all drivers and check dmesg logs.',                        '2025-05-10 09:30:00'),
  (9, NULL, 'Kernel panics often point to faulty RAM or drivers.',             '2025-05-10 09:45:00'),
  (10,   7, 'Limit OAuth scopes to only what is strictly needed.',             '2025-05-10 11:00:00'),
  (10,   8, 'Never expose write scopes in the frontend.',                      '2025-05-10 11:10:00');
