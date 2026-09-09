import { redirect } from 'next/navigation'

/** CMS project is admin/API only — marketing site lives on apps/frontend. */
export default function RootPage() {
  redirect('/admin')
}
