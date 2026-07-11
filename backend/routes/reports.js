const router = require('express').Router();
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { Department, DataEntry, Metric, MetricCategory, ReportingPeriod, College } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/reports/export/excel
router.get('/export/excel', authenticate, async (req, res) => {
    const { period_id } = req.query;
    if (!period_id) return res.status(400).json({ error: 'period_id required' });

    const [departments, entries, period] = await Promise.all([
        Department.findAll({ where: { is_active: true }, include: [{ model: College, as: 'college' }], order: [['name_ar','ASC']] }),
        DataEntry.findAll({ where: { period_id }, include: [{ model: Metric, as: 'metric', include: [{ model: MetricCategory, as: 'category' }] }] }),
        ReportingPeriod.findByPk(period_id),
    ]);

    const entryMap = {};
    entries.forEach(e => { entryMap[`${e.department_id}__${e.metric_id}`] = e; });

    const categories = await MetricCategory.findAll({ where: { is_active: true }, include: [{ model: Metric, as: 'metrics', where: { is_active: true }, required: false }], order: [['sort_order','ASC']] });

    const headers = ['الكلية/القسم', ...categories.flatMap(c => c.metrics.map(m => m.name_ar)), 'التقييم الكلي'];
    const rows = [headers];

    departments.forEach(dept => {
        const scores = [];
        categories.forEach(cat => {
            cat.metrics.forEach(m => {
                const entry = entryMap[`${dept.id}__${m.id}`];
                scores.push(entry?.value != null ? Number(entry.value) : null);
            });
        });
        const valid = scores.filter(s => s !== null);
        const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        rows.push([dept.name_ar, ...scores.map(s => s != null ? (s * 100).toFixed(1) + '%' : 'غير محدد'), (avg * 100).toFixed(1) + '%']);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الأداء');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="report-${period?.label_ar || period_id}.xlsx"`,
    });
    res.send(buf);
});

// GET /api/reports/export/pdf
router.get('/export/pdf', authenticate, async (req, res) => {
    const { period_id } = req.query;
    const [departments, entries, period] = await Promise.all([
        Department.findAll({ where: { is_active: true }, include: [{ model: College, as: 'college' }], order: [['name_ar','ASC']] }),
        DataEntry.findAll({ where: { period_id }, include: [{ model: Metric, as: 'metric' }] }),
        ReportingPeriod.findByPk(period_id),
    ]);

    const entryMap = {};
    entries.forEach(e => { entryMap[`${e.department_id}__${e.metric_id}`] = e; });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="report.pdf"` });
    doc.pipe(res);

    doc.fontSize(18).text('University Performance Report', { align: 'center' });
    doc.fontSize(12).text(`Period: ${period?.label_en || period_id}`, { align: 'center' });
    doc.moveDown();

    departments.forEach(dept => {
        const deptEntries = entries.filter(e => e.department_id === dept.id);
        const vals = deptEntries.filter(e => e.value !== null).map(e => Number(e.value));
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

        doc.fontSize(11).text(`${dept.name_en} (${dept.name_ar})`, { continued: true });
        doc.fillColor(avg >= 0.9 ? 'green' : avg >= 0.7 ? 'orange' : 'red')
           .text(` — ${(avg * 100).toFixed(1)}%`)
           .fillColor('black');
    });

    doc.end();
});

// GET /api/reports/comparison
router.get('/comparison', authenticate, async (req, res) => {
    const { period1_id, period2_id } = req.query;
    if (!period1_id || !period2_id) return res.status(400).json({ error: 'Both period IDs required' });

    const [entries1, entries2] = await Promise.all([
        DataEntry.findAll({ where: { period_id: period1_id } }),
        DataEntry.findAll({ where: { period_id: period2_id } }),
    ]);

    const buildMap = (entries) => {
        const m = {};
        entries.forEach(e => {
            if (!m[e.department_id]) m[e.department_id] = { total: 0, count: 0 };
            if (e.value !== null) { m[e.department_id].total += Number(e.value); m[e.department_id].count++; }
        });
        return m;
    };

    const map1 = buildMap(entries1);
    const map2 = buildMap(entries2);
    const depts = await Department.findAll({ where: { is_active: true }, attributes: ['id', 'name_ar', 'name_en'] });

    const comparison = depts.map(d => {
        const s1 = map1[d.id] ? map1[d.id].total / map1[d.id].count : 0;
        const s2 = map2[d.id] ? map2[d.id].total / map2[d.id].count : 0;
        return { department: d, period1_score: Math.round(s1 * 100), period2_score: Math.round(s2 * 100), change: Math.round((s2 - s1) * 100) };
    });

    res.json({ comparison });
});

module.exports = router;
