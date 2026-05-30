import { redirect } from 'next/navigation'

// Auth is disabled — redirect straight to the app
export default function LoginPage() {
  redirect('/')
}
