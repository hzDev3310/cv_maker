export default function BlockRenderer({ block }) {
  switch (block.type) {
    case 'cv-header':
      return <CvHeaderBlock data={block.data} />;
    case 'section-header':
      return (
        <div className="cv-section">
          <h2 className="cv-section-title">{block.data.title}</h2>
          <hr className="cv-section-rule" />
        </div>
      );
    case 'summary':
      return <p className="cv-summary">{block.data.content}</p>;
    case 'experience-header':
      return (
        <div className="cv-entry">
          <div className="cv-entry-header">
            <span className="cv-entry-title">
              <strong>{block.data.role}</strong>
              {block.data.organization ? `, ${block.data.organization}` : ''}
            </span>
            <span className="cv-entry-date">{block.data.date}</span>
          </div>
          {block.data.location && <div className="cv-entry-location">{block.data.location}</div>}
        </div>
      );
    case 'project-header':
      return (
        <div className="cv-entry">
          <div className="cv-entry-header">
            <span className="cv-entry-title"><strong>{block.data.name}</strong></span>
            <span className="cv-entry-date">{block.data.date}</span>
          </div>
          {block.data.subtitle && <div className="cv-entry-subtitle">{block.data.subtitle}</div>}
        </div>
      );
    case 'education-header':
      return (
        <div className="cv-entry">
          <div className="cv-entry-header">
            <span className="cv-entry-title">
              <strong>{block.data.degree}</strong>
              {block.data.institution ? `, ${block.data.institution}` : ''}
            </span>
            <span className="cv-entry-date">{block.data.date}</span>
          </div>
          {block.data.location && <div className="cv-entry-location">{block.data.location}</div>}
        </div>
      );
    case 'bullet':
      return <div className={`measure-bullet${block.isFirstBullet ? ' first-bullet' : ''}`}>{block.data.text}</div>;
    case 'tags':
      return (
        <div className="cv-tags">
          {block.data.tags.map((t, i) => <span key={i} className="cv-tag">{t}</span>)}
        </div>
      );
    case 'skill-group':
      return (
        <div className="cv-skill-group">
          <strong>{block.data.category}:</strong> {block.data.skills.join(', ')}
        </div>
      );
    case 'language':
      return (
        <div className="cv-language">
          <span>{block.data.name}</span>
          {block.data.level && <span className="cv-lang-level"> – {block.data.level}</span>}
        </div>
      );
    default:
      return null;
  }
}

function CvHeaderBlock({ data }) {
  const { meta, locale } = data;
  const contactParts = [
    meta.contact?.email,
    meta.contact?.phone,
    meta.contact?.location?.[locale],
  ].filter(Boolean);

  return (
    <div className="cv-header">
      <h1 className="cv-name">{meta.name}</h1>
      <div className="cv-jobtitle">{meta.jobTitle?.[locale] || ''}</div>
      <div className="cv-contact-line">{contactParts.join(' | ')}</div>
      {meta.contact?.links?.length > 0 && (
        <div className="cv-links-line">
          {meta.contact.links.map((link, i) => (
            <span key={i}>{i > 0 && ' | '}{link.label}: {link.url}</span>
          ))}
        </div>
      )}
    </div>
  );
}
