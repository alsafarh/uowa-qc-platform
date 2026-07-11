# نظام متابعة الأداء الأكاديمي الجامعي
# University Academic Performance Tracking System

## نظرة عامة | Overview

منصة ويب متكاملة لمتابعة الأداء الأكاديمي لجميع الأقسام والكليات الجامعية، مع لوحة تحكم تفاعلية ونظام إدخال بيانات وتقارير احترافية.

---

## المتطلبات | Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9
- (اختياري) Docker & Docker Compose

---

## الإعداد السريع | Quick Setup

### الطريقة 1: Docker (موصى به)

```bash
# 1. استنساخ المشروع
git clone <repo-url>
cd university-platform

# 2. إنشاء ملف البيئة
cp backend/.env.example backend/.env
# عدّل القيم في backend/.env

# 3. تشغيل جميع الخدمات
docker-compose up -d

# 4. بذر البيانات التجريبية
docker exec univ_backend node utils/seedData.js

# 5. افتح المتصفح
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
```

---

### الطريقة 2: التشغيل المحلي

#### قاعدة البيانات (PostgreSQL)

```bash
# إنشاء قاعدة البيانات
psql -U postgres
CREATE DATABASE university_platform;
\q

# تطبيق الـ schema
psql -U postgres -d university_platform -f database/schema.sql
```

#### الـ Backend

```bash
cd backend

# نسخ وتعديل ملف البيئة
cp .env.example .env
# افتح .env وعدّل DB_PASSWORD و JWT_SECRET

# تثبيت الحزم
npm install

# بذر البيانات التجريبية (المرة الأولى فقط)
npm run seed

# تشغيل الخادم
npm run dev
# سيعمل على: http://localhost:5000
```

#### الـ Frontend

```bash
cd frontend

# تثبيت الحزم
npm install

# تشغيل
npm start
# سيعمل على: http://localhost:3000
```

---

## حسابات الدخول التجريبية | Demo Credentials

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير النظام | admin@university.edu | Admin@123 |
| رئيس القسم | head.engineering@university.edu | Head@123 |
| إدخال بيانات | data.entry@university.edu | Data@123 |
| مشاهد | viewer@university.edu | View@123 |

---

## بنية المشروع | Project Structure

```
university-platform/
├── backend/
│   ├── config/
│   │   └── database.js          # Sequelize connection
│   ├── middleware/
│   │   └── auth.js              # JWT auth + RBAC
│   ├── models/
│   │   └── index.js             # All Sequelize models + associations
│   ├── routes/
│   │   ├── auth.js              # Login, /me, change-password
│   │   ├── users.js             # CRUD users (admin only)
│   │   ├── departments.js       # CRUD departments & colleges
│   │   ├── data.js              # Data entry, bulk save, Excel upload
│   │   ├── dashboard.js         # KPIs, trends, category scores
│   │   ├── reports.js           # Excel/PDF export, comparison
│   │   └── notifications.js     # List, mark read, create
│   ├── utils/
│   │   ├── seedData.js          # Seed 35+ departments + sample data
│   │   └── notifications.js     # Cron job helpers
│   ├── uploads/                 # Uploaded files (Excel, etc.)
│   ├── server.js                # Express app entry point
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Auth/Login.js         # Login page with demo buttons
│       │   ├── Layout/Layout.js      # Sidebar + top header
│       │   ├── Dashboard/Dashboard.js # KPIs + Bar/Donut/Line charts
│       │   ├── Departments/
│       │   │   ├── Departments.js    # Dept cards grouped by college
│       │   │   └── DepartmentDetail.js # Per-dept data view
│       │   ├── DataEntry/DataEntry.js # Metric entry form + Excel upload
│       │   ├── Analytics/Analytics.js # Radar + comparison + export
│       │   ├── Users/Users.js        # User management (admin)
│       │   └── Notifications/...     # Notification feed
│       ├── contexts/AuthContext.js   # JWT auth state
│       ├── utils/api.js              # Axios client + all API calls
│       ├── styles/global.css         # RTL CSS design system
│       └── App.js                    # Router + PrivateRoute
│
├── database/
│   └── schema.sql               # PostgreSQL schema + seed categories
├── docker-compose.yml
└── README.md
```

---

## API Reference | مرجع الـ API

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | تسجيل الدخول |
| GET | `/api/auth/me` | بيانات المستخدم الحالي |
| POST | `/api/auth/change-password` | تغيير كلمة المرور |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary?period_id=` | ملخص KPIs + جميع الأقسام |
| GET | `/api/dashboard/trends` | اتجاه الأداء (آخر 6 أشهر) |
| GET | `/api/dashboard/category-scores?period_id=` | متوسط كل محور |

### Data Entry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/metrics` | جميع المحاور والمؤشرات |
| GET | `/api/data/periods` | الفترات الزمنية |
| GET | `/api/data/entries?department_id=&period_id=` | استعلام البيانات |
| POST | `/api/data/entries` | إدخال مؤشر واحد |
| POST | `/api/data/entries/bulk` | إدخال جماعي |
| PUT | `/api/data/entries/:id/approve` | اعتماد بيانات |
| POST | `/api/data/upload` | رفع ملف Excel |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/export/excel?period_id=` | تصدير Excel |
| GET | `/api/reports/export/pdf?period_id=` | تصدير PDF |
| GET | `/api/reports/comparison?period1_id=&period2_id=` | مقارنة فترتين |

---

## الصلاحيات | Permissions

| الإجراء | admin | department_head | data_entry | viewer |
|---------|-------|----------------|------------|--------|
| عرض لوحة التحكم | ✅ | ✅ | ✅ | ✅ |
| إدخال البيانات | ✅ | ✅ | ✅ | ❌ |
| اعتماد البيانات | ✅ | ✅ | ❌ | ❌ |
| إدارة الأقسام | ✅ | ❌ | ❌ | ❌ |
| إدارة المستخدمين | ✅ | ❌ | ❌ | ❌ |
| تصدير التقارير | ✅ | ✅ | ✅ | ✅ |
| إرسال إشعارات | ✅ | ❌ | ❌ | ❌ |

---

## النشر على الإنتاج | Production Deployment

### متغيرات البيئة المطلوبة
```env
NODE_ENV=production
JWT_SECRET=<سلسلة عشوائية طويلة جداً>
DB_PASSWORD=<كلمة مرور قوية>
FRONTEND_URL=https://yourdomain.com
```

### نشر على Ubuntu Server
```bash
# 1. تثبيت Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. رفع الملفات
scp -r university-platform user@server:/app/

# 3. تشغيل
cd /app/university-platform
docker-compose -f docker-compose.yml up -d

# 4. SSL مع Certbot (اختياري)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## التقنيات المستخدمة | Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + React Router 6 |
| Charts | Chart.js + react-chartjs-2 |
| Backend | Node.js + Express 4 |
| ORM | Sequelize 6 |
| Database | PostgreSQL 15 |
| Auth | JWT (jsonwebtoken) |
| File Upload | Multer |
| Excel | xlsx (SheetJS) |
| PDF | PDFKit |
| Cron Jobs | node-cron |
| Container | Docker + Docker Compose |
| Web Server | Nginx (production) |

---

## إضافة فترة زمنية جديدة | Add New Reporting Period

```bash
# عبر API (admin token مطلوب)
curl -X POST http://localhost:5000/api/data/periods \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"year":2024,"month":4,"label_ar":"أبريل 2024","label_en":"April 2024","deadline":"2024-05-15"}'
```

أو مباشرة من قاعدة البيانات:
```sql
INSERT INTO reporting_periods (year, month, label_ar, label_en, deadline)
VALUES (2024, 4, 'أبريل 2024', 'April 2024', '2024-05-15');
```
