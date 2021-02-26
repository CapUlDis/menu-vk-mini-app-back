require('dotenv').config();
const sequelize = require('sequelize');
const { Group, Category, Position } = require('../models');
const db = require('../models');
const orderArray = require('./utils/orderArray');
const { v4: uuidv4 } = require('uuid');
const aws = require("aws-sdk");
const { cast } = require('sequelize');

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

const createGroup = (req, res) => {
  db.sequelize.transaction(async t => {
    const group = await Group.create(req.body);
    return res.status(201).json({ group });
  }).catch((error) => {
    return res.status(500).json({ error: error.message });
  });
};

const getGroupMenuById = (req, res) => {
  db.sequelize.transaction(async t => {
    const { vkGroupId } = req.params;
    const group = await Group.findOne({
      where: { vkGroupId: vkGroupId },
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
      }
      return res.status(200).json({ group });
    }
    return res.status(404).send('Group with the specified ID does not exists');
  }).catch((error) => {
    return res.status(500).send(error.message);
  });
};

const createCategories = (req, res) => {
  db.sequelize.transaction(async t => {
    console.log(req.body);
    const Categories = await Category.bulkCreate(req.body.Categories);
    const catOrder = Categories.map(elem => { return elem.id });
    await Group.update({ catOrder }, {
      where: { vkGroupId: req.body.vkGroupId }
    });
    return res.status(201).json({ catOrder, Categories });
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
};

const createPosition = async (req, res) => {
  db.sequelize.transaction(async t => {
    const id = uuidv4();
    req.body.imageId = id;
    let position = await Position.create(req.body);

    await Category.update(
      { 'posOrder': sequelize.fn('array_append', sequelize.col('posOrder'), position.id) },
      { 'where': { 'id': position.categoryId } }
    );

    await uploadToS3(`images/${id}`, req.file.buffer, req.file.mimetype);
    position.dataValues.imageUrl = await getSignedUrl(`images/${id}`);

    return res.status(201).json({ position });
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
}

const getPosition = async (req, res) => {
  try {
    const image = await getSignedUrl(req.body.imageId);
    return res.status(200).send(image);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
}

const changePositionOrder = async (req, res) => {
  db.sequelize.transaction(async t => {
    const { id } = req.params;
    const posOrderStr = '{' + req.body.posOrder.join() + '}';

    await db.sequelize.query(`UPDATE "Categories" SET "posOrder" = '${posOrderStr}' WHERE id = ${id}`);
    
    return res.status(202).send('Positions order in category changed.');
  }).catch((error) => {
    console.log(error);
    return res.status(500).send(error.message);
  });
}

module.exports = {
  createGroup,
  getGroupMenuById,
  createCategories,
  createPosition,
  getPosition,
  changePositionOrder
};

