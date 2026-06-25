import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';

const YOUR_USER_ID = '2b4afcb9-4075-42a5-a612-949496562698';
const baseUrl = 'https://everafter-hub.vercel.app';

export default function Admin({ initialRole = 'admin' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(initialRole || (router.query?.role === 'user' ? 'user' : 'admin'));
  const [activeTab, setActiveTab] = useState('events');
  const [isLoading, setIsLoading] = useState(false);
  const [adminUserFilter, setAdminUserFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [users, setUsers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [menu, setMenu] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [songs, setSongs] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEvent, setQrEvent] = useState(null);

  const [showEventForm, setShowEventForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  const [newEvent, setNewEvent] = useState({ event_type: 'wedding', event_name: '', host_name: '', event_date: '', venue: '', slug: '', assigned_user_id: '' });
  const [newUser, setNewUser] = useState({ email: '', full_name: '', company_name: '', phone: '', password: '', role: 'user' });
  const [editingUser, setEditingUser] = useState(null);
  const [newUserForEvent, setNewUserForEvent] = useState({ email: '', full_name: '', password: '' });
  const [newGuest, setNewGuest] = useState({ full_name: '', table_number: '', dietary_requirements: '' });
  const [bulkGuestsText, setBulkGuestsText] = useState('');
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [newTimeline, setNewTimeline] = useState({ event_time: '', title: '', location: '', sort_order: '' });
  const [newMenu, setNewMenu] = useState({ course_type: 'starter', dish_name: '', description: '' });
  const [passwordData, setPasswordData] = useState({ userId: '', newPassword: '' });

  useEffect(() => {
    if (router.query?.role) {
      setRole(router.query.role === 'user' ? 'user' : 'admin');
    }
  }, [router.query?.role]);

  const isAdmin = currentUser?.role === 'admin' || role === 'admin';
  const roleTheme = isAdmin
    ? {
        shell: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        primary: 'linear-gradient(to right, #f43f5e, #ec4899)',
        accent: '#f43f5e',
        glow: '#fff1f2',
        badge: 'Admin access',
        title: 'Admin Workspace',
        description: 'Manage events, users, guests, and guest experience content.',
      }
    : {
        shell: 'linear-gradient(135deg, #0f172a, #1d4ed8, #0ea5e9)',
        primary: 'linear-gradient(to right, #2563eb, #0ea5e9)',
        accent: '#2563eb',
        glow: '#eff6ff',
        badge: 'User access',
        title: 'User Workspace',
        description: 'View your assigned event and contribute to the guest experience.',
      };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok && result.user) {
      const resolvedRole = result.user.role || (email.toLowerCase() === 'admin@everafter.com' ? 'admin' : 'user');
      const user = { ...result.user, role: resolvedRole };
      setCurrentUser(user);
      setRole(resolvedRole);
      setLoggedIn(true);
      loadEvents(user);
      if (resolvedRole === 'admin') {
        loadUsers();
      }
    } else {
      alert(result.error || 'Wrong email or password');
    }
    setIsLoading(false);
  };

  const loadEvents = async (user = currentUser, filterId = adminUserFilter) => {
    setIsLoading(true);
    let query = supabase.from('events').select('*').order('event_date', { ascending: true });

    if (user && user.role !== 'admin') {
      query = query.eq('user_id', user.id);
    } else if (filterId !== 'all') {
      query = query.eq('user_id', filterId);
    }

    const { data } = await query;
    setEvents(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (loggedIn) {
      loadEvents(currentUser, adminUserFilter);
    }
  }, [adminUserFilter]);

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const loadGuests = async (eventId) => {
    const { data } = await supabase.from('guests').select('*').eq('event_id', eventId).order('table_number');
    setGuests(data || []);
  };

  const loadTimeline = async (eventId) => {
    const { data } = await supabase.from('timeline_items').select('*').eq('event_id', eventId).order('sort_order');
    setTimeline(data || []);
  };

  const loadMenu = async (eventId) => {
    const { data } = await supabase.from('menu_items').select('*').eq('event_id', eventId).order('course_type');
    setMenu(data || []);
  };

  const loadPhotos = async (eventId) => {
    const { data } = await supabase.from('photos').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    setPhotos(data || []);
  };

  const loadMessages = async (eventId) => {
    const { data } = await supabase.from('guestbook').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    setMessages(data || []);
  };

  const loadSongs = async (eventId) => {
    const { data } = await supabase.from('song_requests').select('*').eq('event_id', eventId).order('votes', { ascending: false });
    setSongs(data || []);
  };

  const selectEvent = (event) => {
    setSelectedEvent(event);
    loadGuests(event.id);
    loadTimeline(event.id);
    loadMenu(event.id);
    loadPhotos(event.id);
    loadMessages(event.id);
    loadSongs(event.id);
    setActiveTab('guests');
  };

  const openQR = (event) => {
    setQrEvent(event);
    setShowQRModal(true);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('admin-qr-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.download = `everafter-qr-${qrEvent?.slug || 'event'}.png`;
      link.href = pngUrl;
      link.click();
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();

    try {
      let assignedUserId = newEvent.assigned_user_id || '';

      if (!assignedUserId) {
        if (!newUserForEvent.email || !newUserForEvent.full_name || !newUserForEvent.password) {
          alert('Choose an existing user or add a new user email, full name, and password for this event.');
          return;
        }

        const userResponse = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newUserForEvent.email,
            full_name: newUserForEvent.full_name,
            company_name: '',
            phone: '',
            password: newUserForEvent.password,
          }),
        });

        const userResult = await userResponse.json();
        if (!userResponse.ok || !userResult.user) {
          alert(userResult.error || 'Unable to create user account');
          return;
        }

        assignedUserId = userResult.user.id;
      }

      const eventPayload = {
        ...newEvent,
        user_id: assignedUserId || currentUser?.id || YOUR_USER_ID,
      };
      delete eventPayload.assigned_user_id;

      const { data, error } = await supabase
        .from('events')
        .insert(eventPayload)
        .select('*')
        .single();

      if (!error && data) {
        setShowEventForm(false);
        setNewEvent({ event_type: 'wedding', event_name: '', host_name: '', event_date: '', venue: '', slug: '', assigned_user_id: '' });
        setNewUserForEvent({ email: '', full_name: '', password: '' });
        loadEvents(currentUser);
        setSelectedEvent(data);
        setQrEvent(data);
        setShowQRModal(true);
        alert('Event created and assigned to the selected user!');
      } else {
        alert('Error: ' + error.message);
      }
    } catch (error) {
      console.error('Event creation failed', error);
      alert('Error creating event');
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });

    const result = await response.json();
    if (response.ok) {
      setShowUserForm(false);
      setNewUser({ email: '', full_name: '', company_name: '', phone: '', password: '' });
      loadUsers();
      alert('User added!');
      alert(result.error || 'Error creating user');
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser),
    });
    if (response.ok) {
      setEditingUser(null);
      setShowUserForm(false);
      loadUsers();
      alert('User updated!');
    } else {
      const result = await response.json();
      alert(result.error || 'Error updating user');
    }
    setIsLoading(false);
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setIsLoading(true);
    const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (response.ok) {
      loadUsers();
    } else {
      alert('Error deleting user');
    }
    setIsLoading(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('users')
      .update({ password: passwordData.newPassword })
      .eq('id', passwordData.userId);
    if (!error) {
      setShowPasswordForm(false);
      setPasswordData({ userId: '', newPassword: '' });
      alert('Password updated!');
    } else {
      alert('Error: ' + error.message);
    }
  };

  const addGuest = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setIsLoading(true);
    const { error } = await supabase.from('guests').insert({ 
      event_id: selectedEvent.id, 
      full_name: newGuest.full_name,
      table_number: parseInt(newGuest.table_number),
      dietary_requirements: newGuest.dietary_requirements 
    });
    if (!error) { 
      setShowGuestForm(false); 
      setNewGuest({ full_name: '', table_number: '', dietary_requirements: '' }); 
      loadGuests(selectedEvent.id); 
    } else {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !bulkGuestsText.trim()) return;
    setIsLoading(true);

    const lines = bulkGuestsText.split('\n');
    const guestsToInsert = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',').map(p => p.trim());
      if (parts.length > 0) {
        let name = parts.length >= 2 ? `${parts[0]} ${parts[1]}`.trim() : parts[0];
        let tNum = parseInt(parts.length >= 3 ? parts[2] : (parts[1] || '0')) || 0;
        let diet = parts.length >= 4 ? parts[3] : '';

        guestsToInsert.push({
          event_id: selectedEvent.id,
          full_name: name,
          table_number: tNum,
          dietary_requirements: diet
        });
      }
    }

    if (guestsToInsert.length > 0) {
      const { error } = await supabase.from('guests').insert(guestsToInsert);
      if (!error) {
        setShowGuestForm(false);
        setBulkGuestsText('');
        setIsBulkUpload(false);
        loadGuests(selectedEvent.id);
        alert(`${guestsToInsert.length} guests uploaded successfully!`);
      } else {
        alert('Error during bulk upload: ' + error.message);
      }
    }
    setIsLoading(false);
  };

  const addTimeline = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const { error } = await supabase.from('timeline_items').insert({ 
      event_id: selectedEvent.id, 
      event_time: newTimeline.event_time,
      title: newTimeline.title,
      location: newTimeline.location,
      sort_order: parseInt(newTimeline.sort_order) || 0 
    });
    if (!error) { 
      setShowTimelineForm(false); 
      setNewTimeline({ event_time: '', title: '', location: '', sort_order: '' }); 
      loadTimeline(selectedEvent.id); 
    } else {
      alert('Error: ' + error.message);
    }
  };

  const addMenu = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    if (editingMenu) {
      const { error } = await supabase
        .from('menu_items')
        .update({ course_type: newMenu.course_type, dish_name: newMenu.dish_name, description: newMenu.description })
        .eq('id', editingMenu);
      if (!error) {
        setEditingMenu(null);
        setShowMenuForm(false);
        setNewMenu({ course_type: 'starter', dish_name: '', description: '' });
        loadMenu(selectedEvent.id);
      }
    } else {
      const { error } = await supabase.from('menu_items').insert({ 
        event_id: selectedEvent.id, 
        course_type: newMenu.course_type,
        dish_name: newMenu.dish_name,
        description: newMenu.description
      });
      if (!error) { 
        setShowMenuForm(false); 
        setNewMenu({ course_type: 'starter', dish_name: '', description: '' }); 
        loadMenu(selectedEvent.id); 
      } else {
        alert('Error: ' + error.message);
      }
    }
  };

  const editMenuItem = (item) => {
    setNewMenu({ course_type: item.course_type, dish_name: item.dish_name, description: item.description || '' });
    setEditingMenu(item.id);
    setShowMenuForm(true);
  };

  const deleteItem = async (table, id) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from(table).delete().eq('id', id);
    if (selectedEvent) {
      loadGuests(selectedEvent.id);
      loadTimeline(selectedEvent.id);
      loadMenu(selectedEvent.id);
      loadPhotos(selectedEvent.id);
      loadMessages(selectedEvent.id);
      loadSongs(selectedEvent.id);
    }
  };

  const approvePhoto = async (id, approved) => {
    await supabase.from('photos').update({ is_approved: approved }).eq('id', id);
    if (selectedEvent) loadPhotos(selectedEvent.id);
  };

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: roleTheme.shell }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '8px', fontSize: '28px' }}>EverAfter Hub</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>{role === 'user' ? 'User Login' : 'Admin Login'}</p>
          <div style={{ background: roleTheme.glow, border: `1px solid ${roleTheme.accent}22`, color: roleTheme.accent, padding: '10px 12px', borderRadius: '999px', textAlign: 'center', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
            {roleTheme.title}
          </div>
          <form onSubmit={handleLogin}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '12px', boxSizing: 'border-box' }} required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '16px', boxSizing: 'border-box' }} required />
            <button type="submit" style={{ width: '100%', background: roleTheme.primary, color: 'white', padding: '14px', borderRadius: '9999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = (currentUser?.role === 'admin' || role === 'admin')
    ? ['events', 'users', 'guests', 'timeline', 'menu', 'photos', 'messages', 'songs']
    : ['events', 'guests', 'timeline', 'menu', 'photos', 'messages', 'songs'];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div style={{ background: 'white', padding: '16px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', margin: 0 }}>✨ EverAfter {isAdmin ? 'Admin' : 'User'} Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{roleTheme.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: roleTheme.accent, background: roleTheme.glow, border: `1px solid ${roleTheme.accent}22`, padding: '6px 10px', borderRadius: '999px', fontWeight: 600 }}>{roleTheme.badge}</span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>{currentUser?.full_name}</span>
          <button onClick={() => { setPasswordData({ userId: currentUser?.id, newPassword: '' }); setShowPasswordForm(true); }} style={{ background: roleTheme.primary, color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>🔑 Change Password</button>
          <button onClick={() => setLoggedIn(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </div>

      {isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ fontSize: '40px', animation: 'spin 1s linear infinite' }}>⏳</div>
        </div>
      )}

      {showQRModal && qrEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '20px', textAlign: 'center', maxWidth: '420px', width: '90%' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>{qrEvent.event_name}</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
              {qrEvent.event_type} • {new Date(qrEvent.event_date).toLocaleDateString()}
            </p>
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px' }}>
              <QRCodeCanvas
                id="admin-qr-canvas"
                value={`${baseUrl}/event?id=${qrEvent.slug}`}
                size={180}
                level="H"
                includeMargin={true}
                fgColor="#e11d48"
                bgColor="#ffffff"
              />
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '20px', wordBreak: 'break-all' }}>
              {baseUrl}/event?id={qrEvent.slug}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={downloadQR} style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>📥 Download QR</button>
              <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/event?id=${qrEvent.slug}`); alert('Link copied!'); }} style={{ background: '#f3f4f6', color: '#4b5563', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>📋 Copy Link</button>
            </div>
            <button onClick={() => setShowQRModal(false)} style={{ marginTop: '16px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}>Close</button>
          </div>
        </div>
      )}

      {showPasswordForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>Change Password</h3>
            <form onSubmit={changePassword}>
              <select value={passwordData.userId} onChange={(e) => setPasswordData({...passwordData, userId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', marginBottom: '12px', boxSizing: 'border-box' }} required>
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
              </select>
              <input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', marginBottom: '12px', boxSizing: 'border-box' }} required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, background: '#f59e0b', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Update Password</button>
                <button type="button" onClick={() => setShowPasswordForm(false)} style={{ flex: 1, background: '#e5e7eb', color: '#4b5563', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 73px)' }}>
        <div style={{ width: '220px', background: 'white', padding: '20px', borderRight: '1px solid #e5e7eb' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'block', width: '100%', padding: '12px 16px', marginBottom: '4px', borderRadius: '10px', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 500, fontSize: '14px', textTransform: 'capitalize', background: activeTab === tab ? roleTheme.glow : 'transparent', color: activeTab === tab ? roleTheme.accent : '#4b5563' }}>
              {tab === 'events' && '🎉 '}{tab === 'users' && '👤 '}{tab === 'guests' && '👥 '}{tab === 'timeline' && '⏱ '}{tab === 'menu' && '🍽 '}{tab === 'photos' && '📸 '}{tab === 'messages' && '💬 '}{tab === 'songs' && '🎵 '}{tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '24px' }}>
          
          {activeTab === 'events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Events</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isAdmin && (
                    <select value={adminUserFilter} onChange={(e) => setAdminUserFilter(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                      <option value="all">All Users</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  )}
                  {isAdmin && (
                    <button onClick={() => setShowEventForm(!showEventForm)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', fontWeight: 600 }}>{showEventForm ? 'Cancel' : '+ New Event'}</button>
                  )}
                </div>
              </div>
              {showEventForm && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <form onSubmit={createEvent} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    <select value={newEvent.event_type} onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                      <option value="wedding">💒 Wedding</option><option value="corporate">💼 Corporate</option><option value="birthday">🎂 Birthday</option><option value="gala">✨ Gala</option><option value="party">🎉 Party</option><option value="other">🎯 Other</option>
                    </select>
                    <input placeholder="Event Name" value={newEvent.event_name} onChange={(e) => setNewEvent({...newEvent, event_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Host/Couple" value={newEvent.host_name} onChange={(e) => setNewEvent({...newEvent, host_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Venue" value={newEvent.venue} onChange={(e) => setNewEvent({...newEvent, venue: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="URL slug" value={newEvent.slug} onChange={(e) => setNewEvent({...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <select value={newEvent.assigned_user_id} onChange={(e) => setNewEvent({...newEvent, assigned_user_id: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', gridColumn: '1/-1' }}>
                      <option value="">Create a new user account for this event</option>
                      {users.map(user => <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>)}
                    </select>
                    {!newEvent.assigned_user_id && (
                      <>
                        <input placeholder="New user email" value={newUserForEvent.email} onChange={(e) => setNewUserForEvent({...newUserForEvent, email: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                        <input placeholder="New user full name" value={newUserForEvent.full_name} onChange={(e) => setNewUserForEvent({...newUserForEvent, full_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                        <input type="password" placeholder="New user password" value={newUserForEvent.password} onChange={(e) => setNewUserForEvent({...newUserForEvent, password: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                      </>
                    )}
                    <button type="submit" style={{ gridColumn: '1/-1', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Create Event</button>
                  </form>
                </div>
              )}
              {events.map(event => (
                <div key={event.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                      <QRCodeCanvas value={`${baseUrl}/event?id=${event.slug}`} size={50} level="L" fgColor="#e11d48" bgColor="#ffffff" includeMargin={false} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{event.event_name}</p>
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>{event.event_type} • {new Date(event.event_date).toLocaleDateString()} • {event.venue}</p>
                      <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0 0' }}>Assigned to: {users.find((u) => u.id === event.user_id)?.full_name || 'Unassigned'}</p>
                      <code style={{ fontSize: '11px', color: '#f43f5e' }}>event?id={event.slug}</code>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openQR(event)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>📱 QR</button>
                    <button onClick={() => selectEvent(event)} style={{ background: '#fff1f2', color: '#f43f5e', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Manage →</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Admin Users</h2>
                <button onClick={() => { setShowUserForm(!showUserForm); setEditingUser(null); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', fontWeight: 600 }}>{showUserForm && !editingUser ? 'Cancel' : '+ Add User'}</button>
              </div>
              {showUserForm && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '12px' }}>{editingUser ? 'Edit User' : 'Add New User'}</h4>
                  <form onSubmit={editingUser ? updateUser : createUser} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    <input placeholder="Email" value={editingUser ? editingUser.email : newUser.email} onChange={(e) => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Full Name" value={editingUser ? editingUser.full_name : newUser.full_name} onChange={(e) => editingUser ? setEditingUser({...editingUser, full_name: e.target.value}) : setNewUser({...newUser, full_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Company" value={editingUser ? editingUser.company_name : newUser.company_name} onChange={(e) => editingUser ? setEditingUser({...editingUser, company_name: e.target.value}) : setNewUser({...newUser, company_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                    <input placeholder="Phone" value={editingUser ? editingUser.phone : newUser.phone} onChange={(e) => editingUser ? setEditingUser({...editingUser, phone: e.target.value}) : setNewUser({...newUser, phone: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                    <select value={editingUser ? editingUser.role : newUser.role} onChange={(e) => editingUser ? setEditingUser({...editingUser, role: e.target.value}) : setNewUser({...newUser, role: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input type="password" placeholder={editingUser ? "New Password (optional)" : "Password"} value={editingUser ? (editingUser.password || '') : newUser.password} onChange={(e) => editingUser ? setEditingUser({...editingUser, password: e.target.value}) : setNewUser({...newUser, password: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required={!editingUser} />
                    <button type="submit" style={{ gridColumn: '1/-1', background: editingUser ? '#f59e0b' : '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{editingUser ? 'Update User' : 'Add User'}</button>
                  </form>
                </div>
              )}
              {users.map(user => (
                <div key={user.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{user.full_name} <span style={{fontSize:'12px', color:'#9ca3af', fontWeight: 400}}>({user.role})</span></p>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>{user.email} • {user.company_name || 'N/A'} • {user.phone || 'N/A'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setEditingUser(user); setShowUserForm(true); }} style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Edit</button>
                    <button onClick={() => deleteUser(user.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'guests' && selectedEvent && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Guests — {selectedEvent.event_name}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setIsBulkUpload(true); setShowGuestForm(true); }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', background: 'white', color: '#4b5563', fontWeight: 600 }}>Bulk Upload</button>
                  <button onClick={() => { setIsBulkUpload(false); setShowGuestForm(true); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', fontWeight: 600 }}>+ Add Guest</button>
                </div>
              </div>
              {showGuestForm && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0 }}>{isBulkUpload ? 'Bulk Upload Guests' : 'Add New Guest'}</h4>
                    <button onClick={() => setShowGuestForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>Cancel</button>
                  </div>
                  {isBulkUpload ? (
                    <form onSubmit={handleBulkUpload} style={{ display: 'grid', gap: '10px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Format each line as: First Name, Last Name, Table Number, Dietary Requirements</p>
                      <textarea placeholder="e.g. John, Doe, 5, Vegan" value={bulkGuestsText} onChange={(e) => setBulkGuestsText(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', height: '120px', fontFamily: 'monospace', fontSize: '13px' }} required />
                      <button type="submit" style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Upload Guests</button>
                    </form>
                  ) : (
                    <form onSubmit={addGuest} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr 1fr' }}>
                      <input placeholder="Full Name" value={newGuest.full_name} onChange={(e) => setNewGuest({...newGuest, full_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                      <input placeholder="Table Number" type="number" value={newGuest.table_number} onChange={(e) => setNewGuest({...newGuest, table_number: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                      <input placeholder="Dietary (optional)" value={newGuest.dietary_requirements} onChange={(e) => setNewGuest({...newGuest, dietary_requirements: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                      <button type="submit" style={{ gridColumn: '1/-1', background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Add Guest</button>
                    </form>
                  )}
                </div>
              )}
              {guests.map(guest => (
                <div key={guest.id} style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div><span style={{ fontWeight: 600 }}>{guest.full_name}</span><span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '12px' }}>Table {guest.table_number}</span>{guest.dietary_requirements && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginLeft: '8px' }}>{guest.dietary_requirements}</span>}</div>
                  <button onClick={() => deleteItem('guests', guest.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'timeline' && selectedEvent && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Timeline — {selectedEvent.event_name}</h2>
                <button onClick={() => setShowTimelineForm(!showTimelineForm)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', fontWeight: 600 }}>+ Add Item</button>
              </div>
              {showTimelineForm && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                  <form onSubmit={addTimeline} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                    <input type="time" value={newTimeline.event_time} onChange={(e) => setNewTimeline({...newTimeline, event_time: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Title" value={newTimeline.title} onChange={(e) => setNewTimeline({...newTimeline, title: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Location" value={newTimeline.location} onChange={(e) => setNewTimeline({...newTimeline, location: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                    <input placeholder="Order #" type="number" value={newTimeline.sort_order} onChange={(e) => setNewTimeline({...newTimeline, sort_order: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                    <button type="submit" style={{ gridColumn: '1/-1', background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Add Timeline Item</button>
                  </form>
                </div>
              )}
              {timeline.map(item => (
                <div key={item.id} style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><span style={{ fontWeight: 600, color: '#f43f5e' }}>{item.event_time?.slice(0,5)}</span><span style={{ fontWeight: 600, marginLeft: '12px' }}>{item.title}</span><span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '12px' }}>{item.location}</span></div>
                  <button onClick={() => deleteItem('timeline_items', item.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'menu' && selectedEvent && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Menu — {selectedEvent.event_name}</h2>
                <button onClick={() => { setEditingMenu(null); setNewMenu({ course_type: 'starter', dish_name: '', description: '' }); setShowMenuForm(!showMenuForm); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', fontWeight: 600 }}>{showMenuForm ? 'Cancel' : '+ Add Course'}</button>
              </div>
              {showMenuForm && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '12px' }}>{editingMenu ? 'Edit Course' : 'Add New Course'}</h4>
                  <form onSubmit={addMenu} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    <select value={newMenu.course_type} onChange={(e) => setNewMenu({...newMenu, course_type: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                      <option value="starter">🥗 Starter</option><option value="main">🍖 Main Course</option><option value="dessert">🍫 Dessert</option><option value="drinks">🍷 Drinks</option>
                    </select>
                    <input placeholder="Dish Name" value={newMenu.dish_name} onChange={(e) => setNewMenu({...newMenu, dish_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Description (optional)" value={newMenu.description} onChange={(e) => setNewMenu({...newMenu, description: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', gridColumn: '1/-1' }} />
                    <button type="submit" style={{ gridColumn: '1/-1', background: editingMenu ? '#f59e0b' : '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{editingMenu ? 'Update Course' : 'Add Course'}</button>
                  </form>
                </div>
              )}
              {['starter', 'main', 'dessert', 'drinks'].map(type => {
                const items = menu.filter(m => m.course_type === type);
                if (items.length === 0) return null;
                return (
                  <div key={type} style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>{type === 'starter' && '🥗 Starters'}{type === 'main' && '🍖 Main Courses'}{type === 'dessert' && '🍫 Desserts'}{type === 'drinks' && '🍷 Drinks'}</h3>
                    {items.map(item => (
                      <div key={item.id} style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div><span style={{ fontWeight: 600 }}>{item.dish_name}</span>{item.description && <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '12px' }}>— {item.description}</span>}</div>
                        <div style={{ display: 'flex', gap: '6px' }}><button onClick={() => editMenuItem(item)} style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Edit</button><button onClick={() => deleteItem('menu_items', item.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button></div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'photos' && selectedEvent && (
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Photos — {selectedEvent.event_name}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {photos.map(photo => (
                  <div key={photo.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <div style={{ padding: '10px' }}><p style={{ fontSize: '12px', margin: '0 0 8px 0' }}>{photo.caption || 'No caption'} — {photo.uploaded_by}</p><div style={{ display: 'flex', gap: '6px' }}><button onClick={() => approvePhoto(photo.id, true)} style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Approve</button><button onClick={() => deleteItem('photos', photo.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Delete</button></div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'messages' && selectedEvent && (
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Guestbook — {selectedEvent.event_name}</h2>
              {messages.map(msg => (
                <div key={msg.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between' }}><div><p style={{ fontWeight: 600, margin: 0 }}>{msg.guest_name}</p><p style={{ color: '#4b5563', margin: '4px 0 0 0' }}>{msg.message}</p></div><button onClick={() => deleteItem('guestbook', msg.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', height: 'fit-content' }}>Delete</button></div>
              ))}
            </div>
          )}

          {activeTab === 'songs' && selectedEvent && (
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Song Requests — {selectedEvent.event_name}</h2>
              {songs.map(song => (
                <div key={song.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between' }}><div><p style={{ fontWeight: 600, margin: 0 }}>🎵 {song.song_title}</p><p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>by {song.requested_by} • 👍 {song.votes}</p></div><button onClick={() => deleteItem('song_requests', song.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', height: 'fit-content' }}>Delete</button></div>
              ))}
            </div>
          )}

          {['guests','timeline','menu','photos','messages','songs'].includes(activeTab) && !selectedEvent && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}><p style={{ fontSize: '40px' }}>👈</p><p>Select an event from the Events tab first</p></div>
          )}
        </div>
      </div>
    </div>
  );
}