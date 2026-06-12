import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, X, ShieldCheck, Loader2 } from 'lucide-react';
import './CompanyVerificationForm.css';

const DOC_TYPES = [
  'Certificate of Incorporation', 'Tax Identification Number (TIN)',
  'Business License', 'Government Trade Registration', 'VAT Registration Certificate',
];

export default function CompanyVerificationForm() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]); // { type, file }
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const pendingTypeRef = useRef(null);

  const pickFile = (type) => {
    pendingTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    const type = pendingTypeRef.current;
    if (file && type && !docs.find(d => d.type === type)) {
      setDocs([...docs, { type, file }]);
    }
    e.target.value = '';
  };

  const removeDoc = (type) => setDocs(docs.filter(d => d.type !== type));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      docs.forEach(d => formData.append('documents', d.file));
      formData.append('docTypes', JSON.stringify(docs.map(d => d.type)));

      const token = localStorage.getItem('token');
      await axios.post('/api/company/verification/documents', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="cvf-page">
        <div className="cvf-success">
          <div className="cvf-success-icon"><ShieldCheck size={36} /></div>
          <h2>Documents Submitted!</h2>
          <p>Your {docs.length} document{docs.length === 1 ? '' : 's'} were uploaded and your verification is now under review by the platform admin.</p>
          <button className="submit-docs-btn ready" style={{ marginTop: 16 }} onClick={() => navigate('/dashboard/company/verification')}>
            View Verification Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cvf-page">
      <div className="cvf-header">
        <h1>Government Verification</h1>
        <p>Upload the required documents to verify your company's legitimacy.</p>
      </div>

      {/* Hidden real file input shared by all rows */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={onFileChosen}
      />

      <div className="cvf-grid">
        {/* Instructions */}
        <div className="cvf-panel info-panel">
          <h3>Requirements</h3>
          <ul className="req-list">
            {['All documents must be official government-issued.','Files must be in PDF, JPG, or PNG format.','Maximum file size: 10MB per document.','Documents must be clear and legible.','Upload at least 2 documents to proceed.'].map(r => (
              <li key={r}><span>ℹ️</span> {r}</li>
            ))}
          </ul>
          <div className="review-time"><Clock /> Documents are reviewed by the platform admin after submission.</div>
        </div>

        {/* Upload Area */}
        <div className="cvf-panel">
          <h3>Upload Documents</h3>
          <div className="doc-types">
            {DOC_TYPES.map(type => {
              const already = docs.find(d => d.type === type);
              return (
                <div key={type} className={`doc-type-row ${already ? 'uploaded' : ''}`}>
                  <div className="doc-type-label">
                    <FileText size={16} />
                    <span>{type}</span>
                  </div>
                  {already ? (
                    <div className="doc-uploaded">
                      <span className="doc-name">{already.file.name}</span>
                      <button className="doc-remove" onClick={() => removeDoc(type)}><X size={13} /></button>
                    </div>
                  ) : (
                    <button className="doc-upload-btn" onClick={() => pickFile(type)}>
                      <Upload size={13} /> Upload
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="cvf-progress">
            <span>{docs.length} of {DOC_TYPES.length} documents uploaded</span>
            <div className="cvf-progress-bar">
              <div className="cvf-progress-fill" style={{ width: `${(docs.length / DOC_TYPES.length) * 100}%` }} />
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{error}</p>}

          <button
            className={`submit-docs-btn ${docs.length >= 2 ? 'ready' : ''}`}
            disabled={docs.length < 2 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {submitting ? 'Uploading...' : docs.length < 2 ? `Upload ${2 - docs.length} more document${docs.length === 1 ? '' : 's'}` : 'Submit for Verification'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Clock() { return <span style={{ marginRight: 6 }}>⏱️</span>; }
