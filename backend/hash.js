const bcrypt = require('bcrypt');

async function hashPassword() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('central1610', salt);
  console.log(hash);
}

hashPassword();
