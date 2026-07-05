import PhotoGallery from './PhotoGallery';
import Timeline from './Timeline';
import Menu from './Menu';
import Guestbook from './Guestbook';


export default function DashboardTabs({ event, activeTab, name }) {
  const eventId = event?.eventId || event?.id;

  switch (activeTab) {
    case 'photos':
      return <PhotoGallery event={event} eventId={eventId} />;
    case 'timeline':
      return <Timeline timeline={event.timeline} />;
    case 'menu':
      return <Menu menu={event.menu} />;
    case 'guestbook':
      return <Guestbook name={name} eventId={eventId} />;
    default:
      return (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>👆</p>
          <p>Select a tab above to explore</p>
        </div>
      );
  }
}