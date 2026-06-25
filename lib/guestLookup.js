export function lookupGuest(guests, firstName, lastName) {
  const fName = (firstName || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const lName = (lastName || '').replace(/\s+/g, ' ').trim().toLowerCase();

  return guests.find(g => {
    const gFirst = (g.firstName || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const gLast = (g.lastName || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return gFirst === fName && gLast === lName;
  });
}