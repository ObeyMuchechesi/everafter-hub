import PhotoGallery from './PhotoGallery';
import Timeline from './Timeline';
import Menu from './Menu';
import Guestbook from './Guestbook';
import SongRequests from './SongRequests';

export default function DashboardTabs({ event, activeTab, name }) {
  switch (activeTab) {
    case 'photos':
      return <PhotoGallery event={event} />;
    case 'timeline':
      return <Timeline timeline={event.timeline} />;
    case 'menu':
      return <Menu menu={event.menu} />;
    case 'guestbook':
      return <Guestbook name={name} />;
    case 'requests':
      return <SongRequests name={name} />;
    default:
      return (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>👆</p>
          <p>Select a tab above to explore</p>
        </div>
      );
  }
}