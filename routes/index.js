const { Router } = require('express');
const multer = require("multer");
const controllers = require('../controllers');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();

router.get('/', (req, res) => res.send('This is root!'));

router.post('/groups', controllers.createGroup);
router.get('/groups/:vkGroupId', controllers.getGroupMenuById);

router.post('/categories', controllers.createCategories);
router.patch('/categories/:id', controllers.changePositionOrder);

router.post('/positions', upload.single('image'), controllers.createPosition);
router.get('/positions', controllers.getPosition);

module.exports = router;