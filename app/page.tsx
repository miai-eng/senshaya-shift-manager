import { redirect } from 'next/navigation'

// proxy.ts also redirects / to /dashboard or /login;
// this is a fallback for direct access.
export default function RootPage() {
  redirect('/login')
}
