import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Clock, AlertCircle, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import './VerificationStatus.css';

const STATUS_CONFIG = {
  verified: {
    icon: ShieldCheck,
    label: 'Government Verified',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    msg: 'Your company has been successfully verified. You can now post unlimited jobs and access all platform features.'
  },
  pending: {
    icon: Clock,
    label: 'Under Review',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    msg: 'Your verification documents are being reviewed. You will be able to post jobs once approved.'
  },
  rejected: {
    icon: AlertCircle,
    label: 'Verification Rejected',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    msg: 'Your verification was rejected — the registration ID or GST/CIN details could not be validated. Please resubmit with valid government registration details.'
  },
};

export default function VerificationStatus({ forcedPending = false }) {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/company/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCompany(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load verification status'));
  }, []);

  if (error) return <div className="vs-page"><p style={{ color: '#f87171' }}>{error}</p></div>;
  if (!company) {
    return (
      <div className="vs-page" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Loader2 className="animate-spin" size={20} /> Checking verification status...
      </div>
    );
  }

  const status = company.verifiedStatus || 'pending';
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  const submittedDate = new Date(company.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const decidedDate = new Date(company.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const decided = status !== 'pending';

  const timeline = [
    { label: 'Application Submitted', date: submittedDate, done: true },
    { label: 'Registration Details Received', date: submittedDate, done: true },
    { label: 'Government Registry Check', date: decided ? decidedDate : 'In progress', done: decided },
    {
      label: status === 'rejected' ? 'Verification Rejected' : 'Final Approval',
      date: decided ? decidedDate : 'Pending',
      done: decided
    },
  ];

  return (
    <div className="vs-page">
      <div className="vs-header">
        {forcedPending && (
          <div className="onboarding-success">
            <CheckCircle2 size={24} />
            <span>Registration Complete! Your application is now in the queue.</span>
          </div>
        )}
        <h1>Verification Status</h1>
        <p>Government verification allows you to post jobs and builds trust with candidates.</p>
      </div>

      {/* Status Card */}
      <div className="status-card" style={{ background: cfg.bg, borderColor: cfg.border }}>
        <div className="status-icon" style={{ color: cfg.color, background: `${cfg.color}18` }}>
          <Icon size={32} />
        </div>
        <div className="status-text">
          <h2 style={{ color: cfg.color }}>{cfg.label}</h2>
          <p>{cfg.msg}</p>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
            Reg ID: {company.govRegId} · GST/CIN: {company.gstCin}
          </p>
        </div>
      </div>

      <div className="vs-layout-grid">
        {/* Timeline */}
        <div className="vs-panel">
          <h3>Verification Timeline</h3>
          <div className="timeline">
            {timeline.map((item, i) => (
              <div key={item.label} className={`timeline-item ${item.done ? 'done' : ''}`}>
                <div className="tl-dot" />
                {i < timeline.length - 1 && <div className="tl-line" />}
                <div className="tl-content">
                  <span className="tl-label">{item.label}</span>
                  <span className="tl-date">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="vs-panel">
          <h3>Why get verified?</h3>
          <div className="benefits-list-mini">
            {[
              { emoji: '✅', title: 'Post Job Listings' },
              { emoji: '🛡️', title: 'Verified Trust Badge' },
              { emoji: '👥', title: 'Access Candidate Pipeline' },
              { emoji: '🤖', title: 'AI-Matched Applicants' }
            ].map((b) => (
              <div key={b.title} className="benefit-mini-item">
                <span className="b-emoji">{b.emoji}</span>
                <span>{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {status === 'rejected' && (
        <button className="start-verify-btn" onClick={() => navigate('/dashboard/company/verify-form')}>
          Resubmit Documents <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
