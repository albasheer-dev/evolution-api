import { Contact } from 'baileys';

export type ContactNameSource =
  | 'phonebook'
  | 'verified_business'
  | 'whatsapp_push'
  | 'username'
  | 'legacy'
  | 'identifier';

export type ExtendedBaileysContact = Partial<Contact> & {
  id?: string;
  lid?: string;
  phoneNumber?: string;
  username?: string;
};

export type ContactIdentity = {
  remoteJid: string;
  canonicalJid: string;
  phoneNumberJid?: string;
  lidJid?: string;
  phonebookName?: string;
  whatsappPushName?: string;
  verifiedName?: string;
  username?: string;
  pushName: string;
  nameSource: ContactNameSource;
  isMyContact?: boolean;
  profilePicUrl?: string | null;
  lastSyncedAt: Date;
};

export type StoredContactIdentity = Partial<Omit<ContactIdentity, 'lastSyncedAt'>> & {
  remoteJid: string;
  lastSyncedAt?: Date | null;
};

const PERSON_JID_SUFFIXES = ['@s.whatsapp.net', '@c.us', '@lid'];

function cleanValue(value?: string | null, maxLength = 255): string | undefined {
  const cleaned = value?.trim();

  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function normalizeJid(value?: string | null): string | undefined {
  const jid = cleanValue(value, 100)?.toLowerCase();

  if (!jid) {
    return undefined;
  }

  if (jid.endsWith('@c.us')) {
    return `${jid.slice(0, -5)}@s.whatsapp.net`;
  }

  return jid;
}

function isPersonJid(jid?: string): boolean {
  return !!jid && PERSON_JID_SUFFIXES.some((suffix) => jid.endsWith(suffix));
}

function selectDisplayName(identity: {
  remoteJid: string;
  phonebookName?: string;
  verifiedName?: string;
  whatsappPushName?: string;
  username?: string;
  pushName?: string;
  nameSource?: ContactNameSource;
}): { pushName: string; nameSource: ContactNameSource } {
  if (identity.phonebookName) {
    return { pushName: identity.phonebookName, nameSource: 'phonebook' };
  }

  if (identity.verifiedName) {
    return { pushName: identity.verifiedName, nameSource: 'verified_business' };
  }

  if (identity.whatsappPushName) {
    return { pushName: identity.whatsappPushName, nameSource: 'whatsapp_push' };
  }

  if (identity.username) {
    return { pushName: identity.username, nameSource: 'username' };
  }

  if (identity.pushName) {
    return { pushName: identity.pushName, nameSource: identity.nameSource ?? 'legacy' };
  }

  return { pushName: identity.remoteJid.split('@')[0], nameSource: 'identifier' };
}

export function normalizeContactIdentity(
  contact: ExtendedBaileysContact,
  syncedAt = new Date(),
): ContactIdentity | null {
  const remoteJid = normalizeJid(contact.id);

  if (!remoteJid) {
    return null;
  }

  const phoneNumberJid = normalizeJid(
    contact.phoneNumber ?? (remoteJid.endsWith('@s.whatsapp.net') ? remoteJid : undefined),
  );
  const lidJid = normalizeJid(contact.lid ?? (remoteJid.endsWith('@lid') ? remoteJid : undefined));
  const canonicalJid = phoneNumberJid ?? lidJid ?? remoteJid;
  const phonebookName = cleanValue(contact.name);
  const whatsappPushName = cleanValue(contact.notify);
  const verifiedName = cleanValue(contact.verifiedName);
  const username = cleanValue(contact.username, 100);
  const profilePicUrl =
    contact.imgUrl === null
      ? null
      : contact.imgUrl && contact.imgUrl !== 'changed'
        ? cleanValue(contact.imgUrl, 500)
        : undefined;
  const display = selectDisplayName({
    remoteJid,
    phonebookName,
    verifiedName,
    whatsappPushName,
    username,
  });

  return {
    remoteJid,
    canonicalJid,
    phoneNumberJid,
    lidJid,
    phonebookName,
    whatsappPushName,
    verifiedName,
    username,
    pushName: display.pushName,
    nameSource: display.nameSource,
    isMyContact: isPersonJid(remoteJid) && phonebookName ? true : undefined,
    profilePicUrl,
    lastSyncedAt: syncedAt,
  };
}

export function normalizeContactIdentities(
  contacts: ExtendedBaileysContact[],
  syncedAt = new Date(),
): ContactIdentity[] {
  const identities = new Map<string, ContactIdentity>();
  const identityGroups = new Map<string, string>();

  for (const contact of contacts) {
    const identity = normalizeContactIdentity(contact, syncedAt);

    if (!identity || identity.remoteJid === 'status@broadcast') {
      continue;
    }

    const matchingGroups = [
      ...new Set(
        contactIdentityKeys(identity)
          .map((key) => identityGroups.get(key))
          .filter(Boolean),
      ),
    ] as string[];
    const groupKey = matchingGroups[0] ?? identity.canonicalJid;
    let merged = identity;

    for (const matchingGroup of matchingGroups) {
      const existing = identities.get(matchingGroup);
      if (existing) {
        merged = mergeContactIdentity(existing, merged);
      }

      if (matchingGroup !== groupKey) {
        identities.delete(matchingGroup);
      }
    }

    if (matchingGroups.length > 1) {
      for (const [alias, matchingGroup] of identityGroups) {
        if (matchingGroups.includes(matchingGroup)) {
          identityGroups.set(alias, groupKey);
        }
      }
    }

    identities.set(groupKey, merged);
    for (const key of contactIdentityKeys(merged)) {
      identityGroups.set(key, groupKey);
    }
  }

  return [...identities.values()];
}

export function mergeContactIdentity(
  existing: StoredContactIdentity | undefined,
  incoming: ContactIdentity,
): ContactIdentity {
  const merged = {
    remoteJid: existing?.remoteJid ?? incoming.remoteJid,
    canonicalJid: incoming.canonicalJid ?? existing?.canonicalJid ?? existing?.remoteJid ?? incoming.remoteJid,
    phoneNumberJid: incoming.phoneNumberJid ?? existing?.phoneNumberJid,
    lidJid: incoming.lidJid ?? existing?.lidJid,
    phonebookName: incoming.phonebookName ?? existing?.phonebookName,
    whatsappPushName: incoming.whatsappPushName ?? existing?.whatsappPushName,
    verifiedName: incoming.verifiedName ?? existing?.verifiedName,
    username: incoming.username ?? existing?.username,
    pushName: existing?.pushName,
    nameSource: existing?.nameSource,
    profilePicUrl: incoming.profilePicUrl !== undefined ? incoming.profilePicUrl : existing?.profilePicUrl,
  };
  const display = selectDisplayName(merged);

  return {
    ...merged,
    ...display,
    isMyContact: incoming.isMyContact === true || existing?.isMyContact === true ? true : undefined,
    lastSyncedAt: incoming.lastSyncedAt,
  };
}

export function contactIdentityKeys(identity: StoredContactIdentity): string[] {
  return [identity.remoteJid, identity.canonicalJid, identity.phoneNumberJid, identity.lidJid].filter(
    (value): value is string => !!value,
  );
}
