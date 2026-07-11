-- University Performance Tracking Platform
-- PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & AUTH
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'department_head', 'data_entry', 'viewer');

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    full_name_ar VARCHAR(255),
    role        user_role NOT NULL DEFAULT 'viewer',
    is_active   BOOLEAN DEFAULT TRUE,
    avatar_url  VARCHAR(500),
    last_login  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE colleges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en     VARCHAR(255) NOT NULL,
    name_ar     VARCHAR(255) NOT NULL,
    code        VARCHAR(50) UNIQUE NOT NULL,
    head_id     UUID REFERENCES users(id),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id  UUID REFERENCES colleges(id) ON DELETE CASCADE,
    name_en     VARCHAR(255) NOT NULL,
    name_ar     VARCHAR(255) NOT NULL,
    code        VARCHAR(50) UNIQUE NOT NULL,
    head_id     UUID REFERENCES users(id),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE department_users (
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    role          user_role NOT NULL DEFAULT 'viewer',
    assigned_at   TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (department_id, user_id)
);

-- ============================================================
-- METRIC DEFINITIONS
-- ============================================================
CREATE TABLE metric_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en     VARCHAR(255) NOT NULL,
    name_ar     VARCHAR(255) NOT NULL,
    weight      DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE metrics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     UUID REFERENCES metric_categories(id),
    name_en         VARCHAR(255) NOT NULL,
    name_ar         VARCHAR(255) NOT NULL,
    description_en  TEXT,
    description_ar  TEXT,
    metric_type     VARCHAR(50) DEFAULT 'percentage',  -- percentage | count | boolean | score
    max_value       DECIMAL(10,2) DEFAULT 1.0,
    weight          DECIMAL(5,4) DEFAULT 1.0,
    deadline_day    INTEGER,  -- day of month for monthly deadline
    is_required     BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DATA ENTRIES (monthly submissions)
-- ============================================================
CREATE TABLE reporting_periods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    label_en    VARCHAR(100),
    label_ar    VARCHAR(100),
    is_open     BOOLEAN DEFAULT TRUE,
    deadline    DATE,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(year, month)
);

CREATE TABLE data_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
    metric_id       UUID REFERENCES metrics(id) ON DELETE CASCADE,
    period_id       UUID REFERENCES reporting_periods(id),
    value           DECIMAL(10,4),
    notes           TEXT,
    evidence_urls   JSONB DEFAULT '[]',
    status          VARCHAR(50) DEFAULT 'draft',  -- draft | submitted | approved | rejected
    submitted_by    UUID REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    submitted_at    TIMESTAMP,
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(department_id, metric_id, period_id)
);

-- ============================================================
-- FILE UPLOADS
-- ============================================================
CREATE TABLE file_uploads (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id),
    entry_id      UUID REFERENCES data_entries(id),
    file_name     VARCHAR(500) NOT NULL,
    file_path     VARCHAR(1000) NOT NULL,
    file_size     INTEGER,
    mime_type     VARCHAR(100),
    uploaded_by   UUID REFERENCES users(id),
    uploaded_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TYPE notification_type AS ENUM ('missing_data', 'deadline', 'approval', 'system', 'reminder');

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id   UUID REFERENCES departments(id),
    type            notification_type NOT NULL,
    title_en        VARCHAR(500) NOT NULL,
    title_ar        VARCHAR(500),
    message_en      TEXT,
    message_ar      TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    priority        VARCHAR(20) DEFAULT 'normal',  -- low | normal | high | urgent
    action_url      VARCHAR(500),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    table_name  VARCHAR(100),
    record_id   UUID,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================
CREATE VIEW department_scores AS
SELECT
    d.id AS department_id,
    d.name_ar AS department_name,
    c.name_ar AS college_name,
    rp.year,
    rp.month,
    COUNT(de.id) AS entries_count,
    AVG(de.value / m.max_value) AS avg_score,
    SUM(CASE WHEN de.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
    SUM(CASE WHEN de.value IS NULL THEN 1 ELSE 0 END) AS missing_count
FROM departments d
JOIN colleges c ON d.college_id = c.id
LEFT JOIN data_entries de ON de.department_id = d.id
LEFT JOIN metrics m ON de.metric_id = m.id
LEFT JOIN reporting_periods rp ON de.period_id = rp.id
GROUP BY d.id, d.name_ar, c.name_ar, rp.year, rp.month;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_data_entries_dept_period ON data_entries(department_id, period_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at);
CREATE INDEX idx_data_entries_status ON data_entries(status);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO metric_categories (id, name_en, name_ar, weight, sort_order) VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'Program Accreditation',     'الاعتماد البرامجي',     1.0, 1),
    ('a1b2c3d4-0001-0001-0001-000000000002', 'Labs Evaluation',            'تقييم المختبرات',       1.0, 2),
    ('a1b2c3d4-0001-0001-0001-000000000003', 'Performance Evaluation',     'تقييم الأداء',          1.0, 3),
    ('a1b2c3d4-0001-0001-0001-000000000004', 'Program Description',        'وصف البرنامج',          1.0, 4),
    ('a1b2c3d4-0001-0001-0001-000000000005', 'Course Description',         'وصف المقررات',          1.0, 5),
    ('a1b2c3d4-0001-0001-0001-000000000006', 'Curriculum & Updates',       'المناهج والتحديث',      1.0, 6),
    ('a1b2c3d4-0001-0001-0001-000000000007', 'Community Service',          'خدمة المجتمع',          1.0, 7),
    ('a1b2c3d4-0001-0001-0001-000000000008', 'Compliance Rules',           'قواعد الامتثال',        1.0, 8),
    ('a1b2c3d4-0001-0001-0001-000000000009', 'Faculty Evaluation',         'تقييم التدريسيين',      1.0, 9),
    ('a1b2c3d4-0001-0001-0001-000000000010', 'Labor Market Requirements',  'متطلبات سوق العمل',     1.0, 10),
    ('a1b2c3d4-0001-0001-0001-000000000011', 'Student Survey',             'استبانة تقييم الطلبة',  1.0, 11),
    ('a1b2c3d4-0001-0001-0001-000000000012', 'Institutional Accreditation','الاعتماد المؤسسي',      1.0, 12),
    ('a1b2c3d4-0001-0001-0001-000000000013', 'Student Representation',     'ممثلية الطلبة',         1.0, 13),
    ('a1b2c3d4-0001-0001-0001-000000000014', 'Learning Outcomes',          'نتاجات التعلم',         1.0, 14);
