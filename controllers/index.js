require('dotenv').config();
const sequelize = require('sequelize');
const db = require('../models');
const orderArray = require('./utils/orderArray');
const aws = require("aws-sdk");
const { Group, Category, Position } = require('../models');
const { AppResponse } = require('../routes/utils/AppResponse');
const { v4: uuidv4 } = require('uuid');


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
        Body: buffer
      },
      () => resolve()
    );
  });
}

const getSignedUrl = async (key, expires = 3600) => {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl("getObject", {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Expires: expires
    },
      function (err, url) {
        if (err) throw new Error(err);

        resolve(url);
      }
    );
  });
}

const deleteFromS3 = async (key) => {
  return new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: process.env.S3_BUCKET,
        Key: key,
      },
      function (err, url) {
        if (err) throw new Error(err);

        resolve(url);
      }
    );
  });
}

const createGroupAndFirstCategories = async (startParams, req) => {
  if (!startParams.vk_viewer_group_role || startParams.vk_viewer_group_role !== 'admin') {
    return AppResponse.forbidden({ message: 'Forbidden user' });
  }

  const data = await db.sequelize.transaction(async t => {
    const group = await Group.create({ vkGroupId: startParams.vk_group_id });

    const newCats = req.body.map(cat => {
      cat.groupId = group.id;
      return cat;
    });

    const Categories = await Category.bulkCreate(newCats);
    const catOrder = Categories.map(elem => { return elem.id });

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
            group.Categories[i].Positions[j].dataValues.imageUrl = await getSignedUrl(`images/${group.Categories[i].Positions[j].imageId}`);
          }
        }
      }
    }
    return AppResponse.ok({ group });
  }
  return AppResponse.notFound({ message: 'Group with specified Id not found' });
};

const changeCategories = (req, res) => {
  db.sequelize.transaction(async t => {
    console.log(req.body);
    const catOrder = req.body.catOrder;

    if (req.body.newCats.length > 0) {
      const newCats = await Category.bulkCreate(req.body.newCats, { fields: ['title', 'groupId']});
      req.body.newCats.forEach((cat, index)  => {
        const newIndex = catOrder.findIndex(id => id === cat.id);
        catOrder[newIndex] = newCats[index].id;
      });
    }

    if (req.body.catOrder) {
      const catOrderStr = '{' + catOrder.join() + '}';
      await db.sequelize.query(`UPDATE "Groups" SET "catOrder" = '${catOrderStr}' WHERE id = ${req.body.groupId}`);
    }

    if (req.body.deletedCats.length > 0) {
      const catsToDelete = await Category.findAll({ 
        where: { id: req.body.deletedCats },
        include: { all: true }
      });

      catsToDelete.forEach(category => {
        category.Positions.forEach(async position => {
          await deleteFromS3(`images/${position.imageId}`);
          await position.destroy();
        });
      });

      await Category.destroy({ where: { id: req.body.deletedCats }});
    }

    if (req.body.changedCats.length > 0) {
      const promises = req.body.changedCats.map(category => {
        return Category.update({ title: category.title }, {
          where: { id: category.id }
        });
      });
      await Promise.all(promises);
    }

    const group = await Group.findOne({
      where: { id: req.body.groupId },
      include: {
        all: true,
        nested: true
      }
    });

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
            group.Categories[i].Positions[j].dataValues.imageUrl = await getSignedUrl(`images/${group.Categories[i].Positions[j].imageId}`);
          }
        }
      }
    }

    return res.status(202).json({ group });
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
};

const createPosition = async (req, res) => {
  db.sequelize.transaction(async t => {
    //! проверить, что категория, в которой создают позицию, принадлежить группе

    const id = uuidv4();
    req.body.imageId = id;
    let position = await Position.create(req.body);

    await Category.update(
      { 'posOrder': sequelize.fn('array_append', sequelize.col('posOrder'), position.id) },
      { 'where': { 'id': position.categoryId }}
    );

    await uploadToS3(`images/${id}`, req.file.buffer, req.file.mimetype);
    position.dataValues.imageUrl = await getSignedUrl(`images/${id}`);

    return res.status(201).json({ position });
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
}

const changePositionOrder = async (req, res) => {
  db.sequelize.transaction(async t => {
    //! проверить, что изменяемая категория принадлежит группе
    const { id } = req.params;
    const posOrderStr = '{' + req.body.posOrder.join() + '}';

    await db.sequelize.query(`UPDATE "Categories" SET "posOrder" = '${posOrderStr}' WHERE id = ${id}`);
    
    return res.status(202).send('Positions order in category changed.');
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
}

const deletePosition = (req, res) => {
  db.sequelize.transaction(async t => {
    //! проверить, что позиция приндлежить категории, которая, приндлежить группе
    const { id } = req.params;

    const position = await Position.findByPk(id);
    
    await Category.update(
      { posOrder: db.sequelize.fn('array_remove', db.sequelize.col('posOrder'), id) },
      { where: { id: position.categoryId }}
    );
    
    await deleteFromS3(`images/${position.imageId}`);
    await position.destroy();

    return res.status(202).send('Position deleted successfully.');
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
}

const changePosition = (req, res) => {
  db.sequelize.transaction(async t => {
    //! проверить, что изменяемая позиция принадлежит категории, которая принадлежит группе
    const { id } = req.params;
    const newValues = req.body

    let position = await Position.findByPk(id).then(instance => {
        return instance;
    });

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
    
    if (req.file) {
      await uploadToS3(`images/${position.imageId}`, req.file.buffer, req.file.mimetype);
    }

    position.dataValues.imageUrl = await getSignedUrl(`images/${position.imageId}`);

    return res.status(202).json({ position });
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
}

module.exports = {
  createGroupAndFirstCategories,
  getGroupMenuById,
  changeCategories,
  createPosition,
  changePositionOrder,
  deletePosition,
  changePosition
};

