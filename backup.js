require('dotenv').config();
const { backupDatabases, restoreDatabases } = require('./backup-restore');
const selectedDatabases = [];  // Can be passed dynamically if needed

const runBackupAndRestore = async () => {
  await backupDatabases(selectedDatabases);  // Back up all databases if empty
  await restoreDatabases(selectedDatabases);  // Restore all databases if empty
};

runBackupAndRestore();  // Trigger the backup and restore process

module.exports = { backupDatabases, restoreDatabases };
