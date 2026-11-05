/** Artwork reused from Dave's LTx pack; IDs are resolved from Deliverect, never guessed. */
export const brands = [
  ['deliveroo', 'Deliveroo'], ['uber-eats', 'Uber Eats'], ['just-eat', 'Just Eat'],
  ['doordash', 'DoorDash'], ['wolt', 'Wolt'], ['glovo', 'Glovo'],
  ['snappy-shopper', 'Snappy Shopper'], ['thuisbezorgd', 'Thuisbezorgd'],
  ['lieferando', 'Lieferando'], ['takeaway', 'Takeaway'], ['grubhub', 'Grubhub'],
  ['uber-direct', 'Uber Direct'], ['jet-go', 'JET Go'],
] as const;
export function brandFor(name: string) {
  const normalized = name.toLowerCase().replace(/\.(com|nl|de)$/g, '').replace(/[^a-z0-9]/g, '');
  return brands.find(([id, label]) => [id, label].some(v => v.replace(/[^a-z0-9]/gi, '').toLowerCase() === normalized));
}
export function channelIdentity(id: string | number, channels: {channelId: string | number; name: string}[]) {
  const raw = channels.find(c => String(c.channelId) === String(id));
  const brand = raw && brandFor(raw.name);
  return { id: String(id), name: brand?.[1] || raw?.name || `Channel ${id}`, icon: brand ? `/brand/channels/${brand[0]}.png` : null };
}
