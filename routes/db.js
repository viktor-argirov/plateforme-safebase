const mysql = require('mysql2/promise');
require('dotenv').config();
 

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,  
  // database: 'fastifydb'     
});

const ignoredDatabases = ['information_schema', 'performance_schema', 'mysql', 'accounts'];

async function routes(fastify, options) {
  fastify.get('/databases', async (_request, reply) => {
    try {
      const [databases] = await pool.query('SHOW DATABASES');
      const filteredDatabases = databases
        .map(db => db.Database)
        .filter(dbName => !ignoredDatabases.includes(dbName));
      
      reply.send(filteredDatabases);  // Send filtered list of databases
    } catch (error) {
      reply.status(500).send('Error fetching databases');
    }
  });
}


module.exports = {pool, routes};
