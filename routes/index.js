const pool = require('./db');

async function routes(fastify, options) {
  fastify.get('/users', async (request, reply) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users');
      reply.send(rows);
    } catch (err) {
      reply.status(500).send({ error: 'Database query failed' });
    }
  });

  fastify.post('/add-user', async (request, reply) => {
    const { name, email } = request.body;
    try {
      const [result] = await pool.execute(
        'INSERT INTO users (name, email) VALUES (?, ?)', 
        [name, email]
      );
      reply.send({ success: true, userId: result.insertId });
    } catch (err) {
      reply.status(500).send({ error: 'Database insertion failed' });
    }
  });

  fastify.get('/db-check', async (request, reply) => {
    try {
      const [rows] = await pool.query('SELECT 1');
      reply.send({ message: 'Database is connected', rows });
    } catch (err) {
      reply.status(500).send({ message: 'Database connection failed', error: err });
    }
  });
}

module.exports = routes;
