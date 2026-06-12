import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Save, Globe, Building2, MapPin,
  Lock, Bell, Loader2, ShieldCheck
} from 'lucide-react';
import './CompanyProfile.css';

const NOTIF_PREFS_KEY = 'talentsync_notif_prefs';

export default function CompanyProfile() {
  const [form, setForm] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [verifiedStatus, setVerifiedStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Password change state
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);

  // Notification preferences (persisted locally)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY)) || {};
    } catch { return {}; }
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'profile';

  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get('/api/company/profile', authHeaders)
      .then(res => {
        const c = res.data;
        setForm({
          companyName: c.companyName || '',
          industry: c.industry || '',
          website: c.website || '',
          location: c.location || '',
          description: c.description || ''
        });
        setUserEmail(c.user?.email || '');
        setVerifiedStatus(c.verifiedStatus);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load profile'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/company/profile', form, authHeaders);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwMsg(null);
    if (!pw.current || !pw.next) return setPwMsg({ ok: false, text: 'Fill in all password fields.' });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'New passwords do not match.' });
    if (pw.next.length < 6) return setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' });

    try {
      await axios.put('/api/auth/password', { currentPassword: pw.current, newPassword: pw.next }, authHeaders);
      setPwMsg({ ok: true, text: 'Password updated successfully.' });
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.message || 'Password change failed.' });
    }
  };

  const toggleNotif = (label) => {
    const next = { ...notifPrefs, [label]: notifPrefs[label] === false ? true : false };
    setNotifPrefs(next);
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
  };

  if (error && !form) return <div className="cp-page"><p style={{ color: '#f87171' }}>{error}</p></div>;
  if (!form) {
    return (
      <div className="cp-page" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Loader2 className="animate-spin" size={20} /> Loading profile...
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="cp-page">
        <div className="cp-header">
          <h1>Account Settings</h1>
        </div>

        <div className="cp-grid">
          <div className="cp-panel">
            <h3 className="cp-section"><Lock size={16} style={{marginRight: 8}}/> Password & Security</h3>
            <div className="cp-field"><label>Current Password</label>
              <input type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} placeholder="••••••••" className="cp-input" />
            </div>
            <div className="cp-row">
              <div className="cp-field"><label>New Password</label>
                <input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} placeholder="••••••••" className="cp-input" />
              </div>
              <div className="cp-field"><label>Confirm New Password</label>
                <input type="password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} placeholder="••••••••" className="cp-input" />
              </div>
            </div>
            {pwMsg && (
              <p style={{ fontSize: 13, marginTop: 6, color: pwMsg.ok ? '#10b981' : '#f87171' }}>{pwMsg.text}</p>
            )}
            <button className="logo-edit-btn" style={{marginTop: 8, width: 'fit-content'}} onClick={handlePasswordChange}>
              Change Password
            </button>
          </div>

          <div className="cp-panel">
            <h3 className="cp-section"><Bell size={16} style={{marginRight: 8}}/> Notification Preferences</h3>
            <div className="settings-toggle-list">
              {[
                { label: 'New Applicants', desc: 'Get notified when someone applies for a job.' },
                { label: 'Application Reviews', desc: 'Alerts for when your team reviews an applicant.' },
                { label: 'Security Alerts', desc: 'Critical alerts about your account or verification status.' }
              ].map(item => (
                <div key={item.label} className="settings-toggle-row">
                  <div>
                    <div style={{fontWeight: '600', fontSize: '14px'}}>{item.label}</div>
                    <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.label] !== false}
                    onChange={() => toggleNotif(item.label)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <div className="cp-header">
        <h1>Company Profile</h1>
        <button className="cp-save-btn" onClick={handleSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="cp-grid">
        {/* Logo + Brand */}
        <div className="cp-panel brand-panel">
          <div className="brand-logo-wrap">
            <div className="brand-logo"><Building2 size={36} /></div>
          </div>
          <h2 className="brand-name">{form.companyName}</h2>
          {verifiedStatus === 'verified' && (
            <p className="brand-tagline" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: '#10b981' }}>
              <ShieldCheck size={14} /> Government Verified
            </p>
          )}
          <div className="brand-meta">
            {form.website && (
              <span><Globe size={13} /> <a href={form.website} target="_blank" rel="noreferrer">{form.website.replace(/^https?:\/\//, '')}</a></span>
            )}
            {form.location && <span><MapPin size={13} /> {form.location}</span>}
          </div>
        </div>

        {/* Basic Info */}
        <div className="cp-panel">
          <h3 className="cp-section">Company Information</h3>
          <div className="cp-row">
            <div className="cp-field"><label>Company Name</label><input name="companyName" value={form.companyName} onChange={handleChange} className="cp-input" /></div>
            <div className="cp-field"><label>Industry</label><input name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Technology" className="cp-input" /></div>
          </div>
          <div className="cp-field"><label>About the Company</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="cp-textarea" rows={4} placeholder="Tell candidates about your company..." />
          </div>
        </div>

        {/* Contact & Location */}
        <div className="cp-panel">
          <h3 className="cp-section">Contact & Location</h3>
          <div className="cp-row">
            <div className="cp-field"><label>Website</label><input name="website" value={form.website} onChange={handleChange} placeholder="https://..." className="cp-input" /></div>
            <div className="cp-field"><label>Account Email</label><input value={userEmail} disabled className="cp-input" style={{ opacity: 0.6 }} /></div>
          </div>
          <div className="cp-field"><label>Headquarters / Location</label><input name="location" value={form.location} onChange={handleChange} placeholder="City, Country" className="cp-input" /></div>
        </div>
      </div>
    </div>
  );
}
