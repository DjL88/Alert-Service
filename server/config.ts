import type {Profile} from './model.ts';
export const DEFAULT_PILOT_PROFILES: Profile[] = [
  {
    id: 'pilot-screen',
    tenantId: 'tenant-artisan',
    accountId: 'deliv-acc-artisan-88',
    provider: 'screen',
    environment: 'staging',
    adminToken: 'adm-token-artisan-screen-pilot-2026',
    webhookSecret: 'sec-wh-artisan-screen-pilot-2026',
    reportingSecret: 'sec-rep-artisan-screen-pilot-2026',
  },
  {
    id: 'pilot-vocovo',
    tenantId: 'tenant-artisan',
    accountId: 'deliv-acc-artisan-88',
    provider: 'vocovo',
    environment: 'staging',
    adminToken: 'adm-token-artisan-screen-pilot-2026',
    webhookSecret: 'sec-wh-artisan-vocovo-pilot-2026',
    reportingSecret: 'sec-rep-artisan-vocovo-pilot-2026',
  },
];

export function loadProfiles(): Profile[] {
  let parsed: Profile[] = [];
  if (process.env.INTEGRATIONS_JSON && process.env.INTEGRATIONS_JSON.trim()) {
    parsed = JSON.parse(process.env.INTEGRATIONS_JSON);
  } else {
    parsed = DEFAULT_PILOT_PROFILES;
  }
  const profiles: Profile[] = parsed;
  const seen = new Set<string>();
  for (const p of profiles) {
    if (!/^[a-z0-9-]{1,80}$/.test(p.id) || seen.has(p.id)) throw new Error('Invalid or duplicate integration ID');
    seen.add(p.id);
    if (!p.tenantId || !p.accountId || !['vocovo', 'screen'].includes(p.provider) || !['staging', 'production'].includes(p.environment)) throw new Error('Incomplete integration profile');
    if ([p.adminToken, p.webhookSecret, p.reportingSecret].some(v => typeof v !== 'string' || v.length < 24)) throw new Error('Each profile requires three strong server-side secrets (24+ characters)');
    for (const value of Object.values(p.statusMap || {})) if (!['waiting','picking','ready','completed','cancelled','scheduled','unknown'].includes(value)) throw new Error('Invalid status mapping');
  }
  // Same source account/environment must not be assigned to two tenants.
  for (const p of profiles) for (const other of profiles) {
    if (p.accountId === other.accountId && p.environment === other.environment && p.tenantId !== other.tenantId) throw new Error('Account assigned to multiple tenants');
    if (p.tenantId === other.tenantId && (p.accountId !== other.accountId || p.environment !== other.environment)) throw new Error('Pilot tenant must have one account/environment');
    if (p.tenantId !== other.tenantId && p.adminToken === other.adminToken) throw new Error('Admin token reused across tenants');
  }
  return profiles;
}
