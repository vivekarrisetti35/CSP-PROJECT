import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { roleHome } from "@/lib/client"
import { AuthForm } from "@/components/app/auth-form"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(roleHome(user.role))
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthForm mode="login" />
    </main>
  )
}
