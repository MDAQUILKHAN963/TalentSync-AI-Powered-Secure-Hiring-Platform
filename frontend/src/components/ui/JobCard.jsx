import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, ArrowRight, Building2 } from 'lucide-react';
import './JobCard.css';

export default function JobCard({ job, onApply, onToggleSave, isSaved }) {
  const navigate = useNavigate();

  const {
    id,
    title = '',
    company = '',
    location = 'Not specified',
    salary = 'Not disclosed',
    type = 'Full-time',
    tags = [],
    posted = '',
    logo,
    verified = false,
  } = job || {};

  const goToDetails = () => {
    navigate(`/dashboard/student/jobs/${id}`);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    onToggleSave?.(id);
  };

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="company-logo">
          {logo ? (
            <img src={logo} alt={company} />
          ) : (
            <Building2 size={20} />
          )}
        </div>
        <div className="company-info" onClick={goToDetails} style={{ cursor: 'pointer' }}>
          <span className="company-name">{company}</span>
          {verified && <span className="verified-pill">✓ Verified</span>}
          {job?.source === 'external' && (
            <span className="verified-pill" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              🌐 From the Web
            </span>
          )}
        </div>
        <button
          className={`save-btn ${isSaved ? 'saved' : ''}`}
          onClick={handleSaveClick}
          title={isSaved ? 'Remove bookmark' : 'Save job'}
        >
          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      <h3 className="job-title" onClick={goToDetails} style={{ cursor: 'pointer' }}>{title}</h3>

      <div className="job-meta">
        <span><MapPin size={13} /> {location}</span>
        <span><DollarSign size={13} /> {salary}</span>
        <span><Clock size={13} /> {type}</span>
      </div>

      <div className="job-tags">
        {tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <div className="job-card-footer">
        <span className="posted-date">{posted}</span>
        <button className="apply-btn" onClick={() => onApply?.(job)}>
          {job?.applyUrl ? 'Apply on Site' : 'Apply Now'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}