const { Router } = require('express');
const multer = require("multer");
const controllers = require('../controllers');
const { AppResponse } = require('./utils/AppResponse');
const getStartParamsFromUrl = require('./utils/getStartParamsFromUrl');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();


/**
 * @param req
 * @param {VkStartParams} user
 * @param {Error} err
 */
function logRequestError(req, user, err) {
  const meta = `${req.method} ${req.originalUrl.substr(0, 255)} user:${user.getUserId()} group:${user.getGroupId()}`;
  console.error('process request failed', meta, err);
}

/**
 *
 * @param {function(VkStartParams, req): Promise<AppResponse>} callback
 * @return {function(req, res): void}
 */
function wrap(callback) {
  // для экспресса надо вернуть функцию которая принимает req res
  return (req, res) => {
    // создаем объект с параметрами запуска
    const startParams = getStartParamsFromUrl(req.token, process.env.VK_APP_SECRET_KEY)
    if (!startParams) {
      // если не создастся значит подпись запроса не сошлась
      res.status(500).send({ message: 'Invalid sign' });
      return;
    }
    // вызываем callback и передаем ему на вход параметры запуска
    // и объект запроса
    // он должен вернуть промис
    callback(startParams, req).then(result => {
      // промис должен разрезолвится в AppResponse
      // из него можно достать статус и данные для клиента
      if (res instanceof AppResponse) {
        res.status(result.status).json(result.data);
      } else {
        // что-то пошло не так, логируем ошибку
        logRequestError(req, startParams, new Error('response not instance AppResponse'));
        // пользователю шлем стандартное сообщение что все плохо
        res.status(500).send({ message: 'Server error' });
      }
    }).catch(e => {
      logRequestError(req, startParams, e);
      res.status(500).send({ message: 'Server error' });
    });
  };
}


router.post('/groups', wrap(controllers.createGroup));
router.get('/groups/:vkGroupId', controllers.getGroupMenuById);

router.post('/categories', controllers.createCategories);
router.patch('/categories/:id', controllers.changePositionOrder);
router.put('/categories', controllers.changeCategories);

router.post('/positions', upload.single('image'), controllers.createPosition);
router.delete('/positions/:id', controllers.deletePosition);
router.patch('/positions/:id', upload.single('image'), controllers.changePosition);

module.exports = router;