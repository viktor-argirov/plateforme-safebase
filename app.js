require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const pool = require('./routes/db');

fastify.register(require('@fastify/formbody'));

const indexRoutes = require('./routes/index');
fastify.register(indexRoutes);

const testDbConnection = async () => {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  }
};

testDbConnection();

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server listening on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
