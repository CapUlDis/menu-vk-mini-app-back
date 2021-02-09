const { Group } = require('../models');

const createGroup = async (req, res) => {
    try {
        const group = await Group.create(req.body);
        return res.status(201).json({
            group,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const getGroupMenuById = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findOne({
            where: { groupId: groupId },
            include: { 
                all: true, 
                nested: true 
            }
        });
        if (group) {
            return res.status(200).json({ group });
        }
        return res.status(404).send('Group with the specified ID does not exists');
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports = {
    createGroup, 
    getGroupMenuById
};

