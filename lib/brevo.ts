const BREVO_BASE_URL = process.env.BREVO_BASE_URL ?? 'https://api.brevo.com/v3';

export type BrevoListIds = {
  users: number;
  customers: number;
  newsletter: number;
};

export type BrevoConfig = {
  apiKey: string;
  baseUrl: string;
  listIds: BrevoListIds;
};

function parseListId(value: string | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const n = parseInt(value.trim(), 10);
  return Number.isNaN(n) ? null : n;
}

export function getBrevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;

  const users = parseListId(process.env.BREVO_LIST_USERS);
  const customers = parseListId(process.env.BREVO_LIST_CUSTOMERS);
  const newsletter = parseListId(process.env.BREVO_LIST_NEWSLETTER);

  if (users == null || customers == null || newsletter == null) return null;

  return {
    apiKey,
    baseUrl: BREVO_BASE_URL,
    listIds: { users, customers, newsletter },
  };
}

export type BrevoContactAttributes = {
  FIRSTNAME?: string;
  LASTNAME?: string;
  SOURCE?: string;
  PLAN?: string;
  NEWSLETTER_OPT_IN?: string;
};

async function brevoFetch(
  config: BrevoConfig,
  path: string,
  options: { method?: string; body?: object } = {}
): Promise<{ ok: boolean; status: number; body?: unknown }> {
  const { method = 'GET', body } = options;
  const url = `${config.baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      'api-key': config.apiKey,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let responseBody: unknown;
  const ct = res.headers.get('content-type');
  if (ct?.includes('application/json')) {
    try {
      responseBody = await res.json();
    } catch {
      responseBody = undefined;
    }
  }

  if (!res.ok) {
    console.error('[Brevo]', path, res.status, responseBody);
    return { ok: false, status: res.status, body: responseBody };
  }
  return { ok: true, status: res.status, body: responseBody };
}

export async function upsertBrevoContact(
  email: string,
  attributes?: BrevoContactAttributes
): Promise<void> {
  const config = getBrevoConfig();
  if (!config) return;

  const body: Record<string, unknown> = {
    email: email.toLowerCase().trim(),
    updateEnabled: true,
  };
  if (attributes && Object.keys(attributes).length > 0) {
    body.attributes = attributes;
  }

  await brevoFetch(config, '/contacts', { method: 'POST', body });
}

export async function addContactToBrevoLists(email: string, listIds: number[]): Promise<void> {
  const config = getBrevoConfig();
  if (!config) return;

  const normalized = email.toLowerCase().trim();
  for (const listId of listIds) {
    const { ok } = await brevoFetch(config, `/contacts/lists/${listId}/contacts/add`, {
      method: 'POST',
      body: { emails: [normalized] },
    });
    if (!ok) break;
  }
}

export async function removeContactFromBrevoLists(email: string, listIds: number[]): Promise<void> {
  const config = getBrevoConfig();
  if (!config) return;

  const normalized = email.toLowerCase().trim();
  for (const listId of listIds) {
    await brevoFetch(config, `/contacts/lists/${listId}/contacts/remove`, {
      method: 'POST',
      body: { emails: [normalized] },
    });
  }
}

export async function syncFreeUserToBrevo(
  email: string,
  attributes?: BrevoContactAttributes
): Promise<void> {
  try {
    const config = getBrevoConfig();
    if (!config) return;
    await upsertBrevoContact(email, attributes);
    await addContactToBrevoLists(email, [config.listIds.users]);
  } catch (err) {
    console.error('[Brevo] syncFreeUserToBrevo failed:', err);
  }
}

export async function syncPaidCustomerToBrevo(
  email: string,
  attributes?: BrevoContactAttributes
): Promise<void> {
  try {
    const config = getBrevoConfig();
    if (!config) return;
    await upsertBrevoContact(email, attributes);
    await addContactToBrevoLists(email, [config.listIds.users, config.listIds.customers]);
  } catch (err) {
    console.error('[Brevo] syncPaidCustomerToBrevo failed:', err);
  }
}

export async function syncNewsletterSubscriberToBrevo(
  email: string,
  attributes?: BrevoContactAttributes
): Promise<void> {
  try {
    const config = getBrevoConfig();
    if (!config) return;
    await upsertBrevoContact(email, { ...attributes, NEWSLETTER_OPT_IN: 'true' });
    await addContactToBrevoLists(email, [config.listIds.newsletter]);
  } catch (err) {
    console.error('[Brevo] syncNewsletterSubscriberToBrevo failed:', err);
  }
}

export async function unsubscribeNewsletterInBrevo(email: string): Promise<void> {
  try {
    const config = getBrevoConfig();
    if (!config) return;
    await removeContactFromBrevoLists(email, [config.listIds.newsletter]);
  } catch (err) {
    console.error('[Brevo] unsubscribeNewsletterInBrevo failed:', err);
  }
}

export async function removeContactFromBrevoCustomers(email: string): Promise<void> {
  try {
    const config = getBrevoConfig();
    if (!config) return;
    await removeContactFromBrevoLists(email, [config.listIds.customers]);
  } catch (err) {
    console.error('[Brevo] removeContactFromBrevoCustomers failed:', err);
  }
}

export function brevoContactAttributesFromDisplayName(displayName: string | null): BrevoContactAttributes | undefined {
  if (!displayName?.trim()) return undefined;
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return { FIRSTNAME: parts[0] };
  return {
    FIRSTNAME: parts[0],
    LASTNAME: parts.slice(1).join(' '),
  };
}
