require('dotenv').config();
const { Group, Category } = require('../models');
const db = require('../models');
const orderArray = require('./utils/orderArray');
const { v4: uuidv4 } = require('uuid');
const aws = require("aws-sdk");

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
    try {
        const id = uuidv4();
        console.log(req.file.buffer, req.file.mimetype);
        await uploadToS3(`images/${id}`, req.file.buffer, req.file.mimetype);
        return res.status(201).send('OK');
    } catch (error) {
        console.log(error);
        return res.status(500).send(error.message);
    }
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

module.exports = {
    createGroup, 
    getGroupMenuById,
    createCategories,
    createPosition,
    getPosition
};

