// Admin email whitelist
const ADMIN_EMAILS = [
  'mfischer1000@gmail.com'
]

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
