
const controllers = require('../controllers');
const getStartParamsFromUrl = require('./utils/getStartParamsFromUrl');
const { AppResponse } = require('./utils/AppResponse');
const { Router } = require('express');


const router = Router();

/**
 * @param req
 * @param {VkStartParams} user
 * @param {Error} err
 */
function logRequestError(req, user, err) {
  const meta = `${req.method} ${req.originalUrl.substr(0, 255)} user:${user.vk_user_id} group:${user.vk_group_id}`;
  console.error('process request failed', meta, err);
}

/**
 *
 * @param {function(VkStartParams, req): Promise<AppResponse>} callback
 * @return {function(req, res): void}
 */
function wrap(callback) {
  // для экспресса надо вернуть функцию которая принимает req res
  return async (req, res) => {
    if (!req.token) {
      res.status(500).send({ message: 'Invalid start parameters' });
      return;
    }
    // создаем объект с параметрами запуска
    const startParams = getStartParamsFromUrl(req.token, process.env.VK_APP_SECRET_KEY)
    if (!startParams) {
      // если не создастся значит подпись запроса не сошлась
      res.status(500).send({ message: 'Invalid sign' });
      return;
    }

    if (!startParams.vk_group_id) {
      res.status(500).send({ message: 'Invalid start parameters' });
      return;
    }

    const nowTs = Date.now();
    const dayBefore = new Date(nowTs - 60 * 60 * 24 * 1000);
    const now = new Date(nowTs);
    const vkTsDate = new Date(startParams.vk_ts * 1000);
    
    if (vkTsDate < dayBefore || vkTsDate > now) {
      res.status(500).send({ message: 'Start parameters are obsolete or invalid' });
      return;
    }

    // вызываем callback и передаем ему на вход параметры запуска
    // и объект запроса
    // он должен вернуть промис
    callback(startParams, req).then(result => {
      // промис должен разрезолвится в AppResponse
      // из него можно достать статус и данные для клиента
      if (result instanceof AppResponse) {
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

router.get('/group_info', wrap(controllers.getGroupInfo));

router.post('/groups', wrap(controllers.createGroupAndFirstCategories));
router.get('/groups', wrap(controllers.getGroupMenuById));

router.patch('/categories/:id', wrap(controllers.changePositionOrder));
router.put('/categories', wrap(controllers.changeCategories));

router.post('/positions', wrap(controllers.createPosition));
router.delete('/positions/:id', wrap(controllers.deletePosition));
router.patch('/positions/:id', wrap(controllers.changePosition));

module.exports = router;