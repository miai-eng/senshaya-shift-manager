import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updatePassword } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  weak_password: 'Password must be at least 6 characters.',
  unknown: 'Failed to update password. Please try again.',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { error } = await searchParams
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown) : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New password</h1>
      <p className="text-sm text-zinc-800">Set a new password for your account.</p>

      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <form action={updatePassword} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            New password (min. 6 characters)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Update password
        </button>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="text-zinc-800 underline hover:text-zinc-900">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
