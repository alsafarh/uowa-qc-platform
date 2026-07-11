const { Notification, User, Department, ReportingPeriod, DataEntry, Metric } = require('../models');
const { Op } = require('sequelize');

async function sendDeadlineReminders() {
    const openPeriods = await ReportingPeriod.findAll({ where: { is_open: true, deadline: { [Op.gte]: new Date() } } });
    const users = await User.findAll({ where: { is_active: true, role: { [Op.in]: ['admin', 'department_head', 'data_entry'] } } });

    for (const period of openPeriods) {
        const daysLeft = Math.ceil((new Date(period.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 7) continue;

        for (const user of users) {
            const existing = await Notification.findOne({
                where: { user_id: user.id, type: 'deadline', created_at: { [Op.gte]: new Date(Date.now() - 24*60*60*1000) } },
            });
            if (existing) continue;

            await Notification.create({
                user_id: user.id, type: 'deadline', priority: daysLeft <= 2 ? 'urgent' : 'high',
                title_en: `Deadline Reminder: ${period.label_en}`,
                title_ar: `تذكير بالموعد النهائي: ${period.label_ar}`,
                message_en: `${daysLeft} days remaining to submit data for ${period.label_en}`,
                message_ar: `متبقي ${daysLeft} يوم لإدخال بيانات ${period.label_ar}`,
                action_url: '/data-entry',
            });
        }
    }
}

async function notifyMissingData(department_id, period_id) {
    const dept = await Department.findByPk(department_id);
    const users = await User.findAll({ where: { role: { [Op.in]: ['admin', 'department_head'] } } });

    for (const user of users) {
        await Notification.create({
            user_id: user.id, department_id, type: 'missing_data', priority: 'high',
            title_en: `Missing data: ${dept.name_en}`,
            title_ar: `بيانات مفقودة: ${dept.name_ar}`,
            message_en: `Department ${dept.name_en} has not submitted all required data.`,
            message_ar: `لم يقم قسم ${dept.name_ar} بإدخال جميع البيانات المطلوبة.`,
            action_url: `/departments/${department_id}`,
        });
    }
}

module.exports = { sendDeadlineReminders, notifyMissingData };
