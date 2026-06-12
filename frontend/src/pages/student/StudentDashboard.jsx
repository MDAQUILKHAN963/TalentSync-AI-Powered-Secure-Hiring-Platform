import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Send, Eye, TrendingUp, ArrowRight, Sparkles, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './StudentDashboard.css';

const statusColor = {
  Applied: '#f59e0b', 
  Viewed: '#6366f1', 
  Saved: '#10b981', 
  Rejected: '#ef4444', 
  Shortlisted: '#10b981' 
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const name = user?.name || 'there';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/student/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <Loader2 className="animate-spin" size={32} />
        <p>Analyzing your career status...</p>
      </div>
    );
  }

  // Map API KPI data to include icons and types (icons can't be serialized from the API)
  const kpiDefaults = [
    { icon: Briefcase, label: 'Matched Jobs', value: '0', delta: 'No skills added', type: 'blue' },
    { icon: Send, label: 'Applications Sent', value: '0', delta: 'Start applying!', type: 'orange' },
    { icon: Eye, label: 'Profile Views', value: '0', delta: '+0 today', type: 'green' },
    { icon: TrendingUp, label: 'Match Score', value: '0%', delta: 'Upload resume', type: 'purple' },
  ];

  const kpis = kpiDefaults.map((defaultKpi, index) => {
    const apiKpi = stats?.kpis?.[index];
    if (apiKpi) {
      return {
        ...defaultKpi,
        value: String(apiKpi.value ?? defaultKpi.value),
        delta: apiKpi.delta || defaultKpi.delta,
      };
    }
    return defaultKpi;
  });

  return (
    <div className="student-dash">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, <span className="name-accent">{name.split(' ')[0]}</span> 👋</h1>
          <p className="dash-subtitle">Here's your career snapshot for today.</p>
        </div>
        <button className="cta-btn" onClick={() => navigate('/dashboard/student/jobs')}>
          <Sparkles size={16} /> Explore AI Matches
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
        <div className="dash-panel">
          <div className="panel-header">
            <h2>Recent Activity</h2>
            <button className="panel-link" onClick={() => navigate('/dashboard/student/jobs')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="activity-list">
            {(stats?.recentActivity || []).length > 0 ? (
              stats.recentActivity.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-logo" style={{ background: `${item.color}22`, color: item.color }}>
                    {item.company[0]}
                  </div>
                  <div className="activity-info">
                    <span className="activity-role">{item.role}</span>
                    <span className="activity-company">{item.company}</span>
                  </div>
                  <div className="activity-right">
                    <span className="activity-status" style={{ color: statusColor[item.status] || '#888', background: `${statusColor[item.status] || '#888'}18` }}>
                      {item.status}
                    </span>
                    <span className="activity-time"><Clock size={11} /> {item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No recent activity yet. Save jobs or apply to see updates!</p>
            )}
          </div>
        </div>

        <div className="dash-panel">
          <div className="panel-header">
            <h2>Profile Strength</h2>
            <span className="strength-score">{stats?.profileStrength?.score || 20}%</span>
          </div>
          <div className="strength-bar-bg">
            <div className="strength-bar-fill" style={{ width: `${stats?.profileStrength?.score || 20}%` }} />
          </div>
          <div className="profile-tips">
            {(stats?.profileStrength?.tips || []).map(({ done, label }) => (
              <div key={label} className={`tip-item ${done ? 'done' : ''}`}>
                <span className="tip-dot">{done ? '✓' : '○'}</span>
                {label}
              </div>
            ))}
          </div>
          <button className="cta-btn secondary" style={{ marginTop: 16 }} onClick={() => navigate('/dashboard/student/profile')}>
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}