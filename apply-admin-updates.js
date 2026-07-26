const fs = require('fs');

const path = 'pages/admin.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add guestSort state
content = content.replace(
  "  const [guestSearch, setGuestSearch] = useState('');",
  "  const [guestSearch, setGuestSearch] = useState('');\n  const [guestSort, setGuestSort] = useState('default');"
);

// 2. Add counters and sorting dropdown
const targetHeader = `              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', margin: 0 }}>Guests — {selectedEvent.event_name}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <input type="text" placeholder="Search guests..." value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', flex: '1 1 200px' }} />`;

const replacementHeader = `              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', margin: 0 }}>Guests — {selectedEvent.event_name}</h2>
                  <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>
                    Total: {guests.length} &bull; Checked In: {guests.filter(g => g.checked_in).length} &bull; Remaining: {guests.length - guests.filter(g => g.checked_in).length}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <input type="text" placeholder="Search guests..." value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', flex: '1 1 150px' }} />
                  <select value={guestSort} onChange={(e) => setGuestSort(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', flex: '1 1 120px' }}>
                    <option value="default">Default Order</option>
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                    <option value="table">By Table Number</option>
                    <option value="checkin">By Check-in Status</option>
                  </select>`;

content = content.replace(targetHeader, replacementHeader);

// 3. Apply sorting before mapping
const targetMapStart = `              {guests.filter(g => guestSearch === '' || g.first_name.toLowerCase().includes(guestSearch.toLowerCase()) || g.last_name.toLowerCase().includes(guestSearch.toLowerCase()) || g.table_number.toString().includes(guestSearch)).map(guest => (`;

const replacementMapStart = `              {(() => {
                let filtered = guests.filter(g => guestSearch === '' || g.first_name.toLowerCase().includes(guestSearch.toLowerCase()) || g.last_name.toLowerCase().includes(guestSearch.toLowerCase()) || g.table_number.toString().includes(guestSearch));
                if (guestSort === 'alphabetical') {
                  filtered.sort((a, b) => a.first_name.localeCompare(b.first_name));
                } else if (guestSort === 'table') {
                  filtered.sort((a, b) => a.table_number - b.table_number);
                } else if (guestSort === 'checkin') {
                  filtered.sort((a, b) => (a.checked_in === b.checked_in ? 0 : a.checked_in ? -1 : 1));
                } else {
                  filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                }
                return filtered.map(guest => (`;

content = content.replace(targetMapStart, replacementMapStart);

// 4. Close the IIFE at the end of the guest map
// The end of the guest map block is `              ))}`
// Followed by `              {viewingGuest && (`

const targetMapEnd = `              ))}
              
              {viewingGuest && (`;

const replacementMapEnd = `              ))}
              })()}
              
              {viewingGuest && (`;

content = content.replace(targetMapEnd, replacementMapEnd);

fs.writeFileSync(path, content, 'utf8');
console.log('admin.js updated successfully!');
