import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildMessageTimestampFilter } from '../src/api/integrations/channel/whatsapp/message-timestamp-filter';

describe('message timestamp filter', () => {
  it('builds a lower bound without requiring an upper bound', () => {
    assert.deepEqual(buildMessageTimestampFilter({ gte: '2026-08-18T10:00:00.000Z' }), {
      messageTimestamp: { gte: 1787047200 },
    });
  });

  it('builds an upper bound without requiring a lower bound', () => {
    assert.deepEqual(buildMessageTimestampFilter({ lte: '2026-08-18T11:00:00.000Z' }), {
      messageTimestamp: { lte: 1787050800 },
    });
  });

  it('keeps both valid bounds and ignores invalid values', () => {
    assert.deepEqual(
      buildMessageTimestampFilter({ gte: '2026-08-18T10:00:00.000Z', lte: '2026-08-18T11:00:00.000Z' }),
      {
        messageTimestamp: { gte: 1787047200, lte: 1787050800 },
      },
    );
    assert.deepEqual(buildMessageTimestampFilter({ gte: 'invalid' }), {});
  });
});
