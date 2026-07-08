import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Key } from 'lucide-react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import FullPageLoader from '../components/FullPageLoader';
import Spinner from '../components/Spinner';

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
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [users, setUsers] = useState([]);
  const [dangerInput, setDangerInput] = useState({ everything: '', events: '', users: '', guests: '', targetEventId: 'all' });
  const [guests, setGuests] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [menu, setMenu] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [liveChat, setLiveChat] = useState([]);
  const [newLiveChatMessage, setNewLiveChatMessage] = useState('');

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEvent, setQrEvent] = useState(null);

  const [showEventForm, setShowEventForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  const [newEvent, setNewEvent] = useState({ event_type: 'wedding', event_name: '', host_name: '', event_date: '', venue: '', slug: '', assigned_user_id: '', background_theme: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=80', cover_photo: '', number_of_tables: 10, chairs_per_table: 10 });
  const [previewCover, setPreviewCover] = useState(null);
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [editGuestTable, setEditGuestTable] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [newUserForEvent, setNewUserForEvent] = useState({ email: '', full_name: '', password: '' });

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewCover(reader.result);
      setUploadingCover(false);
    };
    reader.readAsDataURL(file);
  };
  
  const confirmCoverUpload = (e) => {
    e.preventDefault();
    setNewEvent({ ...newEvent, cover_photo: previewCover });
  };
  
  const cancelCoverUpload = (e) => {
    e.preventDefault();
    setPreviewCover(null);
  };
  const [newUser, setNewUser] = useState({ email: '', full_name: '', company_name: '', phone: '', password: '', role: 'user' });
  const [editingUser, setEditingUser] = useState(null);
  const [newGuest, setNewGuest] = useState({ first_name: '', last_name: '', table_number: '', dietary_requirements: '' });
  const [newTimeline, setNewTimeline] = useState({ event_time: '', title: '', location: '', sort_order: '' });
  const [newMenu, setNewMenu] = useState({ course_type: 'starter', dish_name: '', description: '' });
  const [passwordData, setPasswordData] = useState({ userId: '', newPassword: '' });
  
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [galleryPhotoPreview, setGalleryPhotoPreview] = useState(null);

  useEffect(() => {
    if (router.query?.role) {
      setRole(router.query.role === 'user' ? 'user' : 'admin');
    }
  }, [router.query?.role]);

  useEffect(() => {
    const storedUser = localStorage.getItem('everafter_admin_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setRole(user.role);
        setLoggedIn(true);
        loadEvents(user);
        if (user.role === 'admin') loadUsers();
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedEvent?.id) return;
    const channel = supabase.channel(`public:admin-${selectedEvent.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${selectedEvent.id}` }, () => loadGuests(selectedEvent.id, true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_items', filter: `event_id=eq.${selectedEvent.id}` }, () => loadTimeline(selectedEvent.id, true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items', filter: `event_id=eq.${selectedEvent.id}` }, () => loadMenu(selectedEvent.id, true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos', filter: `event_id=eq.${selectedEvent.id}` }, () => loadPhotos(selectedEvent.id, true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook', filter: `event_id=eq.${selectedEvent.id}` }, () => loadMessages(selectedEvent.id, true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_chat_messages', filter: `event_id=eq.${selectedEvent.id}` }, () => loadLiveChat(selectedEvent.id))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEvent?.id]);

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
      localStorage.setItem('everafter_admin_user', JSON.stringify(user));
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
    const allEvents = data || [];
    setEvents(allEvents.filter(e => !e.is_deleted));
    setDeletedEvents(allEvents.filter(e => e.is_deleted));
    setIsLoading(false);
  };

  const deleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event? It will be moved to the Recycle Bin.')) return;
    await supabase.from('events').update({ is_deleted: true }).eq('id', id);
    loadEvents();
  };

  const restoreEvent = async (id) => {
    await supabase.from('events').update({ is_deleted: false }).eq('id', id);
    loadEvents();
  };

  const permanentlyDeleteEvent = async (id) => {
    if (!confirm('Are you SURE you want to permanently delete this event? This cannot be undone.')) return;
    await supabase.from('events').delete().eq('id', id);
    loadEvents();
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

  const loadLiveChat = async (eventId) => {
    const { data } = await supabase.from('live_chat_messages').select('*').eq('event_id', eventId).order('created_at', { ascending: true });
    setLiveChat(data || []);
  };


  const selectEvent = (event) => {
    setSelectedEvent(event);
    loadGuests(event.id);
    loadTimeline(event.id);
    loadMenu(event.id);
    loadPhotos(event.id);
    loadMessages(event.id);
    loadLiveChat(event.id);
    setShowEventForm(false);
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
        setNewEvent({ event_type: 'wedding', event_name: '', host_name: '', event_date: '', venue: '', slug: '', assigned_user_id: '', background_theme: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=80', cover_photo: '', number_of_tables: 10, chairs_per_table: 10 });
        setPreviewCover(null);
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
      first_name: newGuest.first_name,
      last_name: newGuest.last_name,
      table_number: parseInt(newGuest.table_number),
      dietary_requirements: newGuest.dietary_requirements 
    });
    if (!error) { 
      setShowGuestForm(false); 
      setNewGuest({ first_name: '', last_name: '', table_number: '', dietary_requirements: '' }); 
      loadGuests(selectedEvent.id); 
    } else {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  const updateGuestTableNumber = async (guestId) => {
    setIsLoading(true);
    const { error } = await supabase.from('guests').update({ table_number: parseInt(editGuestTable) }).eq('id', guestId);
    if (!error) {
      setEditingGuestId(null);
      setEditGuestTable('');
      loadGuests(selectedEvent.id);
    } else {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  const toggleGuestReserved = async (guestId, currentStatus) => {
    setIsLoading(true);
    const { error } = await supabase.from('guests').update({ is_reserved: !currentStatus }).eq('id', guestId);
    if (!error) {
      loadGuests(selectedEvent.id);
    } else {
      alert('Error: ' + error.message);
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
    }
  };

  const approvePhoto = async (id, approved) => {
    await supabase.from('photos').update({ is_approved: approved }).eq('id', id);
    if (selectedEvent) loadPhotos(selectedEvent.id);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGalleryPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const confirmGalleryPhotoUpload = async () => {
    if (!selectedEvent || !galleryPhotoPreview) return;
    setUploadingPhoto(true);
    const { error: dbError } = await supabase.from('photos').insert({
      event_id: selectedEvent.id,
      image_url: galleryPhotoPreview,
      caption: photoCaption,
      uploaded_by: currentUser?.full_name || 'Admin',
      is_approved: true
    });

    if (!dbError) {
      setPhotoCaption('');
      setGalleryPhotoPreview(null);
      loadPhotos(selectedEvent.id);
    } else {
      alert('Error saving photo record: ' + dbError.message);
    }
    setUploadingPhoto(false);
  };
  
  const cancelGalleryPhotoUpload = () => {
    setGalleryPhotoPreview(null);
    setPhotoCaption('');
  };

  if (!loggedIn) {
    return (
      <div className="login-background" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <h2 style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '8px', fontSize: '28px' }}>EverAfter Hub</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px', fontSize: '14px' }}>User Login Workspace</p>
          <form onSubmit={handleLogin}>
            <div className="floating-input-group">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " id="login-email" required />
              <label htmlFor="login-email">Email</label>
            </div>
            <div className="floating-input-group">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " id="login-password" required />
              <label htmlFor="login-password">Password</label>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              style={{ width: '100%', background: roleTheme.primary, color: 'white', padding: '16px', borderRadius: '9999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer', marginTop: '8px' }}
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  const adminBaseTabs = ['events', 'users', 'recycle', 'danger'];
  const userBaseTabs = ['events'];
  const baseTabs = isAdmin ? adminBaseTabs : userBaseTabs;
  const eventTabs = ['guests', 'timeline', 'menu', 'photos', 'messages', 'analytics', 'table_planner', 'photo_queue', 'live_chat', 'reports'];
  const tabs = selectedEvent ? [...baseTabs, ...eventTabs] : baseTabs;

  const handleTabClick = (tab) => {
    if (tab === 'events' || tab === 'users' || tab === 'recycle' || tab === 'danger') {
      setSelectedEvent(null);
    }
    setActiveTab(tab);
  };

  const getTabCount = (tab) => {
    if (!selectedEvent) return 0;
    switch(tab) {
      case 'guests': return guests.length;
      case 'timeline': return timeline.length;
      case 'menu': return menu.length;
      case 'photos': return photos.length;
      case 'messages': return messages.length;

      default: return 0;
    }
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'var(--fluid-font-lg)', margin: 0 }}>✨ EverAfter {isAdmin ? 'Admin' : 'User'}</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '11px' }}>{roleTheme.description}</p>
        </motion.div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: roleTheme.accent, background: roleTheme.glow, border: `1px solid ${roleTheme.accent}22`, padding: '4px 8px', borderRadius: '999px', fontWeight: 600 }}>{roleTheme.badge}</span>
          <button onClick={() => { setPasswordData({ userId: currentUser?.id, newPassword: '' }); setShowPasswordForm(true); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: roleTheme.primary, color: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(244,63,94,0.3)' }} title="Change Password"><Key size={18} strokeWidth={2.5} /></button>
          <button onClick={() => { setLoggedIn(false); localStorage.removeItem('everafter_admin_user'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }} title="Logout"><LogOut size={18} strokeWidth={2.5} /></button>
        </div>
      </header>

      {isLoading && <FullPageLoader text="Loading Workspace..." />}

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
                <button type="submit" style={{ flex: 1, background: '#f59e0b', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Update</button>
                <button type="button" onClick={() => setShowPasswordForm(false)} style={{ flex: 1, background: '#e5e7eb', color: '#4b5563', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="dashboard-nav hide-scrollbar">
        {selectedEvent && (
          <div style={{ marginBottom: '16px', padding: '8px', background: 'linear-gradient(to right, #f43f5e, #ec4899)', borderRadius: '12px', textAlign: 'center', color: 'white', boxShadow: '0 4px 10px rgba(244,63,94,0.2)' }}>
            <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>Managing Event</p>
            <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedEvent.event_name}</p>
          </div>
        )}
        <div className="nav-items-container">
          {tabs.map(tab => (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={tab} 
              onClick={() => handleTabClick(tab)} 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', borderRadius: '12px', cursor: 'pointer', background: activeTab === tab ? roleTheme.glow : 'white', color: activeTab === tab ? roleTheme.accent : '#4b5563', position: 'relative', border: activeTab === tab ? `2px solid ${roleTheme.accent}` : '1px solid #e5e7eb', boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <span style={{ fontSize: '20px', marginBottom: '4px' }}>
                {tab === 'events' && '🎉'}{tab === 'users' && '👤'}{tab === 'guests' && '👥'}{tab === 'timeline' && '⏱'}{tab === 'menu' && '🍽'}{tab === 'photos' && '📸'}{tab === 'messages' && '💬'}
                {tab === 'analytics' && '📊'}{tab === 'table_planner' && '🏷️'}{tab === 'photo_queue' && '📸'}{tab === 'live_chat' && '💬'}{tab === 'reports' && '📄'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{tab.replace('_', ' ')}</span>
              {selectedEvent && eventTabs.includes(tab) && getTabCount(tab) > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '10px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {getTabCount(tab)}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      <main className="dashboard-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
          
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
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>Number of Tables</label>
                      <input type="number" value={newEvent.number_of_tables} onChange={(e) => setNewEvent({...newEvent, number_of_tables: parseInt(e.target.value)})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required min="1" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>Chairs per Table</label>
                      <input type="number" value={newEvent.chairs_per_table} onChange={(e) => setNewEvent({...newEvent, chairs_per_table: parseInt(e.target.value)})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required min="1" />
                    </div>
                    
                    <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>Background Theme</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        {[
                          { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=80', label: 'Wedding' },
                          { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1920&q=80', label: 'Gala' },
                          { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80', label: 'Party' },
                          { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80', label: 'Corporate' },
                          { url: 'https://images.unsplash.com/photo-1530103862676-de8892bf309c?auto=format&fit=crop&w=1920&q=80', label: 'Birthday' },
                        ].map((theme, i) => (
                          <div 
                            key={i}
                            onClick={() => setNewEvent({...newEvent, background_theme: theme.url})}
                            style={{
                              height: '80px',
                              borderRadius: '8px',
                              backgroundImage: `url(${theme.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              cursor: 'pointer',
                              border: newEvent.background_theme === theme.url ? '3px solid #f43f5e' : '3px solid transparent',
                              boxShadow: newEvent.background_theme === theme.url ? '0 0 10px rgba(244,63,94,0.5)' : 'none',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>
                              {theme.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: '1/-1' }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>Cover Photo (Optional)</label>
                      <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                      {uploadingCover && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f43f5e', fontWeight: 600 }}><Spinner size="16px" /> Processing...</span>}
                      {previewCover && !newEvent.cover_photo && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                          <img src={previewCover} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={confirmCoverUpload} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Upload & Save Photo</button>
                            <button onClick={cancelCoverUpload} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {newEvent.cover_photo && <span style={{ fontSize: '12px', color: '#10b981' }}>Cover photo added!</span>}
                    </div>

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
                    {isAdmin && <button onClick={() => deleteEvent(event.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Delete</button>}
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
              </div>
              {users.map(user => {
                const managingEvents = events.filter(e => e.user_id === user.id);
                const eventNames = managingEvents.map(e => e.event_name).join(', ') || 'No events assigned';
                return (
                  <div key={user.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{user.full_name} <span style={{fontSize:'12px', color:'#9ca3af', fontWeight: 400}}>({user.role})</span></p>
                      <p style={{ color: '#4b5563', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 500 }}>Events: {eventNames}</p>
                      <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>{user.email} • {user.phone || 'N/A'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => deleteUser(user.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'recycle' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Recycle Bin</h2>
              </div>
              {deletedEvents.length === 0 && <p style={{ color: '#6b7280', fontSize: '14px' }}>No deleted events.</p>}
              {deletedEvents.map(event => (
                <div key={event.id} style={{ background: '#fff1f2', padding: '16px', borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #fecdd3' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0, color: '#9f1239' }}>{event.event_name}</p>
                      <p style={{ color: '#be123c', fontSize: '13px', margin: '4px 0 0 0' }}>{event.event_type} • {new Date(event.event_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => restoreEvent(event.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Restore</button>
                    <button onClick={() => permanentlyDeleteEvent(event.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Delete Permanently</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'danger' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#ef4444' }}>Danger Zone</h2>
              </div>
              
              <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '12px', border: '2px solid #ef4444', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>Reset App</h3>
                <p style={{ fontSize: '13px', color: '#991b1b', marginBottom: '10px' }}>Permanently wipes all events, users (except you), guests, photos, and messages.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Type 'deleteeverything' to confirm" value={dangerInput.everything} onChange={(e) => setDangerInput({...dangerInput, everything: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #fca5a5' }} />
                  <button onClick={async () => { if (dangerInput.everything === 'deleteeverything') { if(confirm('Are you absolutely sure?')) { await fetch('/api/admin/danger', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'deleteeverything', adminId: currentUser.id}) }); alert('App Reset'); window.location.reload(); } } else alert('Type exact confirmation string.'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Execute</button>
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #fca5a5', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>Delete All Events</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Type 'deleteevents'" value={dangerInput.events} onChange={(e) => setDangerInput({...dangerInput, events: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <button onClick={async () => { if (dangerInput.events === 'deleteevents') { await fetch('/api/admin/danger', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'deleteevents'}) }); alert('Events Deleted'); loadEvents(); setDangerInput({...dangerInput, events: ''}); } else alert('Type exact confirmation string.'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Execute</button>
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #fca5a5', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>Delete All Users</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Type 'deleteusers'" value={dangerInput.users} onChange={(e) => setDangerInput({...dangerInput, users: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <button onClick={async () => { if (dangerInput.users === 'deleteusers') { await fetch('/api/admin/danger', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'deleteusers', adminId: currentUser.id}) }); alert('Users Deleted'); loadUsers(); setDangerInput({...dangerInput, users: ''}); } else alert('Type exact confirmation string.'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Execute</button>
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #fca5a5' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>Delete Guests</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select value={dangerInput.targetEventId} onChange={(e) => setDangerInput({...dangerInput, targetEventId: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <option value="all">All Guests (Platform-wide)</option>
                    {events.map(e => <option key={e.id} value={e.id}>Guests in: {e.event_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Type 'deleteguests'" value={dangerInput.guests} onChange={(e) => setDangerInput({...dangerInput, guests: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <button onClick={async () => { if (dangerInput.guests === 'deleteguests') { await fetch('/api/admin/danger', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'deleteguests', eventId: dangerInput.targetEventId}) }); alert('Guests Deleted'); setDangerInput({...dangerInput, guests: ''}); } else alert('Type exact confirmation string.'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Execute</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guests' && selectedEvent && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Guests — {selectedEvent.event_name}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/rsvp/new/${selectedEvent.id}`); alert('Event RSVP link copied! Send this to all guests.'); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#e0e7ff', color: '#4f46e5', fontWeight: 600 }}>🔗 Copy Event RSVP Link</button>
                  <button onClick={() => setShowGuestForm(!showGuestForm)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', fontWeight: 600 }}>+ Add Guest</button>
                </div>
              </div>
              {showGuestForm && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                  <form onSubmit={addGuest} style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                    <input placeholder="First Name" value={newGuest.first_name} onChange={(e) => setNewGuest({...newGuest, first_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Surname" value={newGuest.last_name} onChange={(e) => setNewGuest({...newGuest, last_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Table Number" type="number" value={newGuest.table_number} onChange={(e) => setNewGuest({...newGuest, table_number: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
                    <input placeholder="Dietary (optional)" value={newGuest.dietary_requirements} onChange={(e) => setNewGuest({...newGuest, dietary_requirements: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                    <button type="submit" style={{ gridColumn: '1/-1', background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Add Guest</button>
                  </form>
                </div>
              )}
              {guests.map(guest => (
                <div key={guest.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{guest.first_name} {guest.last_name}</span>
                      {editingGuestId === guest.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="number" value={editGuestTable} onChange={(e) => setEditGuestTable(e.target.value)} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                          <button onClick={() => updateGuestTableNumber(guest.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Save</button>
                          <button onClick={() => setEditingGuestId(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Cancel</button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditingGuestId(guest.id); setEditGuestTable(guest.table_number); }} style={{ color: '#6b7280', fontSize: '13px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', cursor: 'pointer' }} title="Click to edit table">Table {guest.table_number} ✎</span>
                      )}
                      {guest.is_reserved && <span style={{ background: '#4c1d95', color: '#ede9fe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Reserved</span>}
                      {guest.dietary_requirements && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{guest.dietary_requirements}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                      <span><strong style={{color:'#374151'}}>Token:</strong> {guest.guest_token ? guest.guest_token.substring(0,6).toUpperCase() : 'N/A'}</span>
                      <span><strong style={{color:'#374151'}}>RSVP:</strong> <span style={{ color: guest.rsvp_status === 'attending' ? '#10b981' : guest.rsvp_status === 'declined' ? '#ef4444' : '#f59e0b', fontWeight: 600, textTransform: 'capitalize' }}>{guest.rsvp_status || 'pending'}</span></span>
                      <span><strong style={{color:'#374151'}}>Checked In:</strong> {guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleTimeString() : 'No'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => toggleGuestReserved(guest.id, guest.is_reserved)} style={{ background: guest.is_reserved ? '#ede9fe' : '#f3f4f6', color: guest.is_reserved ? '#5b21b6' : '#4b5563', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>{guest.is_reserved ? 'Unreserve' : 'Reserve'}</button>
                    <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/rsvp/${guest.guest_token}`); alert('RSVP link copied!'); }} style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>🔗 Copy RSVP</button>
                    <button onClick={() => deleteItem('guests', guest.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Delete</button>
                  </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Photos — {selectedEvent.event_name}</h2>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h4 style={{ marginBottom: '12px' }}>Upload New Photo</h4>
                {!galleryPhotoPreview ? (
                  <div>
                    <label style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-block' }}>
                      Choose Photo
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                    </label>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                    <img src={galleryPhotoPreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <input type="text" placeholder="Caption (optional)" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <button onClick={confirmGalleryPhotoUpload} disabled={uploadingPhoto} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: uploadingPhoto ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                        {uploadingPhoto ? <><Spinner size="18px" /> Uploading...</> : 'Upload & Save'}
                      </button>
                      <button onClick={cancelGalleryPhotoUpload} disabled={uploadingPhoto} style={{ flex: 1, background: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: uploadingPhoto ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {photos.filter(p => p.is_approved).map(photo => (
                  <div key={photo.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <div style={{ padding: '10px' }}><p style={{ fontSize: '12px', margin: '0 0 8px 0' }}>{photo.caption || 'No caption'} — {photo.uploaded_by}</p><div style={{ display: 'flex', gap: '6px' }}><button onClick={() => approvePhoto(photo.id, false)} style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Unapprove</button><button onClick={() => deleteItem('photos', photo.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Delete</button></div></div>
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

          {activeTab === 'analytics' && selectedEvent && (
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Event Analytics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#1f2937', fontFamily: 'Playfair Display, serif' }}>{guests.length}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Invited</p>
                </div>
                
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#10b981', fontFamily: 'Playfair Display, serif' }}>{guests.filter(g => g.rsvp_status === 'attending').length}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Attending</p>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#f59e0b', fontFamily: 'Playfair Display, serif' }}>{guests.filter(g => g.checked_in_at).length}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Checked In</p>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#f43f5e', fontFamily: 'Playfair Display, serif' }}>{photos.length}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Photos Uploaded</p>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#8b5cf6', fontFamily: 'Playfair Display, serif' }}>{messages.length}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Guestbook Messages</p>
                </div>

              </div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#1f2937' }}>Dietary Requirements Overview</h3>
                <ul style={{ paddingLeft: '20px', color: '#4b5563', lineHeight: 1.6 }}>
                  {guests.filter(g => g.dietary_requirements).length > 0 ? (
                    guests.filter(g => g.dietary_requirements).map(g => (
                      <li key={g.id}><strong>{g.first_name} {g.last_name}:</strong> {g.dietary_requirements} (Table {g.table_number})</li>
                    ))
                  ) : (
                    <li>No dietary requirements reported.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'table_planner' && selectedEvent && (
            <div><h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Table Planner</h2><p>Drag-and-drop seating chart coming soon...</p></div>
          )}
          {activeTab === 'photo_queue' && selectedEvent && (
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Photo Moderation Queue</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {photos.filter(p => !p.is_approved).map(photo => (
                  <div key={photo.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <div style={{ padding: '10px' }}>
                      <p style={{ fontSize: '12px', margin: '0 0 8px 0' }}>{photo.caption || 'No caption'} — {photo.uploaded_by}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => approvePhoto(photo.id, true)} style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Approve</button>
                        <button onClick={() => deleteItem('photos', photo.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Reject & Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {photos.filter(p => !p.is_approved).length === 0 && <p style={{ color: '#6b7280' }}>All photos are approved! Queue is empty.</p>}
              </div>
            </div>
          )}
          {activeTab === 'live_chat' && selectedEvent && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', margin: 0 }}>Live Chat Support</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>Chat directly with guests in real-time.</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {liveChat.map(msg => (
                  <div key={msg.id} style={{ alignSelf: msg.is_admin ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px 4px', textAlign: msg.is_admin ? 'right' : 'left' }}>{msg.sender_name}</p>
                    <div style={{ background: msg.is_admin ? '#f43f5e' : '#f3f4f6', color: msg.is_admin ? 'white' : '#1f2937', padding: '12px 16px', borderRadius: '16px', borderBottomRightRadius: msg.is_admin ? '4px' : '16px', borderBottomLeftRadius: msg.is_admin ? '16px' : '4px' }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={addLiveChatMessage} style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Type your message..." value={newLiveChatMessage} onChange={(e) => setNewLiveChatMessage(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '9999px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }} />
                <button type="submit" style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', border: 'none', padding: '0 24px', borderRadius: '9999px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
              </form>
            </div>
          )}
          {activeTab === 'reports' && selectedEvent && (
            <div><h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Export Reports</h2><p>Guest list, dietary summary, seating chart coming soon...</p></div>
          )}

          {['guests','timeline','menu','photos','messages','analytics','table_planner','photo_queue','live_chat','reports'].includes(activeTab) && !selectedEvent && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}><p style={{ fontSize: '40px' }}>👈</p><p>Select an event from the Events tab first</p></div>
          )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}