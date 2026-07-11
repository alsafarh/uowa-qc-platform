const router = require('express').Router();
const { sequelize } = require('../config/database');
const { Department, College, DataEntry, Metric, MetricCategory, ReportingPeriod } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');

// GET /api/dashboard/summary
router.get('/summary', authenticate, async (req, res) => {
    const { period_id } = req.query;

    const [departments, period, entries] = await Promise.all([
        Department.findAll({ where: { is_active: true }, include: [{ model: College, as: 'college' }] }),
        period_id ? ReportingPeriod.findByPk(period_id) : ReportingPeriod.findOne({ order: [['year', 'DESC'], ['month', 'DESC']] }),
        period_id ? DataEntry.findAll({ where: { period_id }, include: [{ model: Metric, as: 'metric' }] }) : [],
    ]);

    // Build dept score map
    const scoreMap = {};
    entries.forEach(e => {
        if (!scoreMap[e.department_id]) scoreMap[e.department_id] = { total: 0, count: 0, missing: 0 };
        if (e.value !== null) {
            scoreMap[e.department_id].total += Number(e.value) / Number(e.metric?.max_value || 1);
            scoreMap[e.department_id].count++;
        } else {
            scoreMap[e.department_id].missing++;
        }
    });

    const deptScores = departments.map(d => {
        const s = scoreMap[d.id] || { total: 0, count: 0, missing: 0 };
        const score = s.count > 0 ? s.total / s.count : 0;
        return {
            id: d.id, name_ar: d.name_ar, name_en: d.name_en,
            college: d.college, score: Math.round(score * 10000) / 100,
            entries_count: s.count, missing_count: s.missing,
        };
    });

    const totalDepts = departments.length;
    const avgScore = deptScores.reduce((a, b) => a + b.score, 0) / (totalDepts || 1);
    const excellent = deptScores.filter(d => d.score >= 90).length;
    const needsAttention = deptScores.filter(d => d.score < 50).length;
    const withMissing = deptScores.filter(d => d.missing_count > 0).length;

    res.json({
        period,
        summary: {
            total_departments: totalDepts,
            avg_score: Math.round(avgScore * 100) / 100,
            excellent_count: excellent,
            needs_attention_count: needsAttention,
            departments_with_missing: withMissing,
        },
        departments: deptScores.sort((a, b) => b.score - a.score),
    });
});

// GET /api/dashboard/trends  — last 6 months
router.get('/trends', authenticate, async (req, res) => {
    const periods = await ReportingPeriod.findAll({ order: [['year', 'DESC'], ['month', 'DESC']], limit: 6 });

    const trends = await Promise.all(periods.map(async (p) => {
        const entries = await DataEntry.findAll({
            where: { period_id: p.id },
            include: [{ model: Metric, as: 'metric', attributes: ['max_value'] }],
        });
        const vals = entries.filter(e => e.value !== null)
            .map(e => Number(e.value) / Number(e.metric?.max_value || 1));
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length * 100 : 0;
        return { period: `${p.year}/${String(p.month).padStart(2, '0')}`, avg: Math.round(avg * 100) / 100, label: p.label_ar || `${p.month}/${p.year}` };
    }));

    res.json({ trends: trends.reverse() });
});

// GET /api/dashboard/category-scores
router.get('/category-scores', authenticate, async (req, res) => {
    const { period_id } = req.query;
    if (!period_id) return res.json({ categories: [] });

    const categories = await MetricCategory.findAll({
        where: { is_active: true },
        include: [{ model: Metric, as: 'metrics', where: { is_active: true }, required: false }],
    });

    const entries = await DataEntry.findAll({ where: { period_id } });
    const entryMap = {};
    entries.forEach(e => { entryMap[e.metric_id] = e; });

    const catScores = categories.map(cat => {
        const catEntries = cat.metrics.map(m => entryMap[m.id]).filter(Boolean);
        const vals = catEntries.filter(e => e.value !== null).map(e => Number(e.value));
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { id: cat.id, name_ar: cat.name_ar, name_en: cat.name_en, avg_score: Math.round(avg * 100), count: vals.length };
    });

    res.json({ categories: catScores });
});

module.exports = router;
