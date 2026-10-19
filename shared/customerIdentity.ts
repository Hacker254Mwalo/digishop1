export function customerAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@accounts.digitalphonehub.invalid`;
}
