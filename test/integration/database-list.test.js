import fastify from 'fastify';
import { routes as dbRoutes } from '../../routes/db.js';
import supertest from 'supertest';
import * as chai from 'chai';

const { expect } = chai;

let app;

before(async () => {
    app = fastify();
    await app.register(dbRoutes); // Register db route specifically
    await app.ready();
});

after(async () => {
    await app.close();
});

describe('GET /databases', () => {
    it('should return a list of available databases excluding system databases', async () => {
        const response = await supertest(app.server)
            .get('/databases')
            .expect('Content-Type', /json/)
            .expect(200);

        const databases = response.body;

        // Place assertions here
        expect(Array.isArray(databases)).to.be.true; // Check response is an array

        const ignoredDatabases = ['information_schema', 'performance_schema', 'mysql', 'accounts'];
        databases.forEach(db => {
            expect(ignoredDatabases).to.not.include(db); // Confirm excluded system databases
        });
    });
});