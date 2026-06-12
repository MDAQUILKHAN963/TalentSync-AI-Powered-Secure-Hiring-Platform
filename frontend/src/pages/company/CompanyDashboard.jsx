import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Users, ShieldCheck, TrendingUp, ArrowRight, Plus, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../student/StudentDashboard.css';
import './CompanyDashboard.css';

const KPI_ICONS = [Briefcase, Users, ShieldCheck, TrendingUp];

const statusColors = {
  Pending: '#6366f1',
  Reviewed: '#f59e0b',
  Shortlisted: '#10b981',
  Rejected: '#ef4444',
  Hired: '#10b981'
};

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = user?.name || 'Company';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/company/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching company stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dash-loading">
        <Loader2 className="animate-spin" size={32} />
        <p>Loading your hiring pipeline...</p>
      </div>
    );
  }

  const kpis = (stats?.kpis || []).map((kpi, i) => ({ ...kpi, icon: KPI_ICONS[i] || Briefcase }));
  const recentApplicants = stats?.recentApplicants || [];
  const activeJobs = stats?.activeJobs || [];

  return (
    <div className="company-dash">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome, <span className="name-accent">{name.split(' ')[0]}</span> 👋</h1>
          <p className="dash-subtitle">Here's your hiring pipeline overview for today.</p>
        </div>
        <button className="cta-btn" onClick={() => navigate('/dashboard/company/post-job')}>
          <Plus size={16} /> Post a Job
        </button>
      </div>

      <div className="kpi-row">
        {kpis.map(({ icon: Icon, label, value, delta, type }) => (
          <div className={`kpi-tile ${type}`} key={label}>
            <div className="kpi-icon">
              <Icon size={24} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{label}</span>
              <span className="kpi-value">{value}</span>
              <span className="kpi-delta">{delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* Recent Applicants */}
        <div className="dash-panel">
          <div className="panel-header">
            <h2>Recent Applicants</h2>
            <button className="panel-link" onClick={() => navigate('/dashboard/company/candidates')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="activity-list">
            {recentApplicants.length === 0 ? (
              <p className="empty-state">No applications yet. They'll appear here when students apply.</p>
            ) : (
              recentApplicants.map((a, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-logo" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    {a.avatar}
                  </div>
                  <div className="activity-info">
                    <span className="activity-role">{a.name}</span>
                    <span className="activity-company">{a.role}</span>
                  </div>
                  <div className="activity-right">
                    <span className="activity-status" style={{ color: statusColors[a.status] || '#888', background: `${statusColors[a.status] || '#888'}18` }}>
                      {a.status}
                    </span>
                    <span className="activity-time"><Clock size={11} /> {a.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="dash-panel">
          <div className="panel-header">
            <h2>Active Postings</h2>
            <button className="panel-link" onClick={() => navigate('/dashboard/company/manage-jobs')}>
              Manage <ArrowRight size={14} />
            </button>
          </div>
          <div className="job-listing-list">
            {activeJobs.length === 0 ? (
              <p className="empty-state">No job postings yet.</p>
            ) : (
              activeJobs.map(j => (
                <div key={j.id} className="job-listing-row">
                  <div>
                    <p className="jl-title">{j.title}</p>
                    <p className="jl-meta">{j.applicants} applicant{j.applicants === 1 ? '' : 's'} · {j.posted}</p>
                  </div>
                  <span className={`jl-status ${j.status === 'Active' ? 'active' : 'paused'}`}>{j.status}</span>
                </div>
              ))
            )}
          </div>
          <button className="cta-btn secondary" onClick={() => navigate('/dashboard/company/post-job')}>
            <Plus size={14} /> Post New Job
          </button>
        </div>
      </div>
    </div>
  );
}
