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
                vkGroupId: "4",
                linkVkFood: "link"
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('group');
    })

    it('should create new categories', async () => {
        const res = await request(app)
            .post('/api/categories')
            .send({
                vkGroupId: 900,
                catOrder: [1, 2, 3],
                categories: [
                    { title: 'Завтрак', groupId: 1 },
                    { title: 'Супы', groupId: 1 },
                    { title: 'Пицца', groupId: 1 },
                    { title: 'Паста', groupId: 1 }
                ]
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('categories');
    })
});