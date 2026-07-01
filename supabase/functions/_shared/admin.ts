export const ADMIN_EMAIL = "personaldann@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return email === ADMIN_EMAIL;
}
