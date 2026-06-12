import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pause, Play, Trash2, Users, Plus } from 'lucide-react';
import './ManageJobs.css';

export default function ManageJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      // Company-scoped endpoint: own jobs only, with real applicant counts
      const res = await axios.get('/api/company/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data.map(j => ({
        ...j,
        active: j.status === 'open',
        applicants: j.applicantCount,
        tags: (j.skillsRequired || []).slice(0, 3)
      })));
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id) => {
    try {
      const job = jobs.find(j => j._id === id);
      const token = localStorage.getItem('token');
      await axios.put(`/api/jobs/${id}`,
        { status: job.active ? 'closed' : 'open' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs(jobs.map(j => j._id === id ? { ...j, active: !j.active } : j));
    } catch (err) {
      console.error('Error toggling job:', err);
    }
  };

  const remove = async (id) => {
    try {
      if (!window.confirm('Delete this job posting forever?')) return;
      const token = localStorage.getItem('token');
      await axios.delete(`/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  if (loading) return <div className="loading-state">Syncing your dashboard...</div>;

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Manage Jobs</h1>
          <p>{jobs.filter(j => j.active).length} active · {jobs.filter(j => !j.active).length} paused</p>
        </div>
        <button className="mj-post-btn" onClick={() => navigate('/dashboard/company/post-job')}>
          <Plus size={15} /> Post New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="manage-empty">
          <p>No job postings yet.</p>
          <button onClick={() => navigate('/dashboard/company/post-job')}>Create Your First Job</button>
        </div>
      ) : (
        <div className="jobs-table">
          <div className="table-head">
            <span>Role</span><span>Applicants</span><span>Posted</span><span>Deadline</span><span>Status</span><span>Actions</span>
          </div>
          {jobs.map(job => (
            <div key={job.id || job._id} className="table-row">
              <div className="tr-title">
                <span>{job.title}</span>
                <div className="tr-tags">
                  {job.tags?.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
              <div className="tr-applicants">
                <Users size={14} /> {job.applicants || 0}
              </div>
              <span className="tr-meta">{job.posted || 'recently'}</span>
              <span className="tr-meta">{job.deadline || 'ongoing'}</span>
              <span className={`tr-status ${job.active ? 'active' : 'paused'}`}>
                {job.active ? 'Active' : 'Paused'}
              </span>
              <div className="tr-actions">
                <button className="action-btn" onClick={() => toggle(job.id || job._id)} title={job.active ? 'Pause' : 'Activate'}>
                  {job.active ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button className="action-btn danger" onClick={() => remove(job.id || job._id)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}