const SHORT_ID_LENGTH = 6;

export default function shortenID(id?: string | null) {
  if (!id) return null;

  if (id.length <= SHORT_ID_LENGTH) return id;

  return id.slice(id.length - SHORT_ID_LENGTH);
}
