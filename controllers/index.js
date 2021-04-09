require('dotenv').config();
const sequelize = require('sequelize');
const db = require('../models');
const orderArray = require('./utils/orderArray');
const aws = require("aws-sdk");
const path = require("path");
const axios = require('axios');
const { QueryTypes } = require('sequelize');
const { Group, Category, Position } = require('../models');
const { AppResponse } = require('../routes/utils/AppResponse');


const s3 = new aws.S3({
  signatureVersion: 'v4',
  region: 'eu-north-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});


const uploadToS3 = async (key, buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    s3.putObject(
        {
        Bucket: process.env.S3_BUCKET,
        ContentType: mimetype,
        Key: key,
        Body: buffer,
        ACL: 'public-read'
      },
      err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

const deleteFromS3 = async (key) => {
  return new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: process.env.S3_BUCKET,
        Key: key,
      },
      err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

const getImageKey = ({ fileName, vkGroupId }) => {
  const date = new Date();
  const extName = path.extname(fileName);

  return`img/${vkGroupId}/${date.toISOString().slice(0,7)}/${date.getTime() + extName}`;
}

const isAdmin = startParams => {
  return startParams.vk_viewer_group_role && startParams.vk_viewer_group_role === 'admin';
};

const FORBIDDEN_RESPONSE = AppResponse.forbidden({ message: 'Forbidden user' });


const getGroupInfo = async (startParams) => {
  const groupInfo = await axios.get(
    'https://api.vk.com/method/groups.getById?'+ 
    `group_id=${startParams.vk_group_id}&` + 
    `fields=addresses,cover,has_photo&` + 
    `access_token=${process.env.VK_APP_SERVICE_KEY}&` + 
    `v=5.130`
  ).then(result => result.data.response[0]);

  if (groupInfo.addresses.is_enabled) {
    const mainAddress = await axios.get(
      'https://api.vk.com/method/groups.getAddresses?' + 
      `group_id=${startParams.vk_group_id}&` + 
      `address_ids=${groupInfo.addresses.main_address_id}&` +
      `fields=timetable&` + 
      `access_token=${process.env.VK_APP_SERVICE_KEY}` + 
      `&v=5.130`
    ).then(result => result.data.response.items[0]);

    groupInfo.main_address = mainAddress;
  }
  
  return AppResponse.ok({ groupInfo });
};

const createGroupAndFirstCategories = async (startParams, req) => {
  if (!isAdmin(startParams)) {
    return FORBIDDEN_RESPONSE;
  }

  const data = await db.sequelize.transaction(async t => {
    const group = await Group.create({ vkGroupId: startParams.vk_group_id });

    const newCats = req.body.map(cat => {
      cat.groupId = group.id;
      return cat;
    });

    const Categories = await Category.bulkCreate(newCats);
    const catOrder = Categories.map(elem => elem.id );

    await group.update({ catOrder });

    group.dataValues.Categories = Categories;

    return group;
  });

  return AppResponse.created({ group: data });
};

const getGroupMenuById = async (startParams) => {
  const group = await Group.findOne({
    where: { vkGroupId: startParams.vk_group_id },
    include: {
      all: true,
      nested: true
    }
  });
  if (group) {
    if (group.Categories && group.catOrder) {
      group.Categories = orderArray(group.Categories, group.catOrder, 'id');
      group.Categories = group.Categories.map(category => {
        if (category.Positions && category.posOrder) {
          category.Positions = orderArray(category.Positions, category.posOrder, 'id');
        }
        return category;
      })

      for (let i = 0; i < group.Categories.length; i++) {
        if (group.Categories[i].Positions) {
          for (let j = 0; j < group.Categories[i].Positions.length; j++) {
            group.Categories[i].Positions[j].dataValues.imageUrl = process.env.S3_BUCKET_URL + group.Categories[i].Positions[j].dataValues.imageId;
          }
        }
      }
    }
    return AppResponse.ok({ group });
  }
  return AppResponse.notFound({ message: 'Group with specified Id not found' });
};

const changeCategories = async (startParams, req) => {
  if (!isAdmin(startParams)) {
    return FORBIDDEN_RESPONSE;
  }

  await db.sequelize.transaction(async t => {
    const group =  await Group.findOne({ where: { vkGroupId: startParams.vk_group_id }});
    const catOrder = req.body.catOrder;

    if (req.body.newCats.length > 0) {
      const newCats = await Category.bulkCreate(req.body.newCats.map(cat => {
        cat.groupId = group.id;
        return cat;
      }), { fields: ['title', 'groupId']});
      req.body.newCats.forEach((cat, index)  => {
        const newIndex = catOrder.findIndex(id => id === cat.id);
        catOrder[newIndex] = newCats[index].id;
      });
    }

    if (req.body.catOrder) {
      if (!await group.hasCategories(catOrder)) {
        throw new Error('Invalid ids in catOrder');
      }

      const catOrderStr = '{' + catOrder.join(',') + '}';
      await db.sequelize.query(
        'UPDATE "Groups" SET "catOrder" = $1 WHERE "vkGroupId" = $2',
        {
          bind: [catOrderStr, startParams.vk_group_id],
          type: QueryTypes.UPDATE
        }
      );
    }

    if (req.body.deletedCats.length > 0) {
      if (!await group.hasCategories(req.body.deletedCats)) {
        throw new Error('Invalid ids in deletedCats');
      }

      const catsToDelete = await Category.findAll({ 
        where: { id: req.body.deletedCats },
        include: { all: true }
      });

      for (let i = 0; i < catsToDelete.length; i++) {
        for (let j = 0; j < catsToDelete[i].Positions.length; j++) {
          await deleteFromS3(catsToDelete[i].Positions[j].imageId);
          await catsToDelete[i].Positions[j].destroy();
        }
      }
      
      await Category.destroy({ where: { id: req.body.deletedCats }});
    }

    if (req.body.changedCats.length > 0) {
      if (!await group.hasCategories(req.body.changedCats.map(cat => cat.id))) {
        throw new Error('Invalid ids in changedCats');
      }

      const promises = req.body.changedCats.map(category => {
        return Category.update({ title: category.title }, {
          where: { id: category.id }
        });
      });
      await Promise.all(promises);
    }
    
    return;
  });

  return getGroupMenuById(startParams);
};

const createPosition = async (startParams, req) => {
  if (!isAdmin(startParams)) {
    return FORBIDDEN_RESPONSE;
  }

  const group =  await Group.findOne({ where: { vkGroupId: startParams.vk_group_id }});
  if (!await group.hasCategories(req.body.categoryId)) {
    throw new Error('Invalid categoryId');
  }

  const key = getImageKey({ fileName: req.file.originalname, vkGroupId: startParams.vk_group_id });
  req.body.imageId = key;
  await uploadToS3(key, req.file.buffer, req.file.mimetype);
  
  const position = await db.sequelize.transaction(async t => {
    const pos = await Position.create(req.body);

    await Category.update(
      { 'posOrder': sequelize.fn('array_append', sequelize.col('posOrder'), pos.id) },
      { 'where': { 'id': pos.categoryId }}
    );

    return pos;
  });

  position.dataValues.imageUrl = process.env.S3_BUCKET_URL + key;

  return AppResponse.created({ position });
}

const changePositionOrder = async (startParams, req) => {
  if (!isAdmin(startParams)) {
    return FORBIDDEN_RESPONSE;
  }

  await db.sequelize.transaction(async t => {
    const { id } = req.params;
    const group =  await Group.findOne({ where: { vkGroupId: startParams.vk_group_id }});
    const category = await Category.findByPk(id)
    if (!await group.hasCategories(category) || !await category.hasPositions(req.body.posOrder)) {
      throw new Error('Invalid categoryId or ids in posOrder');
    }
    
    const posOrderStr = '{' + req.body.posOrder.join(',') + '}';

    await db.sequelize.query(
      'UPDATE "Categories" SET "posOrder" = $1 WHERE id = $2', 
      {
        bind: [posOrderStr, id],
        type: QueryTypes.UPDATE
      }
    );
    
    return;
  });

  return AppResponse.ok({ message: 'Positions order in category changed' });
}

const deletePosition = async (startParams, req) => {
  if (!isAdmin(startParams)) {
    return FORBIDDEN_RESPONSE;
  }

  await db.sequelize.transaction(async t => {
    const { id } = req.params;
    const position = await Position.findByPk(id);
    const group =  await Group.findOne({ where: { vkGroupId: startParams.vk_group_id }});
    
    if (!await group.hasCategories(position.categoryId)) {
      throw new Error('Invalid categoryId');
    }
    
    await Category.update(
      { posOrder: db.sequelize.fn('array_remove', db.sequelize.col('posOrder'), id) },
      { where: { id: position.categoryId }}
    );
    
    await position.destroy();

    return position.imageId;
  }).then(imageId => deleteFromS3(imageId));

  return AppResponse.ok({ message: 'Position was deleted successfully' });
}

const changePosition = async (startParams, req) => {
  if (!isAdmin(startParams)) {
    return FORBIDDEN_RESPONSE;
  }

  const { id } = req.params;
  let position = await Position.findByPk(id);
  const group =  await Group.findOne({ where: { vkGroupId: startParams.vk_group_id }});
  const newValues = req.body;

  if (!await group.hasCategories(position.categoryId)) {
    throw new Error('Invalid categoryId');
  }

  if (position.categoryId !== parseInt(newValues.categoryId)) {
    if (!await group.hasCategories(newValues.categoryId)) {
      throw new Error('Invalid new categoryId');
    }
  }

  if (req.file) {
    await deleteFromS3(position.imageId);

    const newKey = getImageKey({ fileName: req.file.originalname, vkGroupId: startParams.vk_group_id });
    newValues.imageId = newKey;
    await uploadToS3(newKey, req.file.buffer, req.file.mimetype);
  }


  await db.sequelize.transaction(async t => {
    if (position.dataValues.categoryId !== parseInt(newValues.categoryId)) {
      // Удаляем айдишник из старой категории
      await Category.update(
        { posOrder: db.sequelize.fn('array_remove', db.sequelize.col('posOrder'), position.id) },
        { where: { id: position.categoryId }}
      );
      // Добавляем айдишник в новую категорию
      await Category.update(
        { posOrder: sequelize.fn('array_append', sequelize.col('posOrder'), position.id) },
        { where: { id: newValues.categoryId }}
      );
    }

    await position.update(newValues);
    
    return;
  });

  position.dataValues.imageUrl = process.env.S3_BUCKET_URL + position.imageId;

  return AppResponse.ok({ position });
}

module.exports = {
  getGroupInfo,
  createGroupAndFirstCategories,
  getGroupMenuById,
  changeCategories,
  createPosition,
  changePositionOrder,
  deletePosition,
  changePosition
};

