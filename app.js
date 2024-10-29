require('dotenv').config();
const path = require('path');
const fastify = require('fastify')({ logger: true });
const { backupDatabases, restoreDatabases } = require('./backup-restore');
const { pool, routes } = require('./routes/db');


// Register plugins
fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname),
  prefix: '/'
});
fastify.register(routes);

// Backup API
fastify.post('/api/backup', async (request, reply) => {
  const { databases } = request.body;
  if (!databases || databases.length === 0) {
    return reply.status(400).send({ status: 'error', message: 'No databases selected for backup' });
  }
  
  try {
    await backupDatabases(databases);
    reply.send({ status: 'success', message: 'Backup completed.' });
  } catch (error) {
    reply.status(500).send({ status: 'error', message: error.message });
  }
});

// Restore API
fastify.post('/api/restore', async (request, reply) => {
  const { databases } = request.body;
  if (!databases || databases.length === 0) {
    return reply.status(400).send({ status: 'error', message: 'No databases selected for restore' });
  }

  try {
    await restoreDatabases(databases);
    reply.send({ status: 'success', message: 'Restore completed.' });
  } catch (error) {
    reply.status(500).send({ status: 'error', message: error.message });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

//fonction flechée 

start();
