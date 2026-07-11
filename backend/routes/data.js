const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const { DataEntry, Metric, MetricCategory, Department, ReportingPeriod } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/data/metrics
router.get('/metrics', authenticate, async (req, res) => {
    const categories = await MetricCategory.findAll({
        where: { is_active: true },
        include: [{ model: Metric, as: 'metrics', where: { is_active: true }, required: false }],
        order: [['sort_order', 'ASC'], [{ model: Metric, as: 'metrics' }, 'sort_order', 'ASC']],
    });
    res.json({ categories });
});

// GET /api/data/periods
router.get('/periods', authenticate, async (req, res) => {
    const periods = await ReportingPeriod.findAll({ order: [['year', 'DESC'], ['month', 'DESC']] });
    res.json({ periods });
});

// GET /api/data/entries
router.get('/entries', authenticate, async (req, res) => {
    const { department_id, period_id } = req.query;
    const where = {};
    if (department_id) where.department_id = department_id;
    if (period_id) where.period_id = period_id;

    const entries = await DataEntry.findAll({
        where,
        include: [
            { model: Metric, as: 'metric', include: [{ model: MetricCategory, as: 'category' }] },
            { model: Department, as: 'department', attributes: ['id', 'name_ar', 'name_en'] },
        ],
        order: [['updated_at', 'DESC']],
    });
    res.json({ entries });
});

// POST /api/data/entries
router.post('/entries', authenticate, authorize('admin', 'department_head', 'data_entry'), async (req, res) => {
    const { department_id, metric_id, period_id, value, notes } = req.body;
    if (!department_id || !metric_id || !period_id) {
        return res.status(400).json({ error: 'department_id, metric_id, period_id required' });
    }

    const [entry, created] = await DataEntry.findOrCreate({
        where: { department_id, metric_id, period_id },
        defaults: { value, notes, submitted_by: req.user.id, status: 'draft' },
    });
    if (!created) await entry.update({ value, notes, status: 'draft' });
    res.status(created ? 201 : 200).json({ entry });
});

// POST /api/data/entries/bulk  — submit all entries for a dept/period
router.post('/entries/bulk', authenticate, authorize('admin', 'department_head', 'data_entry'), async (req, res) => {
    const { department_id, period_id, entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' });

    const results = await Promise.all(entries.map(async ({ metric_id, value, notes }) => {
        const [entry] = await DataEntry.findOrCreate({
            where: { department_id, metric_id, period_id },
            defaults: { value, notes, submitted_by: req.user.id, status: 'submitted', submitted_at: new Date() },
        });
        await entry.update({ value, notes, status: 'submitted', submitted_at: new Date() });
        return entry;
    }));
    res.json({ saved: results.length });
});

// PUT /api/data/entries/:id/approve
router.put('/entries/:id/approve', authenticate, authorize('admin', 'department_head'), async (req, res) => {
    const entry = await DataEntry.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    await entry.update({ status: 'approved', approved_by: req.user.id, approved_at: new Date() });
    res.json({ entry });
});

// POST /api/data/upload — Excel/CSV import
router.post('/upload', authenticate, authorize('admin', 'department_head', 'data_entry'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { department_id, period_id } = req.body;

    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    const metrics = await Metric.findAll({ where: { is_active: true } });
    const metricMap = {};
    metrics.forEach(m => { metricMap[m.name_ar] = m.id; metricMap[m.name_en] = m.id; });

    let imported = 0;
    for (const row of rows) {
        const metricName = row['metric'] || row['المؤشر'] || row['Metric'];
        const value = parseFloat(row['value'] || row['القيمة'] || row['Value'] || 0);
        if (!metricName || !metricMap[metricName]) continue;

        await DataEntry.findOrCreate({
            where: { department_id, metric_id: metricMap[metricName], period_id },
            defaults: { value, submitted_by: req.user.id, status: 'draft' },
        }).then(([entry, created]) => !created && entry.update({ value }));
        imported++;
    }
    res.json({ imported, total: rows.length });
});

module.exports = router;
