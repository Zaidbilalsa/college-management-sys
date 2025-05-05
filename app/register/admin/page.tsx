"use client"

import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useToast } from "@/components/ui/use-toast"

export default function AdminRegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (email: string, password: string) => {
    // In a real application, you would create a new admin account in your database
    // For now, we'll simulate a successful registration

    // Store user info in localStorage or a more secure method in production
    localStorage.setItem(
      "user",
      JSON.stringify({
        role: "admin",
        email,
        name: "New Admin",
      }),
    )

    // Redirect to admin dashboard
    router.push("/dashboard/admin")
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm type="admin" mode="register" onSubmit={handleRegister} />
      </div>
    </div>
  )
}
