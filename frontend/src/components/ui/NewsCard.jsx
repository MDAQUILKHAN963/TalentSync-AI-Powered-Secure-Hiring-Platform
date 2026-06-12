import { ExternalLink, Clock, Tag } from 'lucide-react';
import './NewsCard.css';

export default function NewsCard({ article }) {
  const {
    title = '',
    source = '',
    publishedAt = '',
    category,
    summary = '',
    url = '#',
    image,
  } = article || {};

  return (
    <div className="news-card">
      {image && (
        <div className="news-image">
          <img src={image} alt={title} />
        </div>
      )}
      <div className="news-body">
        <div className="news-meta-top">
          {category && <span className="news-category"><Tag size={11} /> {category}</span>}
          <span className="news-source">{source}</span>
        </div>
        <h3 className="news-title">{title}</h3>
        <p className="news-summary">{summary}</p>
        <div className="news-footer">
          <div className="news-timing">
            <Clock size={12} />
            <span>{publishedAt}</span>
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="read-more">
            Read <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
