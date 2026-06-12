import { useState } from 'react';
import axios from 'axios';
import { Check, ChevronRight, Eye, ShieldAlert, Loader2 } from 'lucide-react';
import './PostJob.css';

const STEPS = ['Job Details', 'Requirements', 'Salary & Location', 'Preview'];

const INITIAL = {
  title: '', type: 'Full-time', department: '', description: '',
  skills: '', education: '', experience: '0-1 years',
  salary_min: '', salary_max: '', currency: 'USD',
  location: '', remote: 'on-site', deadline: '',
};

// Backend Job model accepts these types only
const TYPE_MAP = { 'Full-time': 'Full-time', 'Part-time': 'Part-time', 'Contract': 'Contract', 'Internship': 'Internship', 'Freelance': 'Contract' };

export default function PostJob() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePublish = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError({ message: 'Job title and description are required.' });
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const salaryRange = form.salary_min && form.salary_max
        ? `${form.salary_min}–${form.salary_max} ${form.currency}`
        : '';

      await axios.post('/api/jobs', {
        title: form.title,
        description: form.description,
        skillsRequired: form.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
        location: form.remote === 'remote' ? 'Remote' : form.location,
        salaryRange,
        jobType: TYPE_MAP[form.type] || 'Full-time'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPublished(true);
    } catch (err) {
      setError({
        message: err.response?.data?.message || 'Failed to post job. Please try again.',
        reasons: err.response?.data?.reasons || []
      });
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <div className="post-job-page">
        <div className="success-box">
          <div className="success-icon"><Check size={32} /></div>
          <h2>Job Posted Successfully!</h2>
          <p>Your listing for <strong>{form.title || 'the role'}</strong> is now live and visible to candidates.</p>
          <button className="pj-btn primary" onClick={() => { setPublished(false); setForm(INITIAL); setStep(0); }}>
            Post Another Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-job-page">
      <div className="pj-header">
        <h1>Post a Job</h1>
        <p>Fill in the details below to attract the best candidates.</p>
      </div>

      {/* Stepper */}
      <div className="pj-stepper">
        {STEPS.map((s, i) => (
          <div key={s} className={`pj-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)}>
            <div className="pj-step-circle">{i < step ? <Check size={12} /> : i + 1}</div>
            <span>{s}</span>
            {i < STEPS.length - 1 && <div className="pj-step-line" />}
          </div>
        ))}
      </div>

      <div className="pj-card">
        {step === 0 && (
          <div className="pj-fields">
            <h3>Job Details</h3>
            <div className="pj-row">
              <div className="pj-field"><label>Job Title *</label><input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior Frontend Engineer" className="pj-input" /></div>
              <div className="pj-field"><label>Department</label><input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Engineering" className="pj-input" /></div>
            </div>
            <div className="pj-field"><label>Employment Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="pj-input">
                {['Full-time','Part-time','Contract','Internship','Freelance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="pj-field"><label>Job Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="pj-textarea" rows={6} placeholder="Describe the role, responsibilities, and what success looks like..." />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="pj-fields">
            <h3>Requirements</h3>
            <div className="pj-field"><label>Required Skills (comma-separated)</label><input name="skills" value={form.skills} onChange={handleChange} placeholder="React, TypeScript, Node.js" className="pj-input" /></div>
            <div className="pj-row">
              <div className="pj-field"><label>Education Level</label>
                <select name="education" value={form.education} onChange={handleChange} className="pj-input">
                  {['Any','High School','Associate\'s','Bachelor\'s','Master\'s','PhD'].map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="pj-field"><label>Experience Level</label>
                <select name="experience" value={form.experience} onChange={handleChange} className="pj-input">
                  {['0-1 years','1-3 years','3-5 years','5-10 years','10+ years'].map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="pj-fields">
            <h3>Salary & Location</h3>
            <div className="pj-row">
              <div className="pj-field"><label>Min Salary</label><input name="salary_min" value={form.salary_min} onChange={handleChange} placeholder="80000" className="pj-input" type="number" /></div>
              <div className="pj-field"><label>Max Salary</label><input name="salary_max" value={form.salary_max} onChange={handleChange} placeholder="120000" className="pj-input" type="number" /></div>
              <div className="pj-field"><label>Currency</label>
                <select name="currency" value={form.currency} onChange={handleChange} className="pj-input">
                  {['USD','EUR','GBP','INR','CAD'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="pj-row">
              <div className="pj-field"><label>Location</label><input name="location" value={form.location} onChange={handleChange} placeholder="New York, NY" className="pj-input" /></div>
              <div className="pj-field"><label>Work Mode</label>
                <select name="remote" value={form.remote} onChange={handleChange} className="pj-input">
                  {['on-site','remote','hybrid'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="pj-field"><label>Application Deadline</label><input name="deadline" value={form.deadline} onChange={handleChange} type="date" className="pj-input" /></div>
          </div>
        )}

        {step === 3 && (
          <div className="pj-fields">
            <h3><Eye size={16} /> Preview</h3>
            <div className="preview-card">
              <h2 className="preview-title">{form.title || 'Job Title'}</h2>
              <div className="preview-meta">
                <span>📍 {form.location || 'Location'}</span>
                <span>💼 {form.type}</span>
                <span>🏠 {form.remote}</span>
                {form.salary_min && <span>💰 {form.salary_min}–{form.salary_max} {form.currency}</span>}
              </div>
              {form.skills && <div className="preview-skills">{form.skills.split(',').map(s => <span key={s} className="tag">{s.trim()}</span>)}</div>}
              <p className="preview-desc">{form.description || 'Job description will appear here.'}</p>
            </div>
          </div>
        )}

        {error && (
          <div style={{ margin: '16px 0', padding: '14px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <ShieldAlert size={18} /> {error.message}
            </div>
            {error.reasons?.length > 0 && (
              <ul style={{ margin: '8px 0 0 26px', fontSize: 13, lineHeight: 1.7 }}>
                {error.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="pj-nav">
          {step > 0 && <button className="pj-btn" onClick={() => setStep(step - 1)}>Back</button>}
          {step < STEPS.length - 1
            ? <button className="pj-btn primary" onClick={() => setStep(step + 1)}>Next <ChevronRight size={16} /></button>
            : <button className="pj-btn primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : <>Publish Job <Check size={16} /></>}
              </button>
          }
        </div>
      </div>
    </div>
  );
}