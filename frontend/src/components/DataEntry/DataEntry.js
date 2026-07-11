import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { dataAPI, departmentsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function DataEntry() {
    const { can } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selDept, setSelDept] = useState('');
    const [selPeriod, setSelPeriod] = useState('');
    const [values, setValues] = useState({});
    const [notes, setNotes] = useState({});
    const [existing, setExisting] = useState({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();

    useEffect(() => {
        departmentsAPI.list().then(r => setDepartments(r.data.departments || [])).catch(() => {});
        dataAPI.periods().then(r => { const ps = r.data.periods || []; setPeriods(ps); if (ps[0]) setSelPeriod(ps[0].id); }).catch(() => {});
        dataAPI.metrics().then(r => setCategories(r.data.categories || [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (!selDept || !selPeriod) return;
        dataAPI.entries({ department_id: selDept, period_id: selPeriod }).then(r => {
            const map = {};
            const vmap = {};
            const nmap = {};
            (r.data.entries || []).forEach(e => { map[e.metric_id] = e; vmap[e.metric_id] = e.value !== null ? String(Number(e.value) * 100) : ''; nmap[e.metric_id] = e.notes || ''; });
            setExisting(map);
            setValues(vmap);
            setNotes(nmap);
        }).catch(() => {});
    }, [selDept, selPeriod]);

    const setVal = (mid, v) => setValues(prev => ({ ...prev, [mid]: v }));
    const setNote = (mid, v) => setNotes(prev => ({ ...prev, [mid]: v }));

    const saveAll = async () => {
        if (!selDept || !selPeriod) { toast.error('اختر القسم والفترة الزمنية'); return; }
        setSaving(true);
        try {
            const entries = [];
            categories.forEach(cat => cat.metrics?.forEach(m => {
                const raw = values[m.id];
                if (raw === '' || raw === undefined) return;
                const val = parseFloat(raw) / 100;
                entries.push({ metric_id: m.id, value: Math.min(1, Math.max(0, val)), notes: notes[m.id] || '' });
            }));
            if (entries.length === 0) { toast.error('لم تدخل أي قيم'); return; }
            await dataAPI.bulkSave({ department_id: selDept, period_id: selPeriod, entries });
            toast.success(`تم حفظ ${entries.length} مؤشر بنجاح`);
            const r = await dataAPI.entries({ department_id: selDept, period_id: selPeriod });
            const map = {};
            (r.data.entries || []).forEach(e => { map[e.metric_id] = e; });
            setExisting(map);
        } catch { toast.error('خطأ في الحفظ'); }
        finally { setSaving(false); }
    };

    const uploadFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selDept || !selPeriod) { toast.error('اختر القسم والفترة أولاً'); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('department_id', selDept);
            fd.append('period_id', selPeriod);
            const r = await dataAPI.upload(fd);
            toast.success(`تم استيراد ${r.data.imported} من ${r.data.total} سجل`);
        } catch { toast.error('خطأ في رفع الملف'); }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
    };

    const totalFilled = Object.values(values).filter(v => v !== '' && v !== undefined).length;
    const totalMetrics = categories.reduce((s, c) => s + (c.metrics?.length || 0), 0);

    return (
        <div>
            {/* Controls */}
            <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">القسم / الكلية *</label>
                        <select className="form-select" value={selDept} onChange={e => setSelDept(e.target.value)}>
                            <option value="">اختر قسماً...</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">الفترة الزمنية *</label>
                        <select className="form-select" value={selPeriod} onChange={e => setSelPeriod(e.target.value)}>
                            <option value="">اختر فترة...</option>
                            {periods.map(p => <option key={p.id} value={p.id}>{p.label_ar || `${p.month}/${p.year}`}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">استيراد Excel/CSV</label>
                        <input type="file" accept=".xlsx,.csv,.xls" ref={fileRef} onChange={uploadFile} style={{ display: 'none' }} />
                        <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'جاري الرفع...' : 'رفع ملف'}</button>
                    </div>
                    <button className="btn btn-primary" onClick={saveAll} disabled={saving || !selDept || !selPeriod} style={{ alignSelf: 'flex-end' }}>
                        {saving ? 'جاري الحفظ...' : `حفظ البيانات (${totalFilled}/${totalMetrics})`}
                    </button>
                </div>
            </div>

            {selDept && selPeriod ? (
                categories.map(cat => (
                    <div key={cat.id} className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header">
                            <span className="card-title">{cat.name_ar}</span>
                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{cat.metrics?.length || 0} مؤشر</span>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gap: 12 }}>
                                {cat.metrics?.map(m => {
                                    const ex = existing[m.id];
                                    const isApproved = ex?.status === 'approved';
                                    return (
                                        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 200px 80px', gap: 12, alignItems: 'center', padding: '10px 12px', background: ex ? 'var(--gray-50)' : '#fff', borderRadius: 8, border: '1px solid var(--gray-100)' }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name_ar}</div>
                                                {m.name_en && <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{m.name_en}</div>}
                                            </div>
                                            <div>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="number" min="0" max="100" step="1"
                                                        className="form-input"
                                                        style={{ paddingLeft: 28, textAlign: 'center' }}
                                                        value={values[m.id] || ''}
                                                        onChange={e => setVal(m.id, e.target.value)}
                                                        disabled={isApproved}
                                                        placeholder="0-100"
                                                    />
                                                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: 13 }}>%</span>
                                                </div>
                                            </div>
                                            <input type="text" className="form-input" placeholder="ملاحظات..." value={notes[m.id] || ''} onChange={e => setNote(m.id, e.target.value)} disabled={isApproved} style={{ fontSize: 13 }} />
                                            <div>
                                                {ex ? (
                                                    <span className={`badge ${ex.status === 'approved' ? 'badge-success' : ex.status === 'submitted' ? 'badge-primary' : 'badge-gray'}`}>
                                                        {ex.status === 'approved' ? 'معتمد' : ex.status === 'submitted' ? 'مُقدَّم' : 'مسودة'}
                                                    </span>
                                                ) : <span className="badge badge-gray">جديد</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="empty-state" style={{ marginTop: 40 }}>
                    <div className="empty-state-icon">✎</div>
                    <h3>اختر القسم والفترة الزمنية</h3>
                    <p>لبدء إدخال البيانات، يرجى اختيار القسم والفترة من الأعلى</p>
                </div>
            )}
        </div>
    );
}
