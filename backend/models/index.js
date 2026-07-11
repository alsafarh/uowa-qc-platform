const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// ── User ──────────────────────────────────────────────────────
const User = sequelize.define('User', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email:       { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
    password:    { type: DataTypes.STRING, allowNull: false },
    full_name:   { type: DataTypes.STRING, allowNull: false },
    full_name_ar:{ type: DataTypes.STRING },
    role:        { type: DataTypes.ENUM('admin','department_head','data_entry','viewer'), defaultValue: 'viewer' },
    is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
    avatar_url:  { type: DataTypes.STRING },
    last_login:  { type: DataTypes.DATE },
}, { tableName: 'users' });

// ── College ───────────────────────────────────────────────────
const College = sequelize.define('College', {
    id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name_en:  { type: DataTypes.STRING, allowNull: false },
    name_ar:  { type: DataTypes.STRING, allowNull: false },
    code:     { type: DataTypes.STRING(50), unique: true, allowNull: false },
    is_active:{ type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'colleges' });

// ── Department ────────────────────────────────────────────────
const Department = sequelize.define('Department', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name_en:   { type: DataTypes.STRING, allowNull: false },
    name_ar:   { type: DataTypes.STRING, allowNull: false },
    code:      { type: DataTypes.STRING(50), unique: true, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'departments' });

// ── MetricCategory ────────────────────────────────────────────
const MetricCategory = sequelize.define('MetricCategory', {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name_en:    { type: DataTypes.STRING, allowNull: false },
    name_ar:    { type: DataTypes.STRING, allowNull: false },
    weight:     { type: DataTypes.DECIMAL(5, 4), defaultValue: 1.0 },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active:  { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'metric_categories' });

// ── Metric ────────────────────────────────────────────────────
const Metric = sequelize.define('Metric', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name_en:         { type: DataTypes.STRING, allowNull: false },
    name_ar:         { type: DataTypes.STRING, allowNull: false },
    description_en:  { type: DataTypes.TEXT },
    description_ar:  { type: DataTypes.TEXT },
    metric_type:     { type: DataTypes.STRING(50), defaultValue: 'percentage' },
    max_value:       { type: DataTypes.DECIMAL(10, 2), defaultValue: 1.0 },
    weight:          { type: DataTypes.DECIMAL(5, 4), defaultValue: 1.0 },
    deadline_day:    { type: DataTypes.INTEGER },
    is_required:     { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order:      { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active:       { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'metrics' });

// ── ReportingPeriod ───────────────────────────────────────────
const ReportingPeriod = sequelize.define('ReportingPeriod', {
    id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    year:     { type: DataTypes.INTEGER, allowNull: false },
    month:    { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
    label_en: { type: DataTypes.STRING(100) },
    label_ar: { type: DataTypes.STRING(100) },
    is_open:  { type: DataTypes.BOOLEAN, defaultValue: true },
    deadline: { type: DataTypes.DATEONLY },
}, { tableName: 'reporting_periods' });

// ── DataEntry ─────────────────────────────────────────────────
const DataEntry = sequelize.define('DataEntry', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    value:         { type: DataTypes.DECIMAL(10, 4) },
    notes:         { type: DataTypes.TEXT },
    evidence_urls: { type: DataTypes.JSONB, defaultValue: [] },
    status:        { type: DataTypes.STRING(50), defaultValue: 'draft' },
    submitted_at:  { type: DataTypes.DATE },
    approved_at:   { type: DataTypes.DATE },
}, { tableName: 'data_entries' });

// ── Notification ──────────────────────────────────────────────
const Notification = sequelize.define('Notification', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type:        { type: DataTypes.ENUM('missing_data','deadline','approval','system','reminder'), allowNull: false },
    title_en:    { type: DataTypes.STRING(500), allowNull: false },
    title_ar:    { type: DataTypes.STRING(500) },
    message_en:  { type: DataTypes.TEXT },
    message_ar:  { type: DataTypes.TEXT },
    is_read:     { type: DataTypes.BOOLEAN, defaultValue: false },
    priority:    { type: DataTypes.STRING(20), defaultValue: 'normal' },
    action_url:  { type: DataTypes.STRING(500) },
}, { tableName: 'notifications' });

// ── Associations ──────────────────────────────────────────────
College.hasMany(Department, { foreignKey: 'college_id', as: 'departments' });
Department.belongsTo(College, { foreignKey: 'college_id', as: 'college' });
College.belongsTo(User, { foreignKey: 'head_id', as: 'head' });
Department.belongsTo(User, { foreignKey: 'head_id', as: 'head' });

MetricCategory.hasMany(Metric, { foreignKey: 'category_id', as: 'metrics' });
Metric.belongsTo(MetricCategory, { foreignKey: 'category_id', as: 'category' });

Department.hasMany(DataEntry, { foreignKey: 'department_id', as: 'entries' });
Metric.hasMany(DataEntry, { foreignKey: 'metric_id', as: 'entries' });
ReportingPeriod.hasMany(DataEntry, { foreignKey: 'period_id', as: 'entries' });
DataEntry.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
DataEntry.belongsTo(Metric, { foreignKey: 'metric_id', as: 'metric' });
DataEntry.belongsTo(ReportingPeriod, { foreignKey: 'period_id', as: 'period' });
DataEntry.belongsTo(User, { foreignKey: 'submitted_by', as: 'submitter' });
DataEntry.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

module.exports = { sequelize, User, College, Department, MetricCategory, Metric, ReportingPeriod, DataEntry, Notification };
