const { Group, Category } = require('../models');
const db = require('../models');
const orderArray = require('./utils/orderArray');

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
        const { groupId } = req.params;
        const group = await Group.findOne({
            where: { groupId: groupId },
            include: { 
                all: true, 
                nested: true 
            }
        });
        if (group) {
            group.Categories = orderArray(group.Categories, group.catOrder, 'id');
            return res.status(200).json({ group });
        }
        return res.status(404).send('Group with the specified ID does not exists');
    }).catch((error) => {
        return res.status(500).send(error.message);
    });
};

const createCategories = (req, res) => {
    db.sequelize.transaction(async t => {
        const categories = await Category.bulkCreate(req.body.categories);
        const catOrder = categories.map(elem => { return elem.id });
        await Group.update({ catOrder }, {
            where: { groupId: req.body.groupId }
        });
        return res.status(201).json({ catOrder, categories });
    }).catch((error) => {
        return res.status(500).send(error.message);
    });
};

module.exports = {
    createGroup, 
    getGroupMenuById,
    createCategories
};

