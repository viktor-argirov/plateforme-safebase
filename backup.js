const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

const { spawn } = require('child_process');
const fs = require('fs');
const zlib = require('zlib');
const rp = require('request-promise');
const moment = require('moment');
const Promise = require('bluebird');

const ignore = ['information_schema', 'performance_schema', 'mysql', 'accounts']; // Add other databases you want to ignore
const pool = require('./routes/db');

const slackWebhookUrl = 'https://hooks.slack.com/services/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'; // Replace with your webhook URL
const backupPath = process.env.BACKUP_PATH || 'C:/Users/vikto/backups/'; // Ensure the correct path

const notifySlack = async (message) => {
    const payload = {
        text: message
    };

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

const backupDatabases = async () => {
    try {
        // Ensure the backup directory exists
        ensureBackupDirectoryExists();

        await notifySlack('Backup process started.');
        console.log('Backup process started.');

        // Get databases
        const [dbs] = await pool.query('SHOW DATABASES');
        const promises = dbs.map(async (db) => {
            if (!ignore.includes(db.Database)) {
                const gzip = zlib.createGzip();
                const wstream = fs.createWriteStream(`${backupPath}${db.Database}.sql.gz`);
                process.env.MYSQL_PWD = process.env.DB_PASS;

                const mysqldump = spawn('mysqldump', [
                    '-h', process.env.DB_HOST,
                    '-u', process.env.DB_USER,
                    db.Database
                ]);

                mysqldump.stderr.on('data', (data) => {
                    console.error(`mysqldump error: ${data}`);
                });

                return new Promise((resolve, reject) => {
                    mysqldump.stdout.pipe(gzip).pipe(wstream);
                    wstream.on('finish', resolve);
                    wstream.on('error', reject);
                });
            }
        });

        await Promise.all(promises);
        await notifySlack('Backup process completed successfully.');
        console.log('Backup process completed successfully.');
    } catch (error) {
        console.error(`Backup process failed: ${error.message}`);
        await notifySlack(`Backup process failed: ${error.message}`);
    }
};

const restoreDatabases = async () => {
    try {
        ensureBackupDirectoryExists();

        await notifySlack('Restore process started.');
        console.log('Restore process started.');

        // Get a list of all .sql.gz backup files in the backup directory
        const files = fs.readdirSync(backupPath).filter(file => file.endsWith('.sql.gz'));

        if (files.length === 0) {
            throw new Error('No backup files found in the backup directory.');
        }

        for (const file of files) {
            const dbName = file.replace('.sql.gz', '');
            console.log(`Restoring database: ${dbName} from file: ${file}`);

            const filePath = `${backupPath}${file}`;
            if (!fs.existsSync(filePath)) {
                console.error(`Backup file does not exist: ${filePath}`);
                continue; // Skip this file and continue with the next
            }

            const gunzip = zlib.createGunzip();
            const rstream = fs.createReadStream(filePath);
            process.env.MYSQL_PWD = process.env.DB_PASS;

            // Spawn the mysql process with stdin set to accept data
            const mysqlRestore = spawn('mysql', [
                '-h', process.env.DB_HOST,
                '-u', process.env.DB_USER,
                dbName
            ], { stdio: ['pipe', process.stdout, process.stderr] });

            // Pipe the streams
            rstream
                .pipe(gunzip)
                .on('error', (err) => {
                    console.error(`Gunzip error for ${file}: ${err.message}`);
                })
                .pipe(mysqlRestore.stdin) // Directly pipe to mysql's stdin
                .on('error', (err) => {
                    console.error(`Stream error for ${file}: ${err.message}`);
                });

            mysqlRestore.on('exit', (code) => {
                if (code === 0) {
                    console.log(`Successfully restored ${dbName} from ${file}`);
                } else {
                    console.error(`Failed to restore ${dbName} from ${file} with exit code ${code}`);
                }
            });
        }

        console.log('All restore operations initiated.');
        await notifySlack('Restore process completed successfully.');
    } catch (error) {
        console.error(`Restore process failed: ${error.message}`);
        await notifySlack(`Restore process failed: ${error.message}`);
    } finally {
        process.exit(); // Exit the process after restoration
    }
};


// Run the backup and then restore
const runBackupAndRestore = async () => {
    await backupDatabases();
    await restoreDatabases();
};

runBackupAndRestore();
