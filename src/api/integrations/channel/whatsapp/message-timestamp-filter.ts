export type MessageTimestampQuery = {
  gte?: string;
  lte?: string;
};

export type MessageTimestampRange = {
  gte?: number;
  lte?: number;
};

export function buildMessageTimestampFilter(query?: MessageTimestampQuery) {
  const range: MessageTimestampRange = {};

  if (query?.gte) {
    const timestamp = new Date(query.gte).getTime();

    if (!Number.isNaN(timestamp)) {
      range.gte = Math.floor(timestamp / 1000);
    }
  }

  if (query?.lte) {
    const timestamp = new Date(query.lte).getTime();

    if (!Number.isNaN(timestamp)) {
      range.lte = Math.floor(timestamp / 1000);
    }
  }

  return Object.keys(range).length > 0 ? { messageTimestamp: range } : {};
}
