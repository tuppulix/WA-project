const crypto = require('crypto');

// Funzione che genera salt e hash per una password
function generateHash(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve({ salt, hash: derivedKey.toString('hex') });
    });
  });
}

// Esempio: genera hash per password di fantasia
async function main() {
  const users = [
    { email: 'marta.rossi@example.com', password: 'sunshine123' },
    { email: 'giovanni.bianchi@example.com', password: 'oceanview7' },
    { email: 'luca.verdi@example.com', password: 'greenleaf9' },
    { email: 'sara.neri@example.com', password: 'moonlight8' },
    { email: 'alessio.galli@example.com', password: 'starlight5' },
    { email: 'elena.ferrari@example.com', password: 'sunflower4' },
    { email: 'marco.ricci@example.com', password: 'mountain3', },
    { email: 'chiara.martini@example.com', password: 'violetwind', },
    { email: 'lorenzo.barbieri@example.com', password: 'desertsky', },
    { email: 'giulia.conti@example.com', password: 'rainfall11', }
  ];

  for (const user of users) {
    const { salt, hash } = await generateHash(user.password);
    console.log(`-- User: ${user.email}`);
    console.log(`Salt: '${salt}'`);
    console.log(`Hash: '${hash}'`);
    console.log();
  }
}

main().catch(console.error);
