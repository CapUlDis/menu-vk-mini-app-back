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

module.exports = {
    createGroup, 
    getGroupMenuById,
    createCategories
};

