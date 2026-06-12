import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Clock, Briefcase, Upload, ChevronRight, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './ApplyJob.css';

const STEPS = ['Personal Info', 'Resume & Skills', 'Cover Letter', 'Review & Submit'];

export default function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    email: user?.email || '', 
    phone: '', 
    linkedin: '', 
    coverLetter: '', 
    fileName: 'Using profile resume' 
  });

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      // We can fetch all jobs and find the one, or better if there was a single job endpoint.
      // Since there isn't one clearly defined in routes/jobs.js, we fetch all.
      const res = await axios.get('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = res.data.find(j => (j._id || j.id) === jobId);
      if (found) {
        setJob(found);
      } else {
        setError('Job not found');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Could not load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/jobs/${jobId}/apply`, {
        coverLetter: form.coverLetter,
        phone: form.phone,
        linkedinUrl: form.linkedin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading" style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} />
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="apply-page">
        <div className="error-alert">{error}</div>
        <button className="back-btn" onClick={() => navigate('/dashboard/student/jobs')}>Back to Jobs</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="apply-page">
        <div className="apply-success">
          <div className="success-icon"><Check size={32} /></div>
          <h2>Application Submitted!</h2>
          <p>Your application for <strong>{job.title}</strong> at <strong>{job.company?.companyName || 'Partner'}</strong> has been sent.</p>
          <p className="success-sub">You'll receive a confirmation email within 24 hours.</p>
          <div className="success-actions">
            <button className="back-btn" onClick={() => navigate('/dashboard/student/jobs')}>Back to Jobs</button>
            <button className="back-btn primary" onClick={() => navigate('/dashboard/student/applications')}>Track Applications</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <div className="apply-header">
        <button className="back-link" onClick={() => navigate('/dashboard/student/jobs')}>
          <ArrowLeft size={16} /> Back to Jobs
        </button>
      </div>

      <div className="apply-layout">
        <div className="job-summary-card">
          <div className="job-summary-company">{job.company?.companyName || 'Partner'}</div>
          <h2 className="job-summary-title">{job.title}</h2>
          <div className="job-summary-meta">
            <span><MapPin size={13} /> {job.location}</span>
            <span><DollarSign size={13} /> {job.salaryRange || 'Not disclosed'}</span>
            <span><Clock size={13} /> {job.jobType}</span>
            {job.company?.industry && <span><Briefcase size={13} /> {job.company.industry}</span>}
          </div>
          <div className="job-summary-tags">
            {(job.skillsRequired || []).map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          <hr className="divider-line" />
          <h3>About the Role</h3>
          <p className="job-desc">{job.description}</p>
        </div>

        <div className="apply-form-container">
          <div className="stepper">
            {STEPS.map((s, i) => (
              <div key={s} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="step-circle">{i < step ? <Check size={12} /> : i + 1}</div>
                <span>{s}</span>
                {i < STEPS.length - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>

          <div className="step-content">
            {error && <div className="error-alert" style={{ marginBottom: 16 }}>{error}</div>}
            {step === 0 && (
              <div className="form-fields">
                <h3>Personal Information</h3>
                <div className="field-row">
                  <div className="field-group">
                    <label>Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="field-input" readOnly />
                  </div>
                  <div className="field-group">
                    <label>Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className="field-input" readOnly />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label>Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className="field-input" />
                  </div>
                  <div className="field-group">
                    <label>LinkedIn URL</label>
                    <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="linkedin.com/in/johndoe" className="field-input" />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="form-fields">
                <h3>Resume & Skills</h3>
                <div className="upload-zone success" style={{ borderColor: 'var(--accent)', background: 'rgba(99, 102, 241, 0.05)' }}>
                  <Check size={28} color="var(--accent)" />
                  <p>Profile resume will be used for this application.</p>
                  <span>You can update your resume in the "My Resume" section.</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-fields">
                <h3>Cover Letter</h3>
                <textarea
                  name="coverLetter"
                  value={form.coverLetter}
                  onChange={handleChange}
                  placeholder={`Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} role at ${job.company?.companyName}...`}
                  className="field-textarea"
                  rows={12}
                />
              </div>
            )}

            {step === 3 && (
              <div className="form-fields">
                <h3>Review Your Application</h3>
                <div className="review-grid">
                  {[['Name', form.name || '—'], ['Email', form.email || '—'], ['Phone', form.phone || '—'], ['LinkedIn', form.linkedin || '—'], ['Resume', 'Profile Resume'], ['Cover Letter', form.coverLetter ? `${form.coverLetter.slice(0, 80)}…` : '—']].map(([k, v]) => (
                    <div key={k} className="review-row">
                      <span className="review-key">{k}</span>
                      <span className="review-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="step-nav">
            {step > 0 && (
              <button className="nav-btn" onClick={() => setStep(step - 1)}>Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="nav-btn primary" onClick={() => setStep(step + 1)}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button className="nav-btn primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'} <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}