import { redirect } from 'next/navigation'

export default async function Home() {
  // Temporarily redirect to login since we can't check auth in server actions
  redirect('/login')
}
