// backup.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import s3Client from '../config/s3.js'; // Add .js extension
import { backupDatabases } from '../backup.js'; // Use named import

describe('Integration Backup Test', function () {
  it('should upload backups to S3 successfully', function (done) {
    const s3Stub = sinon.stub(s3Client, 'uploadFile').returns({
      on: (event, callback) => {
        if (event === 'end') callback();
      }
    });

    backupDatabases()
      .then(() => {
        expect(s3Stub.called).to.be.true;
        s3Stub.restore();
        done();
      })
      .catch(err => done(err));
  });
});
