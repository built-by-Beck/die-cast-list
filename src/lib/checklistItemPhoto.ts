/** Resolve a displayable image URL from stored checklist item photo fields. */
export function resolveChecklistItemPhotoUrl(
  photoUrl: string | null | undefined,
  imageRef: string | null | undefined,
): string | null {
  const direct = photoUrl?.trim();
  if (direct) return direct;

  const ref = imageRef?.trim();
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return ref;

  const fileName = ref.replace(/^File:/i, "").trim();
  if (!fileName) return null;

  return `https://hotwheels.fandom.com/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}
