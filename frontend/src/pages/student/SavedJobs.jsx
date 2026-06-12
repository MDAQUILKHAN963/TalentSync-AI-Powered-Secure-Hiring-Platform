import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, DollarSign, Clock, Trash2, ArrowRight, Building2, Sparkles } from 'lucide-react';
import axios from 'axios';
import './SavedJobs.css';

export default function SavedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/student/jobs/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/student/jobs/${id}/unsave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobs.filter(j => (j.id || j._id) !== id));
    } catch (err) {
      console.error('Error removing job:', err);
    }
  };

  return (
    <div className="saved-page">
      <div className="saved-header">
        <div className="saved-header-left">
          <div className="saved-badge"><Bookmark size={13} /> My Bookmarks</div>
          <h1>Saved Job Opportunities</h1>
          <p>You have {jobs.length} curated roles in your bucket list.</p>
        </div>
        <button className="browse-btn" onClick={() => navigate('/dashboard/student/jobs')}>
          <Sparkles size={14} /> Find More Matches
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Syncing your bucket list...</div>
      ) : jobs.length === 0 ? (
        <div className="saved-empty">
          <div className="empty-icon-box">
             <Bookmark size={48} className="empty-icon" />
          </div>
          <h2>Your bucket list is empty</h2>
          <p>Explore AI-matched jobs that align with your career track and save them here.</p>
          <button className="explore-btn" onClick={() => navigate('/dashboard/student/jobs')}>
            Start Exploring
          </button>
        </div>
      ) : (
        <div className="saved-grid">
          {jobs.map(job => (
            <div key={job.id || job._id} className="saved-card">
              <div className="saved-card-main">
                <div className="saved-logo-box" style={{ background: `${job.color || '#6366f1'}15`, color: job.color || '#6366f1' }}>
                  <Building2 size={24} />
                </div>
                <div className="saved-content">
                  <div className="saved-title-row">
                    <h3>{job.title}</h3>
                    <button className="remove-icon-btn" onClick={() => remove(job.id || job._id)} title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="saved-company-name">{job.company?.companyName || job.company}</span>
                  
                  <div className="saved-tags-row">
                    {job.tags?.slice(0, 2).map(t => <span key={t} className="saved-mini-tag">{t}</span>)}
                  </div>

                  <div className="saved-meta-grid">
                    <div className="meta-item"><MapPin size={12} /> {job.location || job.company?.location || 'Remote'}</div>
                    <div className="meta-item"><DollarSign size={12} /> {job.salary || 'Competitive'}</div>
                    <div className="meta-item"><Clock size={12} /> {job.type || 'Full-time'}</div>
                  </div>
                </div>
              </div>
              <div className="saved-card-footer">
                <span className="saved-time">Saved {job.savedAt || 'recently'}</span>
                <button 
                  className="apply-saved-btn" 
                  onClick={() => navigate(`/dashboard/student/apply/${job.id || job._id}`)}
                >
                  Apply Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}