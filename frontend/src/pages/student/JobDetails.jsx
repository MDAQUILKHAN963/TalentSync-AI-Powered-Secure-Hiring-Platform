import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building2, MapPin, DollarSign, Clock, Calendar,
  ArrowLeft, Bookmark, BookmarkCheck, Globe,
  ShieldCheck, GraduationCap
} from 'lucide-react';
import './JobDetails.css';

function timeAgo(date) {
  if (!date) return '';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week(s) ago`;
  return `${Math.floor(days / 30)} month(s) ago`;
}

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [saved, setSaved] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchAll = async () => {
    try {
      // Real job details
      const res = await axios.get(`/api/jobs/${jobId}`);
      setJob(res.data);

      // Real match score from the matching engine (requires parsed resume)
      axios.post('/api/resumes/match-job', { job_description: res.data.description }, authHeaders)
        .then(m => setMatchScore(Math.round(m.data.match_percent)))
        .catch(() => setMatchScore(null));

      // Real similar roles: other open jobs
      axios.get('/api/jobs')
        .then(all => setSimilar(all.data.filter(j => j._id !== jobId).slice(0, 3)))
        .catch(() => setSimilar([]));

      // Real saved state
      axios.get('/api/student/jobs/saved', authHeaders)
        .then(s => setSaved(s.data.some(j => j._id === jobId)))
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || 'Job not found');
    }
  };

  const toggleSave = async () => {
    try {
      if (saved) {
        await axios.delete(`/api/student/jobs/${jobId}/unsave`, authHeaders);
        setSaved(false);
      } else {
        await axios.post(`/api/student/jobs/${jobId}/save`, {}, authHeaders);
        setSaved(true);
      }
    } catch (err) {
      console.error('Save toggle failed:', err);
    }
  };

  if (error) return <div className="p-8">{error}</div>;
  if (!job) return <div className="p-8">Loading job details...</div>;

  const company = job.company || {};

  return (
    <div className="job-details-page">
      <div className="details-header-nav">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="header-actions">
          <button
            className={`action-icon-btn ${saved ? 'active' : ''}`}
            onClick={toggleSave}
            title={saved ? 'Remove from saved' : 'Save job'}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>

      <div className="details-layout">
        <div className="details-main">
          {/* Hero Section */}
          <div className="details-hero panel-glass">
            <div className="hero-top">
              <div className="company-branding">
                <div className="detail-logo">
                  <Building2 size={32} />
                </div>
                <div className="company-text">
                  <h3>{company.companyName || 'Company'} {company.verifiedStatus === 'verified' && <ShieldCheck size={16} className="v-icon" />}</h3>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer" className="website-link">
                      <Globe size={14} /> {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
              {matchScore !== null && (
                <div className="match-badge">
                  <div className="match-value">{matchScore}%</div>
                  <div className="match-label">AI Match Score</div>
                </div>
              )}
            </div>

            <h1 className="job-title-large">{job.title}</h1>

            <div className="hero-meta-grid">
              <div className="meta-item">
                <MapPin size={16} />
                <span>{job.location || 'Not specified'}</span>
              </div>
              <div className="meta-item">
                <DollarSign size={16} />
                <span>{job.salaryRange || 'Not disclosed'}</span>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <span>{job.jobType}</span>
              </div>
              <div className="meta-item">
                <Calendar size={16} />
                <span>Posted {timeAgo(job.createdAt)}</span>
              </div>
            </div>

            <div className="hero-ctas">
              <button
                className="btn-primary-large"
                onClick={() => navigate(`/dashboard/student/apply/${jobId}`)}
              >
                Apply for this Position
              </button>
              <button className="btn-secondary-large" onClick={toggleSave}>
                {saved ? 'Saved ✓' : 'Save for Later'}
              </button>
            </div>
          </div>

          {/* Job Content */}
          <div className="content-section panel-glass">
            <h2>About this role</h2>
            <p className="description-text">{job.description}</p>

            {job.skillsRequired?.length > 0 && (
              <div className="requirements-section">
                <div className="section-header-icon">
                  <GraduationCap size={20} />
                  <h3>Required Skills</h3>
                </div>
                <ul>
                  {job.skillsRequired.map((skill, i) => <li key={i}>{skill}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        <aside className="details-sidebar">
          <div className="stats-panel panel-glass">
            <h3>Job Activity</h3>
            <div className="stat-row">
              <span className="stat-label">Applicants</span>
              <span className="stat-value">{job.applicantCount ?? 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Views</span>
              <span className="stat-value">{job.views ?? 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Posted</span>
              <span className="stat-value">{timeAgo(job.createdAt)}</span>
            </div>
          </div>

          {similar.length > 0 && (
            <div className="similar-jobs-panel panel-glass">
              <h3>Similar Roles</h3>
              <div className="mini-job-list">
                {similar.map(j => (
                  <div key={j._id} className="mini-job-item">
                    <div className="mini-job-info">
                      <h4>{j.title}</h4>
                      <span>{j.company?.companyName || 'Company'}{j.salaryRange ? ` • ${j.salaryRange}` : ''}</span>
                    </div>
                    <button className="mini-view-btn" onClick={() => navigate(`/dashboard/student/jobs/${j._id}`)}>
                      <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
