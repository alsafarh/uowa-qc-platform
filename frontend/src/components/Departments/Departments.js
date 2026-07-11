import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { departmentsAPI, usersAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Departments() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editDept, setEditDept] = useState(null);
    const [form, setForm] = useState({ name_ar: '', name_en: '', code: '', college_id: '', head_id: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        departmentsAPI.list().then(r => setDepartments(r.data.departments || [])).catch(() => {});
        departmentsAPI.colleges().then(r => setColleges(r.data.colleges || [])).catch(() => {});
        if (can('admin')) usersAPI.list().then(r => setUsers(r.data.users || [])).catch(() => {});
    }, []);

    const filtered = departments.filter(d =>
        d.name_ar?.includes(search) || d.name_en?.toLowerCase().includes(search.toLowerCase()) || d.code?.includes(search)
    );

    const openAdd = () => { setEditDept(null); setForm({ name_ar: '', name_en: '', code: '', college_id: '', head_id: '' }); setShowModal(true); };
    const openEdit = (d, e) => { e.stopPropagation(); setEditDept(d); setForm({ name_ar: d.name_ar, name_en: d.name_en, code: d.code, college_id: d.college_id || '', head_id: d.head_id || '' }); setShowModal(true); };

    const save = async () => {
        if (!form.name_ar || !form.code) { toast.error('الاسم بالعربية والرمز مطلوبان'); return; }
        setSaving(true);
        try {
            if (editDept) { await departmentsAPI.update(editDept.id, form); toast.success('تم التحديث'); }
            else { await departmentsAPI.create(form); toast.success('تمت الإضافة'); }
            const r = await departmentsAPI.list();
            setDepartments(r.data.departments || []);
            setShowModal(false);
        } catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
        finally { setSaving(false); }
    };

    const deleteDept = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('هل تريد حذف هذا القسم؟')) return;
        try { await departmentsAPI.delete(id); setDepartments(ds => ds.filter(d => d.id !== id)); toast.success('تم الحذف'); }
        catch { toast.error('خطأ في الحذف'); }
    };

    const byCollege = {};
    filtered.forEach(d => {
        const key = d.college?.name_ar || 'غير محدد';
        if (!byCollege[key]) byCollege[key] = [];
        byCollege[key].push(d);
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
                <input className="form-input search-input" placeholder="بحث عن قسم أو كلية..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
                {can('admin') && <button className="btn btn-primary" onClick={openAdd}>+ إضافة قسم</button>}
            </div>

            {Object.entries(byCollege).map(([college, depts]) => (
                <div key={college} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-800)' }}>{college}</h2>
                        <span style={{ fontSize: 12, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 10 }}>{depts.length} قسم</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {depts.map(d => (
                            <div key={d.id} className="card" onClick={() => navigate(`/departments/${d.id}`)} style={{ cursor: 'pointer', padding: '16px 18px', transition: 'box-shadow .15s' }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.10)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-900)' }}>{d.name_ar}</div>
                                    {can('admin') && (
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button className="btn btn-ghost btn-sm" onClick={e => openEdit(d, e)} style={{ padding: '3px 8px' }}>تعديل</button>
                                            <button className="btn btn-ghost btn-sm" onClick={e => deleteDept(d.id, e)} style={{ padding: '3px 8px', color: 'var(--danger)' }}>حذف</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{d.name_en}</div>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>{d.code}</span>
                                    {d.head && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>رئيس: {d.head.full_name_ar || d.head.full_name}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon">⊞</div><h3>لا توجد أقسام</h3><p>لم يتم إيجاد أقسام تطابق بحثك</p></div>}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">{editDept ? 'تعديل القسم' : 'إضافة قسم جديد'}</span>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">الاسم بالعربية *</label>
                                    <input className="form-input" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الاسم بالإنجليزية</label>
                                    <input className="form-input" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الرمز *</label>
                                    <input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الكلية</label>
                                    <select className="form-select" value={form.college_id} onChange={e => setForm(f => ({ ...f, college_id: e.target.value }))}>
                                        <option value="">اختر كلية...</option>
                                        {colleges.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رئيس القسم</label>
                                    <select className="form-select" value={form.head_id} onChange={e => setForm(f => ({ ...f, head_id: e.target.value }))}>
                                        <option value="">اختر رئيساً...</option>
                                        {users.filter(u => ['admin','department_head'].includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.full_name_ar || u.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
