import React from 'react';

export default function Settings({ data, onLogout }) {
  const districtName = localStorage.getItem('lumina_custom_district_name') || 'Lincoln Unified School District';
  const userName = data?.student_name || 'Student';

  return (
    <div className="settings-container animate-slide-up" style={{ padding: '1.5rem', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {userName.charAt(0)}
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Settings</h1>
        </div>
        <div style={{ color: 'var(--primary-color)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary-color)" stroke="var(--primary-color)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>ACADEMIC AFFILIATION</div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{districtName}</span>
          </div>
        </section>

        <section>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>ACCOUNT</div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--primary-color)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>Profile</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Personal Details & Security</div>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--warning-color)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.87-10.9L2.5 8"></path></svg>
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>ClassLink Sync</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last synced 2 hours ago</div>
                </div>
              </div>
              <div style={{ width: '44px', height: '26px', background: 'var(--success-color)', borderRadius: '13px', position: 'relative', cursor: 'pointer' }}>
                <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>APPEARANCE</div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(128, 128, 128, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 0 20z"></path></svg>
              </div>
              <div style={{ fontWeight: '600' }}>Theme</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <span>System</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>NOTIFICATIONS</div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(128, 128, 128, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </div>
                <div style={{ fontWeight: '600' }}>Push Notifications</div>
              </div>
              <div style={{ width: '44px', height: '26px', background: 'var(--success-color)', borderRadius: '13px', position: 'relative', cursor: 'pointer' }}>
                <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
              </div>
            </div>

            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(128, 128, 128, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div style={{ fontWeight: '600' }}>Weekly Email Summaries</div>
              </div>
              <div style={{ width: '44px', height: '26px', background: 'rgba(128, 128, 128, 0.2)', borderRadius: '13px', position: 'relative', cursor: 'pointer' }}>
                <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
              </div>
            </div>
          </div>
        </section>

        <button onClick={onLogout} className="btn-secondary" style={{ marginTop: '0.5rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)', padding: '1rem', fontWeight: 'bold' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
