import { supabase } from './supabase'

/** Add an email to the lifetime waitlist (de-duped server-side). */
export async function joinWaitlist(email) {
  const { data, error } = await supabase.rpc('join_waitlist', { p_email: email })
  if (error) throw new Error(error.message)
  if (data === 'invalid') throw new Error('Please enter a valid email address.')
  return true
}

/** Admin only: every subscriber with plan + email (server enforces is_admin). */
export async function getSubscribers() {
  const { data, error } = await supabase.rpc('admin_subscribers')
  if (error) throw new Error(error.message)
  return data || []
}

/** Admin only: the lifetime waitlist. */
export async function getWaitlist() {
  const { data, error } = await supabase.rpc('admin_waitlist')
  if (error) throw new Error(error.message)
  return data || []
}
