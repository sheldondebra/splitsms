/** Short display id, e.g. #1001 — safe for client and server. */
export function formatTicketReference(reference: number): string {
  return `#${reference}`;
}
