import sinon from 'sinon';
import { expect } from 'chai';
import * as backupRestore from '../../backup-restore.js';
import { pool } from '../../routes/db.js';

describe('Backup and Restore Functions', function () {
  this.timeout(10000);  // Extend timeout for async operations

  beforeEach(() => {
    // Stub database query to avoid real DB calls
    sinon.stub(pool, 'query').resolves([{ Database: 'test_db' }]);
  });

  afterEach(() => {
    sinon.restore();  // Restore original methods after each test
  });

  describe('backupDatabases', () => {
    it('should create backups for selected databases', async function () {
      await backupRestore.backupDatabases(['test_db']);
      expect(pool.query.called).to.be.true; // Check that query was called
    });
  });

  describe('restoreDatabases', () => {
    it('should restore databases from backup files', async function () {
      await backupRestore.restoreDatabases(['test_db']);
      expect(pool.query.called).to.be.true; // Check that query was called
    });
  });
});
