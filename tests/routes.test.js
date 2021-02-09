const request = require('supertest');
const app = require('../server.js');

describe('User API', () => {
    it("should show group's menu", async () => {
        const res = await request(app).get('/api/groups/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('group');
    }),

    it('should create a new group', async () => {
        const res = await request(app)
            .post('/api/groups')
            .send({
                groupId: "4",
                linkVkFood: "link"
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('group');
    })
});