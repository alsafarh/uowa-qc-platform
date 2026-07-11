import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../utils/api';

const ROLE_LABELS = { admin: 'مدير النظام', department_head: 'رئيس القسم', data_entry: 'إدخال بيانات', viewer: 'مشاهد' };
const NAV = [
    { to: '/', icon: '▣', label: 'لوحة التحكم', exact: true },
    { to: '/departments', icon: '⊞', label: 'الأقسام والكليات' },
    { to: '/data-entry', icon: '✎', label: 'إدخال البيانات', roles: ['admin','department_head','data_entry'] },
    { to: '/analytics', icon: '⊿', label: 'التحليلات والتقارير' },
    { to: '/notifications', icon: '⌚', label: 'الإشعارات', badge: true },
    { to: '/users', icon: '⊙', label: 'المستخدمون', roles: ['admin'] },
];

export default function Layout() {
    const { user, logout, can } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [unread, setUnread] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const PAGE_TITLES = { '/': 'لوحة التحكم', '/departments': 'الأقسام والكليات', '/data-entry': 'إدخال البيانات', '/analytics': 'التحليلات والتقارير', '/notifications': 'الإشعارات', '/users': 'المستخدمون' };
    const pageTitle = PAGE_TITLES[location.pathname] || 'لوحة متابعة الأداء';

    useEffect(() => {
        notificationsAPI.list().then(r => setUnread(r.data.unread_count)).catch(() => {});
        const iv = setInterval(() => notificationsAPI.list().then(r => setUnread(r.data.unread_count)).catch(() => {}), 60000);
        return () => clearInterval(iv);
    }, [location.pathname]);

    const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?';

    return (
        <div className="layout">
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">J</div>
                        <div>
                            <div className="sidebar-logo-text">نظام متابعة الأداء</div>
                            <div className="sidebar-logo-sub">الجامعة الأهلية</div>
                        </div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section-label">القائمة الرئيسية</div>
                    {NAV.filter(n => !n.roles || n.roles.some(r => can(r))).map(n => (
                        <NavLink key={n.to} to={n.to} end={n.exact} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                            <span className="nav-icon">{n.icon}</span>
                            <span style={{ flex: 1 }}>{n.label}</span>
                            {n.badge && unread > 0 && <span className="nav-badge">{unread}</span>}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={() => { logout(); navigate('/login'); }}>
                        <div className="avatar">{initials(user?.full_name_ar || user?.full_name)}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name truncate">{user?.full_name_ar || user?.full_name}</div>
                            <div className="sidebar-user-role">{ROLE_LABELS[user?.role]}</div>
                        </div>
                        <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>خروج</span>
                    </div>
                </div>
            </aside>
            <div className="main-content">
                <header className="top-header">
                    <h1 className="header-title">{pageTitle}</h1>
                    <div className="header-actions">
                        <button className="icon-btn" onClick={() => navigate('/notifications')} aria-label="notifications">
                            ⌚
                            {unread > 0 && <span className="badge-dot" />}
                        </button>
                        <div className="avatar avatar-sm">{initials(user?.full_name_ar || user?.full_name)}</div>
                    </div>
                </header>
                <main className="page-content"><Outlet /></main>
            </div>
            {sidebarOpen && <div style={{ position:'fixed',inset:0,zIndex:98,background:'rgba(0,0,0,.3)' }} onClick={() => setSidebarOpen(false)} />}
        </div>
    );
}
