const router = require('express').Router();
const { Op } = require('sequelize');
const { Department, College, User, DataEntry, MetricCategory, Metric } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/departments
router.get('/', authenticate, async (req, res) => {
    const where = {};
    if (req.user.role !== 'admin') {
        // Non-admins see only their departments (simplified — extend with dept_users join)
    }
    const departments = await Department.findAll({
        where: { is_active: true },
        include: [
            { model: College, as: 'college', attributes: ['id', 'name_en', 'name_ar'] },
            { model: User, as: 'head', attributes: ['id', 'full_name', 'full_name_ar', 'email'] },
        ],
        order: [['name_ar', 'ASC']],
    });
    res.json({ departments });
});

// GET /api/departments/:id
router.get('/:id', authenticate, async (req, res) => {
    const dept = await Department.findByPk(req.params.id, {
        include: [
            { model: College, as: 'college' },
            { model: User, as: 'head', attributes: ['id', 'full_name', 'full_name_ar', 'email'] },
        ],
    });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ department: dept });
});

// POST /api/departments
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    const { name_en, name_ar, code, college_id, head_id } = req.body;
    if (!name_ar || !code) return res.status(400).json({ error: 'name_ar and code are required' });
    const dept = await Department.create({ name_en: name_en || name_ar, name_ar, code, college_id, head_id });
    res.status(201).json({ department: dept });
});

// PUT /api/departments/:id
router.put('/:id', authenticate, authorize('admin', 'department_head'), async (req, res) => {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    await dept.update(req.body);
    res.json({ department: dept });
});

// DELETE /api/departments/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    await dept.update({ is_active: false });
    res.json({ message: 'Department deactivated' });
});

// GET /api/departments/colleges/list
router.get('/colleges/list', authenticate, async (req, res) => {
    const colleges = await College.findAll({ where: { is_active: true }, order: [['name_ar', 'ASC']] });
    res.json({ colleges });
});

module.exports = router;
