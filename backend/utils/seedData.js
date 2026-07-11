require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { sequelize, User, College, Department, MetricCategory, Metric, ReportingPeriod, DataEntry } = require('../models');

async function seed() {
    await sequelize.sync({ force: true });
    console.log('✅  Tables created');

    // Users
    const [admin, head1, entry1, viewer1] = await Promise.all([
        User.create({ email: 'admin@university.edu', password: await bcrypt.hash('Admin@123', 12), full_name: 'System Administrator', full_name_ar: 'مدير النظام', role: 'admin' }),
        User.create({ email: 'head.engineering@university.edu', password: await bcrypt.hash('Head@123', 12), full_name: 'Dr. Ahmed Al-Rashid', full_name_ar: 'د. أحمد الراشد', role: 'department_head' }),
        User.create({ email: 'data.entry@university.edu', password: await bcrypt.hash('Data@123', 12), full_name: 'Sara Al-Mansouri', full_name_ar: 'سارة المنصوري', role: 'data_entry' }),
        User.create({ email: 'viewer@university.edu', password: await bcrypt.hash('View@123', 12), full_name: 'Mohammed Al-Kaabi', full_name_ar: 'محمد الكعبي', role: 'viewer' }),
    ]);
    console.log('✅  Users created');

    // Colleges
    const colleges = await Promise.all([
        College.create({ name_en: 'College of Engineering', name_ar: 'كلية الهندسة', code: 'ENG', head_id: head1.id }),
        College.create({ name_en: 'College of Science', name_ar: 'كلية العلوم', code: 'SCI' }),
        College.create({ name_en: 'College of Administration & Economics', name_ar: 'كلية الإدارة والاقتصاد', code: 'ADM' }),
        College.create({ name_en: 'College of Islamic Sciences', name_ar: 'كلية العلوم الإسلامية', code: 'ISL' }),
        College.create({ name_en: 'College of Medicine', name_ar: 'كلية الطب', code: 'MED' }),
        College.create({ name_en: 'College of Law', name_ar: 'كلية القانون', code: 'LAW' }),
        College.create({ name_en: 'College of Media', name_ar: 'كلية الاعلام', code: 'MDA' }),
        College.create({ name_en: 'College of Nursing', name_ar: 'كلية التمريض', code: 'NRS' }),
    ]);
    console.log('✅  Colleges created');

    // Departments
    const deptData = [
        { eng: colleges[0], depts: [
            { n_en:'Civil Engineering', n_ar:'هندسة المدني', code:'CIVIL' },
            { n_en:'Petroleum Engineering', n_ar:'هندسة النفط والغاز', code:'PETRO' },
            { n_en:'Aerospace Engineering', n_ar:'هندسة الطائرات', code:'AERO' },
            { n_en:'Biomedical Engineering', n_ar:'هندسة الطب الحياتي', code:'BME' },
            { n_en:'HVAC Engineering', n_ar:'هندسة التكييف والتبريد', code:'HVAC' },
        ]},
        { eng: colleges[1], depts: [
            { n_en:'Physics', n_ar:'الفيزياء الطبية', code:'PHY' },
            { n_en:'Forensic Science', n_ar:'الأدلة الجنائية', code:'FORN' },
        ]},
        { eng: colleges[2], depts: [
            { n_en:'Business Administration', n_ar:'إدارة الأعمال', code:'BUS' },
            { n_en:'Accounting', n_ar:'المحاسبة', code:'ACC' },
            { n_en:'Economics', n_ar:'إدارة واقتصاد', code:'ECON' },
            { n_en:'Financial Sciences', n_ar:'علوم مالية ومصرفية', code:'FIN' },
        ]},
        { eng: colleges[3], depts: [
            { n_en:'Quran Sciences', n_ar:'علوم القران', code:'QRN' },
            { n_en:'Jurisprudence', n_ar:'الفقه والأصول', code:'FQIH' },
        ]},
        { eng: colleges[4], depts: [{ n_en:'Medicine', n_ar:'الطب البشري', code:'MED_DEPT' }] },
        { eng: colleges[5], depts: [{ n_en:'Law', n_ar:'القانون', code:'LAW_DEPT' }] },
        { eng: colleges[6], depts: [{ n_en:'Digital Media', n_ar:'الاعلام الرقمي', code:'DIG_MDA' }] },
        { eng: colleges[7], depts: [{ n_en:'Nursing', n_ar:'التمريض', code:'NRS_DEPT' }] },
    ];

    const departments = [];
    for (const { eng, depts } of deptData) {
        for (const d of depts) {
            departments.push(await Department.create({ name_en: d.n_en, name_ar: d.n_ar, code: d.code, college_id: eng.id }));
        }
    }
    console.log(`✅  ${departments.length} departments created`);

    // Metric Categories & Metrics
    const catData = [
        { n_en:'Program Accreditation', n_ar:'الاعتماد البرامجي', w:1.0, metrics:[
            { n_en:'Awareness workshops held', n_ar:'ورش تثقيفية عن المتطلبات', w:0.14 },
            { n_en:'Special committees formed', n_ar:'لجان خاصة لمتطلبات الاعتماد', w:0.14 },
            { n_en:'25% self-study report', n_ar:'اكمال 25% تقرير التقييم', w:0.14 },
            { n_en:'50% self-study report', n_ar:'اكمال 50% تقرير التقييم', w:0.14 },
            { n_en:'75% self-study report', n_ar:'اكمال 75% تقرير التقييم', w:0.14 },
            { n_en:'100% self-study report', n_ar:'اكمال 100% تقرير التقييم', w:0.14 },
            { n_en:'Improvement plan prepared', n_ar:'إعداد خطة التحسين', w:0.14 },
        ]},
        { n_en:'Labs Evaluation', n_ar:'تقييم المختبرات', w:1.0, metrics:[
            { n_en:'Lab equipment audit', n_ar:'مراجعة أجهزة المختبر', w:0.5 },
            { n_en:'Lab safety compliance', n_ar:'امتثال السلامة المختبرية', w:0.5 },
        ]},
        { n_en:'Performance Evaluation', n_ar:'تقييم الأداء', w:1.0, metrics:[
            { n_en:'KPI achievement rate', n_ar:'نسبة تحقيق مؤشرات الأداء', w:1.0 },
        ]},
        { n_en:'Program Description', n_ar:'وصف البرنامج', w:1.0, metrics:[
            { n_en:'Program description accuracy', n_ar:'دقة وصف البرنامج', w:1.0 },
        ]},
        { n_en:'Curriculum & Updates', n_ar:'المناهج والتحديث', w:1.0, metrics:[
            { n_en:'Curriculum update orders (50%)', n_ar:'أوامر التحديث', w:0.5 },
            { n_en:'Curriculum comparison (50%)', n_ar:'مقارنة المناهج', w:0.5 },
        ]},
        { n_en:'Community Service', n_ar:'خدمة المجتمع', w:1.0, metrics:[
            { n_en:'Administrative orders + minutes (50%)', n_ar:'أوامر إدارية + محضر', w:0.5 },
            { n_en:'Community service plan (50%)', n_ar:'خطة خدمة المجتمع', w:0.5 },
        ]},
        { n_en:'Compliance Rules', n_ar:'قواعد الامتثال', w:1.0, metrics:[
            { n_en:'Student-to-faculty ratio compliance', n_ar:'الامتثال لنسبة الطلبة إلى التدريسيين', w:1.0 },
        ]},
        { n_en:'Faculty Evaluation', n_ar:'تقييم التدريسيين', w:1.0, metrics:[
            { n_en:'Faculty evaluation score', n_ar:'درجة تقييم التدريسيين', w:0.7, metric_type:'score', max_value:100 },
            { n_en:'Dept head evaluation', n_ar:'تقييم من رئيس القسم', w:0.3 },
        ]},
        { n_en:'Labor Market Requirements', n_ar:'متطلبات سوق العمل', w:1.0, metrics:[
            { n_en:'Advisory council (25%)', n_ar:'المجلس الاستشاري', w:0.25 },
            { n_en:'Meeting minutes (25%)', n_ar:'محضر اجتماع', w:0.25 },
            { n_en:'Survey + analysis (50%)', n_ar:'استمارة وتحليل سوق العمل', w:0.5 },
        ]},
        { n_en:'Student Survey', n_ar:'استبانة تقييم الطلبة', w:1.0, metrics:[
            { n_en:'Survey completion (50%)', n_ar:'الاستبانة', w:0.5 },
            { n_en:'Recommendations (50%)', n_ar:'التوصيات', w:0.5 },
        ]},
        { n_en:'Institutional Accreditation', n_ar:'الاعتماد المؤسسي', w:1.0, metrics:[
            { n_en:'Self-evaluation report (50%)', n_ar:'تقرير التقييم الذاتي', w:0.5 },
            { n_en:'Improvement plan (50%)', n_ar:'خطة التحسين المؤسسية', w:0.5 },
        ]},
        { n_en:'Student Representation', n_ar:'ممثلية الطلبة', w:1.0, metrics:[
            { n_en:'Administrative order (50%)', n_ar:'أمر إداري', w:0.5 },
            { n_en:'Meeting minutes (50%)', n_ar:'محضر اجتماع الطلبة', w:0.5 },
        ]},
        { n_en:'Learning Outcomes', n_ar:'نتاجات التعلم', w:1.0, metrics:[
            { n_en:'Published on website (50%)', n_ar:'معلن على الموقع', w:0.5 },
            { n_en:'Meeting minutes (50%)', n_ar:'محضر نتاجات التعلم', w:0.5 },
        ]},
    ];

    const allMetrics = [];
    for (let i = 0; i < catData.length; i++) {
        const cd = catData[i];
        const cat = await MetricCategory.create({ name_en: cd.n_en, name_ar: cd.n_ar, weight: cd.w, sort_order: i + 1 });
        for (let j = 0; j < cd.metrics.length; j++) {
            const md = cd.metrics[j];
            allMetrics.push(await Metric.create({
                category_id: cat.id, name_en: md.n_en, name_ar: md.n_ar,
                weight: md.w || 1.0, metric_type: md.metric_type || 'percentage',
                max_value: md.max_value || 1.0, sort_order: j + 1,
            }));
        }
    }
    console.log(`✅  ${allMetrics.length} metrics created`);

    // Reporting Period
    const period = await ReportingPeriod.create({ year: 2024, month: 3, label_en: 'March 2024', label_ar: 'مارس 2024', deadline: '2024-04-15' });
    console.log('✅  Reporting period created');

    // Sample data entries
    const sampleScores = {
        'CIVIL': [0.286,1,1,1,1,0.5,0.5,0.94,0.84,1,0.5,1,1,0],
        'PETRO': [0.857,0.97,1,1,1,0.5,0.92,1,1,1,1,1,0],
        'AERO':  [1,0.97,1,1,1,0.5,1,1,1,1,1,1,0],
        'BUS':   [0.5,1,1,0.75,1,0.5,1,0.96,1,1,0,0.5,0],
        'ACC':   [0.5,1,1,0.75,0.75,0.5,1,0.91,1,1,0,0.5,0],
        'MED_DEPT':[1,1,1,1,1,0.5,1,0.97,1,1,0,0.5,0],
        'LAW_DEPT':[0.93,0.89,1,1,1,0.5,1,1,1,1,1,1,0],
        'NRS_DEPT':[0.714,0.98,1,1,1,0.5,1,1,1,1,1,1,0],
    };

    let entryCount = 0;
    for (const dept of departments) {
        const scores = sampleScores[dept.code];
        if (!scores) continue;
        for (let i = 0; i < Math.min(scores.length, allMetrics.length); i++) {
            await DataEntry.create({
                department_id: dept.id, metric_id: allMetrics[i].id, period_id: period.id,
                value: scores[i], status: 'approved', submitted_by: entry1.id, approved_by: admin.id,
                submitted_at: new Date(), approved_at: new Date(),
            });
            entryCount++;
        }
    }
    console.log(`✅  ${entryCount} data entries created`);
    console.log('\n🎉  Seed complete!');
    console.log('\n📋  Login credentials:');
    console.log('   Admin:        admin@university.edu / Admin@123');
    console.log('   Dept Head:    head.engineering@university.edu / Head@123');
    console.log('   Data Entry:   data.entry@university.edu / Data@123');
    console.log('   Viewer:       viewer@university.edu / View@123');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
