import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import axios from 'axios';
import JobCard from '../../components/ui/JobCard';
import SkillGapModal from '../../components/ui/SkillGapModal';
import './AIRecommendedJobs.css';

const FILTERS = ['All', 'Remote', 'Full-time', 'Contract', 'Internship'];
const DOMAINS = ['All', 'Frontend', 'Backend', 'ML/AI', 'Data', 'Design', 'DevOps'];

export default function AIRecommendedJobs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeDomain, setActiveDomain] = useState('All');
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isGapModalOpen, setIsGapModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching AI recommendations...');
      const res = await axios.get('/api/student/recommendations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Recommendations received:', res.data);
      if (Array.isArray(res.data)) {
        setJobs(res.data);
      } else {
        throw new Error('Invalid recommendations format');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Could not fetch recommendations. Please ensure your profile is complete.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedJobIds(res.data.savedJobs || []);
    } catch (err) {
      console.error('Error fetching saved status:', err);
    }
  };

  const handleToggleSave = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const isSaved = savedJobIds.includes(jobId);
      
      if (isSaved) {
        await axios.delete(`/api/student/jobs/${jobId}/unsave`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedJobIds(prev => prev.filter(id => id !== jobId));
      } else {
        await axios.post(`/api/student/jobs/${jobId}/save`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedJobIds(prev => [...prev, jobId]);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const filtered = jobs.filter(job => {
    const title = job.title || '';
    const companyName = typeof job.company === 'string' ? job.company : (job.company?.companyName || '');
    const location = job.location || (typeof job.company !== 'string' ? job.company?.location : '') || '';
    const type = job.type || '';

    const matchSearch = title.toLowerCase().includes(search.toLowerCase()) ||
      companyName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || type === activeFilter || location.includes(activeFilter);
    return matchSearch && matchFilter;
  });

  const handleApply = (job) => {
    // External (aggregated) listings are applied to on the company's own site
    if (job.applyUrl) {
      window.open(job.applyUrl, '_blank', 'noopener');
      return;
    }
    navigate(`/dashboard/student/apply/${job.id || job._id}`);
  };

  const handleViewGap = (job) => {
    setSelectedJob(job);
    setIsGapModalOpen(true);
  };

  console.log('AIRecommendedJobs render starting...', { jobsLength: (jobs || []).length, loading, hasFiltered: !!filtered });

  if (loading) {
    return <div className="loading-state">Matching jobs with your profile...</div>;
  }

  // Final safety check for filtered
  const safeFiltered = Array.isArray(filtered) ? filtered : [];

  // Real top match score across all recommended jobs
  const topMatch = (jobs || []).length > 0
    ? Math.round(Math.max(...jobs.map(j => j?.match || 0)))
    : 0;

  return (
    <div className="ai-jobs-page">
      <div className="ai-jobs-hero">
        <div className="hero-text">
          <div className="ai-badge"><Sparkles size={13} /> Powered by AI</div>
          <h1>Your Personalized Job Matches</h1>
          <p>Curated based on your skills, resume, and career goals.</p>
        </div>
        <div className="match-ring">
          <svg viewBox="0 0 100 100" className="ring-svg">
            <circle cx="50" cy="50" r="40" className="ring-bg" />
            <circle cx="50" cy="50" r="40" className="ring-fill" strokeDasharray={`${topMatch * 2.51} 251`} />
          </svg>
          <div className="ring-label"><span>{topMatch}%</span><small>Top Match</small></div>
        </div>
      </div>

      <div className="jobs-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search roles, companies..."
            value={search || ''}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {(FILTERS || []).map(f => (
            <button
              key={f || 'filter'}
              className={`chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="icon-btn"><SlidersHorizontal size={16} /></button>
      </div>

      <div className="domain-row">
        {(DOMAINS || []).map(d => (
          <button key={d || 'domain'} className={`domain-btn ${activeDomain === d ? 'active' : ''}`} onClick={() => setActiveDomain(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="jobs-count">{safeFiltered.length} jobs found</div>
      <div className="jobs-grid">
        {safeFiltered.map((job, index) => {
          if (!job) return null;
          try {
            const jobId = job.id || job._id || `job-${index}`;
            return (
              <div key={jobId} className="job-card-wrap">
                <div className="match-score-badge" style={{
                  background: (job.match || 0) >= 80 ? 'rgba(16, 185, 129, 0.15)' : (job.match || 0) >= 60 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: (job.match || 0) >= 80 ? '#10b981' : (job.match || 0) >= 60 ? '#6366f1' : '#f59e0b',
                  borderColor: (job.match || 0) >= 80 ? 'rgba(16, 185, 129, 0.3)' : (job.match || 0) >= 60 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                }}>
                  {Math.round(job.match || 0)}% match
                </div>
                 <JobCard
                  job={{
                    ...job,
                    id: jobId,
                    company: typeof job.company === 'string' ? job.company : (job.company?.companyName || ''),
                    location: job.location || (typeof job.company !== 'string' ? job.company?.location : '') || 'Not specified',
                    salary: job.salaryRange || 'Not disclosed',
                    type: job.type || job.jobType || 'Full-time',
                    posted: job.createdAt ? `Posted ${Math.max(1, Math.floor((Date.now() - new Date(job.createdAt)) / 86400000))}d ago` : '',
                    verified: typeof job.company !== 'string' && job.company?.verifiedStatus === 'verified',
                    tags: Array.isArray(job.tags) ? job.tags : (Array.isArray(job.skillsRequired) ? job.skillsRequired : [])
                  }}
                  onApply={handleApply} 
                  isSaved={(savedJobIds || []).includes(jobId)}
                  onToggleSave={handleToggleSave}
                />
                {/* Match Score Breakdown */}
                {job.matchData && (
                  <div className="match-details">
                    <div className="match-bar-row">
                      <span className="match-label">Skills</span>
                      <div className="match-bar-bg"><div className="match-bar-fill" style={{width: `${job.matchData.skill_score}%`}} /></div>
                      <span className="match-pct">{Math.round(job.matchData.skill_score)}%</span>
                    </div>
                    <div className="match-bar-row">
                      <span className="match-label">Semantic</span>
                      <div className="match-bar-bg"><div className="match-bar-fill semantic" style={{width: `${job.matchData.semantic_score}%`}} /></div>
                      <span className="match-pct">{Math.round(job.matchData.semantic_score)}%</span>
                    </div>
                    {job.matchData.matched_skills?.length > 0 && (
                      <div className="match-skills-row">
                        {job.matchData.matched_skills.slice(0, 4).map((s, si) => (
                          <span key={si} className="mini-skill matched">✓ {s}</span>
                        ))}
                        {(job.matchData.missing_skills || []).slice(0, 2).map((s, si) => (
                          <span key={`m-${si}`} className="mini-skill missing">✗ {s}</span>
                        ))}
                      </div>
                    )}
                    {job.matchData.bias_free && (
                      <div className="bias-free-tag">🛡 Bias-Free Score</div>
                    )}
                  </div>
                )}
                <button 
                  className="view-gap-btn"
                  onClick={() => handleViewGap(job)}
                >
                  <Sparkles size={12} /> View AI Analysis
                </button>
              </div>
            );
          } catch (err) {
            console.error('Error rendering individual job card:', err, job);
            return null;
          }
        })}
        {safeFiltered.length === 0 && (
          <div className="empty-jobs">
            <p>No jobs matching "<strong>{search}</strong>"</p>
            <button onClick={() => setSearch('')}>Clear search</button>
          </div>
        )}
      </div>

      <SkillGapModal 
        isOpen={isGapModalOpen}
        onClose={() => setIsGapModalOpen(false)}
        jobId={selectedJob?.id || selectedJob?._id}
        jobTitle={selectedJob?.title}
      />
    </div>
  );
}