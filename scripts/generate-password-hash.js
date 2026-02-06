require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');

async function main() {
  const password = process.argv[2];
  const rounds = Number.parseInt(process.argv[3] || process.env.BCRYPT_ROUNDS || '12', 10);

  if (!password) {
    console.error('Usage: npm run hash:password -- <plain-password> [rounds]');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, Number.isNaN(rounds) ? 12 : rounds);
  console.log(hash);
}

main().catch((error) => {
  console.error('Failed to generate hash:', error.message);
  process.exit(1);
});
