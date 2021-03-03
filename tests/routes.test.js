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
        Categories: [
          { title: 'Завтрак', groupId: 1 },
          { title: 'Супы', groupId: 1 },
          { title: 'Пицца', groupId: 1 },
          { title: 'Паста', groupId: 1 }
        ]
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('Categories');
  })

  it('should change posOrder in category', async () => {
    const res = await request(app)
      .patch('/api/categories/1')
      .send({
        posOrder: [1, 2, 3]
      });
    expect(res.statusCode).toEqual(202);
  })

  it('should delete position and its id from category', async () => {
    const res = await request(app)
      .delete('/api/positions/2');

    expect(res.statusCode).toEqual(202);
  })

  it('should change position', async () => {
    const res = await request(app)
      .patch('/api/positions/3')
      .send({
        title: 'Смузи',
        description: 'Смузи из киви и шпината с добавлением клубники, черники и украшенный орехами.',
        value: 335,
        unitId: 2,
        price: 332,
        categoryId: 3
      });
    expect(res.statusCode).toEqual(202);
  })
});