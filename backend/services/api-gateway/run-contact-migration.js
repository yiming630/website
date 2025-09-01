const { runContactMigration } = require('./src/utils/runContactMigration');

async function main() {
  try {
    await runContactMigration();
    console.log('Migration process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

main();