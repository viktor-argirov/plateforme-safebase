// //fonction flechée 
// start();
import 'dotenv/config';
import path from 'path';
import fastifyModule from 'fastify';
import { backupDatabases, restoreDatabases } from './backup-restore.js';
import { pool, routes } from './routes/db.js';
import formbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';

const fastify = fastifyModule({ logger: true });

// Register plugins
fastify.register(formbody);
fastify.register(fastifyStatic, {
  root: path.resolve(),  // `path.resolve()` replaces `__dirname` for ES modules
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

start();
