export function lookupGuest(guests, name) {
  return guests.find(
    (g) => g.name.toLowerCase() === name.toLowerCase()
  );
}