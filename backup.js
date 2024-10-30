import 'dotenv/config';
import { backupDatabases, restoreDatabases } from './backup-restore.js';

const selectedDatabases = []; 

const runBackupAndRestore = async () => {
  await backupDatabases(selectedDatabases);  
  await restoreDatabases(selectedDatabases);  
};

runBackupAndRestore();  

export { backupDatabases, restoreDatabases };
