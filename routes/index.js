const { Router } = require('express');
const multer = require("multer");
const controllers = require('../controllers');
const verifyLaunchParams = require('./utils/verifyLaunchParams');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();

router.use((req, res, next) => {
  
  if (!verifyLaunchParams(req.token, process.env.VK_APP_SECRET_KEY)) {
    res.sendStatus(401);
  }

  next();
})

router.post('/groups', controllers.createGroup);
router.get('/groups/:vkGroupId', controllers.getGroupMenuById);

router.post('/categories', controllers.createCategories);
router.patch('/categories/:id', controllers.changePositionOrder);
router.put('/categories', controllers.changeCategories);

router.post('/positions', upload.single('image'), controllers.createPosition);
router.delete('/positions/:id', controllers.deletePosition);
router.patch('/positions/:id', upload.single('image'), controllers.changePosition);

module.exports = router;