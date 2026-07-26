const fs = require('fs');

const modalHTML = `
      {selectedPhoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', flexDirection: 'column' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedPhoto(null); }}>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedPhoto(null); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }}>&times;</button>
          <img src={selectedPhoto.image_url} alt={selectedPhoto.caption} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px', zIndex: 1000000 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
          <div style={{ color: 'white', marginTop: '16px', textAlign: 'center', zIndex: 1000000 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            {selectedPhoto.caption && <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 500 }}>{selectedPhoto.caption}</p>}
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>— {selectedPhoto.uploaded_by}</p>
          </div>
        </div>
      )}`;

function fixEventJs() {
  const path = 'pages/event.js';
  let content = fs.readFileSync(path, 'utf8');

  // Remove old modal
  content = content.replace(/\{selectedPhoto && \([\s\S]*?\}\)\}/g, '');
  
  // Wrap return in <> and prepend modal
  const targetReturn = `  return (
    <div className="dashboard-layout" style={{ backgroundImage: event.backgroundTheme ? \`url(\${event.backgroundTheme})\` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh' }}>`;
  
  const replacementReturn = `  return (
    <>
${modalHTML}
    <div className="dashboard-layout" style={{ backgroundImage: event.backgroundTheme ? \`url(\${event.backgroundTheme})\` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh' }}>`;

  content = content.replace(targetReturn, replacementReturn);
  
  // Close the <>
  const targetEnd = `    </div>
  );
}`;
  const replacementEnd = `    </div>
    </>
  );
}`;
  content = content.replace(targetEnd, replacementEnd);
  
  // Add stopPropagation to image buttons (if any inside event.js photo div)
  // In event.js there are no action buttons, just the div.

  fs.writeFileSync(path, content, 'utf8');
}

function fixAdminJs() {
  const path = 'pages/admin.js';
  let content = fs.readFileSync(path, 'utf8');

  // Ensure state exists
  if (!content.includes('const [selectedPhoto, setSelectedPhoto] = useState(null);')) {
    content = content.replace(
      "  const [activeTab, setActiveTab] = useState('events');",
      "  const [activeTab, setActiveTab] = useState('events');\n  const [selectedPhoto, setSelectedPhoto] = useState(null);"
    );
  }

  // Remove any existing modal
  content = content.replace(/\{selectedPhoto && \([\s\S]*?\}\)\}/g, '');

  // Wrap return in <> and prepend modal
  const targetReturn = `  return (
    <div className="dashboard-layout">`;
  
  const replacementReturn = `  return (
    <>
${modalHTML}
    <div className="dashboard-layout">`;

  content = content.replace(targetReturn, replacementReturn);

  // Close the <>
  const targetEnd = `    </div>
  );
}`;
  const replacementEnd = `    </div>
    </>
  );
}`;
  content = content.replace(targetEnd, replacementEnd);

  // Stop propagation on action buttons so clicking them doesn't open the modal
  content = content.replace(
    /<button onClick={\(\) => approvePhoto\(photo.id, false\)}/g,
    "<button onClick={(e) => { e.stopPropagation(); approvePhoto(photo.id, false); }}"
  );
  content = content.replace(
    /<button onClick={\(\) => deleteItem\('photos', photo.id\)}/g,
    "<button onClick={(e) => { e.stopPropagation(); deleteItem('photos', photo.id); }}"
  );
  content = content.replace(
    /<button onClick={\(\) => approvePhoto\(photo.id, true\)}/g,
    "<button onClick={(e) => { e.stopPropagation(); approvePhoto(photo.id, true); }}"
  );
  
  // Ensure the photo divs have onClick
  content = content.replace(
    /<div key={photo\.id} style={{ background: 'var\(--bg-card\)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba\(0,0,0,0\.06\)' }}/g,
    "<div key={photo.id} onClick={() => setSelectedPhoto(photo)} style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}"
  );

  fs.writeFileSync(path, content, 'utf8');
}

fixEventJs();
fixAdminJs();
console.log('Fixed modals in event.js and admin.js');
