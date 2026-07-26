const fs = require('fs');

function addModalToEvent() {
  const path = 'pages/event.js';
  let content = fs.readFileSync(path, 'utf8');

  // 1. Add state
  content = content.replace(
    "  const [loading, setLoading] = useState(true);",
    "  const [loading, setLoading] = useState(true);\n  const [selectedPhoto, setSelectedPhoto] = useState(null);"
  );

  // 2. Add pointer to photo div
  const targetPhotoDiv = `                        <div key={photo.id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: 'var(--bg-card)' }}>
                          <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />`;
  const replacementPhotoDiv = `                        <div key={photo.id} onClick={() => setSelectedPhoto(photo)} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: 'var(--bg-card)', cursor: 'pointer' }}>
                          <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />`;
  
  content = content.replace(targetPhotoDiv, replacementPhotoDiv);

  // 3. Add modal near the end of dashboard-layout
  const targetEnd = `        <nav className="dashboard-nav hide-scrollbar">`;
  const modalHTML = `
        {selectedPhoto && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', flexDirection: 'column' }} onClick={() => setSelectedPhoto(null)}>
            <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            <img src={selectedPhoto.image_url} alt={selectedPhoto.caption} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()} />
            <div style={{ color: 'white', marginTop: '16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              {selectedPhoto.caption && <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 500 }}>{selectedPhoto.caption}</p>}
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>— {selectedPhoto.uploaded_by}</p>
            </div>
          </div>
        )}
        <nav className="dashboard-nav hide-scrollbar">`;
  
  content = content.replace(targetEnd, modalHTML);

  fs.writeFileSync(path, content, 'utf8');
}

function addModalToAdmin() {
  const path = 'pages/admin.js';
  let content = fs.readFileSync(path, 'utf8');

  // 1. Add state
  content = content.replace(
    "  const [activeTab, setActiveTab] = useState('events');",
    "  const [activeTab, setActiveTab] = useState('events');\n  const [selectedPhoto, setSelectedPhoto] = useState(null);"
  );

  // 2. Add pointer to photo div
  // In admin there are approved photos and unapproved photos
  const targetPhotoDivAdmin1 = `                      <div key={photo.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />`;
  const replacementPhotoDivAdmin1 = `                      <div key={photo.id} onClick={() => setSelectedPhoto(photo)} style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                        <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />`;
  
  content = content.replace(targetPhotoDivAdmin1, replacementPhotoDivAdmin1); // Might replace first occurrence
  content = content.replace(targetPhotoDivAdmin1, replacementPhotoDivAdmin1); // Replace second occurrence if any

  // Wait, let's just do a global replace for all `style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}` that follow `key={photo.id}`
  // Let's use regex
  content = content.replace(
    /<div key={photo\.id} style={{ background: 'var\(--bg-card\)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba\(0,0,0,0\.04\)' }}/g,
    "<div key={photo.id} onClick={() => setSelectedPhoto(photo)} style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}"
  );

  // 3. Add modal near the end of main layout
  const targetEndAdmin = `      {showUserModal && (`;
  const modalHTMLAdmin = `
      {selectedPhoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', flexDirection: 'column' }} onClick={() => setSelectedPhoto(null)}>
          <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
          <img src={selectedPhoto.image_url} alt={selectedPhoto.caption} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()} />
          <div style={{ color: 'white', marginTop: '16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            {selectedPhoto.caption && <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 500 }}>{selectedPhoto.caption}</p>}
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>— {selectedPhoto.uploaded_by}</p>
          </div>
        </div>
      )}
      
      {showUserModal && (`;

  content = content.replace(targetEndAdmin, modalHTMLAdmin);

  fs.writeFileSync(path, content, 'utf8');
}

addModalToEvent();
addModalToAdmin();
console.log('Modals added successfully!');
