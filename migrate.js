const db = require('./src/config/db');
db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free'").then(() => {
  console.log('Column plan added!');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
