const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

const { spawn } = require('child_process');
const fs = require('fs');
const zlib = require('zlib');
const rp = require('request-promise');
const moment = require('moment');
const os = require('os');
const util = require('util');
const Promise = require('bluebird');

const ignore = ['information_schema', 'performance_schema', 'mysql', 'accounts']; // Add other databases you want to ignore
const pool = require('./routes/db');
const s3Client = require('./config/s3');

const monitor = process.argv[2] === '-nomonitor' ? false : true;
const allDatabases = [];

const formData = {
  success: 1,
  server: os.hostname(),
  path: __filename,
  message: ''
};

const backupDate = moment().format('M-D-YY');
const backupPath = process.env.BACKUP_PATH;

const backupDatabases = async () => {
  try {
    // Notify CronAlarm
    if (monitor) {
      try {
        await rp(`http://api.cronalarm.com/v2/${process.env.CRONALARM_KEY}/start`);
      } catch (err) {
        console.warn("Warning: Failed to notify CronAlarm start", err.message);
      }
    }

    // Get databases
    const [dbs] = await pool.query('SHOW DATABASES');
    const promises = dbs.map(async (db) => {
      if (!ignore.includes(db.Database)) {
        allDatabases.push(db.Database);
        const gzip = zlib.createGzip();
        const wstream = fs.createWriteStream(`${backupPath}${db.Database}.sql.gz`);
        process.env.MYSQL_PWD = process.env.DB_PASS; // Temporarily set the password

        const mysqldump = spawn('mysqldump', [
          '-h', process.env.DB_HOST,
          '-u', process.env.DB_USER,
          db.Database
        ]);

        // Error logging
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

    // Upload to S3
    const uploadPromises = allDatabases.map(db => {
      const params = {
        localFile: `${backupPath}${db}.sql.gz`,
        s3Params: {
          Bucket: process.env.S3_BUCKET,
          Key: `${backupDate}/${db}.sql.gz`,
          ServerSideEncryption: 'AES256',
          StorageClass: 'STANDARD_IA'
        }
      };

      return new Promise((resolve, reject) => {
        const uploader = s3Client.uploadFile(params);

        // Listen for errors during upload
        uploader.on('error', (err) => {
          console.error(`S3 upload error for ${db}:`, err);
          reject(err);
        });

        // Resolve when upload finishes
        uploader.on('end', resolve);
      });
    });

    await Promise.all(uploadPromises);
  } catch (err) {
    formData.success = 0;
    formData.message = util.inspect(err);
  } finally {
    if (monitor) {
      try {
        await rp({
          method: 'POST',
          uri: `http://api.cronalarm.com/v2/${process.env.CRONALARM_KEY}/end`,
          form: formData
        });
      } catch (err) {
        console.warn("Warning: Failed to notify CronAlarm end", err.message);
      }
    }
    process.exit();
  }
};

backupDatabases();
