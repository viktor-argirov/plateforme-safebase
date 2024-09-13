const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const uploadFile = ({ localFile, s3Params }) => {
  return s3.upload({
    ...s3Params,
    Body: fs.createReadStream(localFile)
  }).promise();
};

module.exports = { uploadFile };
