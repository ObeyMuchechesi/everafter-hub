export function lookupGuest(guests, fullName) {
  // Try exact match first
  let match = guests.find(g => g.name.toLowerCase() === fullName.toLowerCase());
  if (match) return match;

  // Try more robust matching (ignore extra spaces)
  const normSearch = fullName.replace(/\s+/g, ' ').trim().toLowerCase();
  match = guests.find(g => g.name.replace(/\s+/g, ' ').trim().toLowerCase() === normSearch);
  
  return match;
}