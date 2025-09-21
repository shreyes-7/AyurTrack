const { herbService } = require('../services');

class HerbController {

    static async createHerb(req, res) {
        try {
            const herb = await herbService.createHerb(req.body);
            res.status(201).json(herb);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getHerb(req, res) {
        try {
            const herb = await herbService.getHerbById(req.params.id);
            res.json(herb);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    static async updateHerb(req, res) {
        try {
            const herb = await herbService.updateHerb(req.params.id, req.body);
            res.json(herb);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async deleteHerb(req, res) {
        try {
            const herb = await herbService.deleteHerb(req.params.id);
            res.json({ message: 'Herb deleted', herb });
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    static async transferHerb(req, res) {
        try {
            const { newOwner } = req.body;
            const herb = await herbService.transferHerb(req.params.id, newOwner);
            res.json(herb);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getAllHerbs(req, res) {
        try {
            const herbs = await herbService.getAllHerbs();
            res.json(herbs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = HerbController;
