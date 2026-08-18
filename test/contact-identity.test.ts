import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  mergeContactIdentity,
  normalizeContactIdentities,
  normalizeContactIdentity,
} from '../src/api/integrations/channel/whatsapp/contact-identity';

describe('contact identity normalization', () => {
  it('keeps phonebook and WhatsApp names with their original sources', () => {
    const identity = normalizeContactIdentity({
      id: '966500000001@s.whatsapp.net',
      name: 'Saved on phone',
      notify: 'WhatsApp profile',
      verifiedName: 'Verified business',
      username: 'customer',
      imgUrl: 'https://example.test/avatar.jpg',
    });

    assert.ok(identity);
    assert.equal(identity.phonebookName, 'Saved on phone');
    assert.equal(identity.whatsappPushName, 'WhatsApp profile');
    assert.equal(identity.verifiedName, 'Verified business');
    assert.equal(identity.pushName, 'Saved on phone');
    assert.equal(identity.nameSource, 'phonebook');
    assert.equal(identity.isMyContact, true);
    assert.equal(identity.profilePicUrl, 'https://example.test/avatar.jpg');
  });

  it('links a LID contact to its phone-number identity', () => {
    const identity = normalizeContactIdentity({
      id: '123456789@lid',
      lid: '123456789@lid',
      phoneNumber: '966500000002@c.us',
      notify: 'Customer',
    });

    assert.ok(identity);
    assert.equal(identity.remoteJid, '123456789@lid');
    assert.equal(identity.lidJid, '123456789@lid');
    assert.equal(identity.phoneNumberJid, '966500000002@s.whatsapp.net');
    assert.equal(identity.canonicalJid, '966500000002@s.whatsapp.net');
  });

  it('does not replace a saved phonebook name with a later push name', () => {
    const phonebookIdentity = normalizeContactIdentity({
      id: '966500000003@s.whatsapp.net',
      name: 'Saved name',
      notify: 'Old profile name',
    });
    const messageIdentity = normalizeContactIdentity({
      id: '966500000003@s.whatsapp.net',
      notify: 'New profile name',
    });

    assert.ok(phonebookIdentity);
    assert.ok(messageIdentity);

    const merged = mergeContactIdentity(phonebookIdentity, messageIdentity);

    assert.equal(merged.phonebookName, 'Saved name');
    assert.equal(merged.whatsappPushName, 'New profile name');
    assert.equal(merged.pushName, 'Saved name');
    assert.equal(merged.nameSource, 'phonebook');
  });

  it('marks a contact without a phonebook name as unknown instead of not saved', () => {
    const identity = normalizeContactIdentity({
      id: '966500000004@s.whatsapp.net',
      notify: 'WhatsApp profile',
    });

    assert.ok(identity);
    assert.equal(identity.isMyContact, undefined);
    assert.equal(identity.nameSource, 'whatsapp_push');
  });

  it('collapses separate phone-number and LID records when a linked identity arrives', () => {
    const identities = normalizeContactIdentities([
      { id: '966500000005@s.whatsapp.net', notify: 'WhatsApp profile' },
      { id: '987654321@lid', name: 'Saved name' },
      {
        id: '987654321@lid',
        lid: '987654321@lid',
        phoneNumber: '966500000005@s.whatsapp.net',
      },
    ]);

    assert.equal(identities.length, 1);
    assert.equal(identities[0].phoneNumberJid, '966500000005@s.whatsapp.net');
    assert.equal(identities[0].lidJid, '987654321@lid');
    assert.equal(identities[0].phonebookName, 'Saved name');
    assert.equal(identities[0].whatsappPushName, 'WhatsApp profile');
    assert.equal(identities[0].pushName, 'Saved name');
  });
});
