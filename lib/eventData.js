import event1 from '../data/event1.json';

const events = {
  'sarah-james-2026': event1,
};

export function getEventData(id) {
  return events[id] || null;
}