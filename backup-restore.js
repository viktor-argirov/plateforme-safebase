// backup-restore.js
const { spawn } = require('child_process');
const fs = require('fs');
const zlib = require('zlib');
const moment = require('moment');
const rp = require('request-promise');
const { pool } = require('./routes/db');


const backupPath = process.env.BACKUP_PATH || 'C:/Users/vikto/backups/';
const slackWebhookUrl = 'https://hooks.slack.com/services/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';
const ignoredDatabases = ['information_schema', 'performance_schema', 'mysql', 'accounts'];

const notifySlack = async (message) => {
  const payload = { text: message };
  try {
    await rp({
      method: 'POST',
      uri: slackWebhookUrl,
      body: payload,
      json: true
    });
  } catch (error) {
    console.error("Error sending Slack notification:", error.message);
  }
};

const ensureBackupDirectoryExists = () => {
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
    console.log(`Backup directory created: ${backupPath}`);
  } else {
    console.log(`Backup directory already exists: ${backupPath}`);
  }
};

const backupDatabases = async (selectedDatabases = []) => {
  try {
    ensureBackupDirectoryExists();
    await notifySlack('Backup process started.');
    console.log('Backup process started.');

    const [databases] = await pool.query('SHOW DATABASES');
    const promises = databases
      .filter(db => !ignoredDatabases.includes(db.Database) && 
          (selectedDatabases.length === 0 || selectedDatabases.includes(db.Database)))
      .map(async (db) => {
        const gzip = zlib.createGzip();
        const wstream = fs.createWriteStream(`${backupPath}${db.Database}.sql.gz`);
        process.env.MYSQL_PWD = process.env.DB_PASS;

        const mysqldump = spawn('mysqldump', [
          '-h', process.env.DB_HOST,
          '-u', process.env.DB_USER,
          db.Database
        ]);

        return new Promise((resolve, reject) => {
          mysqldump.stdout.pipe(gzip).pipe(wstream);
          wstream.on('finish', resolve);
          wstream.on('error', reject);
        });
      });

    await Promise.all(promises);
    await notifySlack('Backup process completed successfully.');
    console.log('Backup process completed successfully.');
  } catch (error) {
    console.error(`Backup process failed: ${error.message}`);
    await notifySlack(`Backup process failed: ${error.message}`);
  }
};

const restoreDatabases = async (selectedDatabases = []) => {
  try {
    ensureBackupDirectoryExists();
    await notifySlack('Restore process started.');
    console.log('Restore process started.');

    const files = fs.readdirSync(backupPath).filter(file => file.endsWith('.sql.gz'));
    for (const file of files) {
      const dbName = file.replace('.sql.gz', '');
      if (selectedDatabases.length === 0 || selectedDatabases.includes(dbName)) {
        const filePath = `${backupPath}${file}`;
        const gunzip = zlib.createGunzip();
        const rstream = fs.createReadStream(filePath);
        process.env.MYSQL_PWD = process.env.DB_PASS;

        const mysqlRestore = spawn('mysql', [
          '-h', process.env.DB_HOST,
          '-u', process.env.DB_USER,
          dbName
        ]);

        rstream.pipe(gunzip).pipe(mysqlRestore.stdin);
        mysqlRestore.on('exit', (code) => {
          if (code === 0) {
            console.log(`Successfully restored ${dbName}`);
          } else {
            console.error(`Failed to restore ${dbName} with exit code ${code}`);
          }
        });
      }
    }

    await notifySlack('Restore process completed successfully.');
  } catch (error) {
    console.error(`Restore process failed: ${error.message}`);
    await notifySlack(`Restore process failed: ${error.message}`);
  }
};

module.exports = { backupDatabases, restoreDatabases };
