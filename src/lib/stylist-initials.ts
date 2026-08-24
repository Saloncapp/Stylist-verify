/** First name initial for stylist avatar fallback. */
export function getStylistInitial(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  const letter = first?.charAt(0);
  return letter ? letter.toUpperCase() : "?";
}
