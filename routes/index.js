const { Router } = require('express');
const controllers = require('../controllers');
const router = Router();

router.get('/', (req, res) => res.send('This is root!'));

router.post('/groups', controllers.createGroup);
router.get('/groups/:groupId', controllers.getGroupMenuById);

router.post('/categories', controllers.createCategories);

module.exports = router;