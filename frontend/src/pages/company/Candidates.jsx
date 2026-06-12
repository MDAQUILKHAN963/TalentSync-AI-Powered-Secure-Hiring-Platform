import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Download, Search, Loader2 } from 'lucide-react';
import './Candidates.css';

const STATUS_OPTIONS = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

const STATUS_LABELS = {
  pending: 'New',
  reviewed: 'Under Review',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired'
};

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('/api/company/candidates', authHeaders);
      setCandidates(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/company/applications/${id}/status`, { status }, authHeaders);
      setCandidates(candidates.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'shortlisted': return 'shortlisted';
      case 'hired': return 'shortlisted';
      case 'pending': return 'new';
      case 'reviewed': return 'under-review';
      case 'rejected': return 'rejected';
      default: return '';
    }
  };

  const filtered = candidates.filter(c =>
    `${c.name} ${c.email} ${c.role}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="candidates-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10 }}>
        <Loader2 className="animate-spin" size={24} /> Loading candidates...
      </div>
    );
  }

  return (
    <div className="candidates-page">
      <div className="candidates-header">
        <div>
          <h1>Candidate Pipeline</h1>
          <p>Manage applicants and track their status through the hiring funnel.</p>
        </div>
        <div className="header-actions">
          <div className="search-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="candidates-panel">
        {error ? (
          <p style={{ padding: 24, color: '#f87171' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 24, opacity: 0.7 }}>
            {candidates.length === 0
              ? 'No applications yet. Candidates will appear here when students apply to your jobs.'
              : 'No candidates match your search.'}
          </p>
        ) : (
          <table className="candidates-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied Role</th>
                <th>Match %</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="candidate-info">
                      <div className="candidate-avatar">{c.avatar}</div>
                      <div>
                        <div className="candidate-name">{c.name}</div>
                        <div className="candidate-email">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="role-text">{c.role}</td>
                  <td>
                    <div className="match-bar-wrap">
                      <div className="match-bar-bg">
                        <div className="match-bar-fill" style={{ width: `${c.match}%` }}></div>
                      </div>
                      <span className="match-percent">{c.match}%</span>
                    </div>
                  </td>
                  <td>
                    <select
                      className={`status-badge ${getStatusClass(c.status)}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="applied-date">{c.applied}</td>
                  <td>
                    <div className="table-actions">
                      <a className="action-btn" title="Email candidate" href={`mailto:${c.email}`}>
                        <Mail size={16} />
                      </a>
                      {c.resumeUrl && (
                        <a
                          className="action-btn"
                          title="Download Resume"
                          href={`${import.meta.env.VITE_API_URL || ''}${c.resumeUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
