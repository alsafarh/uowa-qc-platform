import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { departmentsAPI, dataAPI } from '../../utils/api';

const scoreColor = s => s >= 0.9 ? '#0e9f6e' : s >= 0.7 ? '#1a56db' : s >= 0.5 ? '#c27803' : '#e02424';

export default function DepartmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dept, setDept] = useState(null);
    const [entries, setEntries] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selPeriod, setSelPeriod] = useState('');

    useEffect(() => {
        departmentsAPI.get(id).then(r => setDept(r.data.department)).catch(() => navigate('/departments'));
        dataAPI.periods().then(r => { const ps = r.data.periods || []; setPeriods(ps); if (ps[0]) setSelPeriod(ps[0].id); }).catch(() => {});
    }, [id]);

    useEffect(() => {
        if (!selPeriod) return;
        dataAPI.entries({ department_id: id, period_id: selPeriod }).then(r => setEntries(r.data.entries || [])).catch(() => {});
    }, [id, selPeriod]);

    const byCategory = {};
    entries.forEach(e => {
        const cat = e.metric?.category?.name_ar || 'أخرى';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(e);
    });

    const overallScore = entries.length > 0
        ? entries.filter(e => e.value !== null).reduce((s, e) => s + Number(e.value), 0) / entries.filter(e => e.value !== null).length
        : 0;

    if (!dept) return <div className="flex items-center justify-between" style={{ height: 200 }}><div className="spinner" /></div>;

    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/departments')}>← رجوع</button>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>{dept.name_ar}</h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{dept.college?.name_ar}</p>
                </div>
            </div>

            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
                <div className="metric-card primary"><div className="metric-card-label">التقييم الكلي</div><div className="metric-card-value" style={{ color: scoreColor(overallScore) }}>{(overallScore * 100).toFixed(1)}%</div></div>
                <div className="metric-card"><div className="metric-card-label">البيانات المُدخلة</div><div className="metric-card-value">{entries.filter(e => e.value !== null).length}</div></div>
                <div className="metric-card"><div className="metric-card-label">البيانات المفقودة</div><div className="metric-card-value" style={{ color: 'var(--danger)' }}>{entries.filter(e => e.value === null).length}</div></div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <label style={{ fontSize: 14, fontWeight: 500 }}>الفترة:</label>
                <select className="form-select" style={{ width: 'auto' }} value={selPeriod} onChange={e => setSelPeriod(e.target.value)}>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.label_ar || `${p.month}/${p.year}`}</option>)}
                </select>
            </div>

            {Object.entries(byCategory).map(([cat, catEntries]) => {
                const vals = catEntries.filter(e => e.value !== null).map(e => Number(e.value));
                const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                return (
                    <div key={cat} className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header">
                            <span className="card-title">{cat}</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: scoreColor(avg) }}>{(avg * 100).toFixed(0)}%</span>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>المؤشر</th><th>القيمة</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
                                <tbody>
                                    {catEntries.map(e => (
                                        <tr key={e.id}>
                                            <td>{e.metric?.name_ar}</td>
                                            <td style={{ fontWeight: 600, color: e.value !== null ? scoreColor(Number(e.value)) : 'var(--gray-400)' }}>
                                                {e.value !== null ? `${(Number(e.value) * 100).toFixed(0)}%` : 'غير محدد'}
                                            </td>
                                            <td><span className={`badge ${e.status === 'approved' ? 'badge-success' : e.status === 'submitted' ? 'badge-primary' : 'badge-gray'}`}>{e.status === 'approved' ? 'معتمد' : e.status === 'submitted' ? 'مُقدَّم' : 'مسودة'}</span></td>
                                            <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{e.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
            {entries.length === 0 && <div className="empty-state"><div className="empty-state-icon">✎</div><h3>لا توجد بيانات</h3><p>لم يتم إدخال بيانات لهذا القسم في الفترة المحددة</p></div>}
        </div>
    );
}
