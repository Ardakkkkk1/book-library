require('dotenv').config({ quiet: true });

const { connectDB, closeDB } = require('../database/connection');
const { runBootstrap } = require('../database/bootstrap');

async function main() {
  await connectDB();
  await runBootstrap();
  console.log('Bootstrap completed successfully.');
}

main()
  .then(async () => {
    await closeDB();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Bootstrap failed:', error.message);
    await closeDB();
    process.exit(1);
  });
