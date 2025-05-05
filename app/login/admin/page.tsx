"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useToast } from "@/components/ui/use-toast"
import { adminLogin } from "@/lib/auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Attempt to sign in with admin credentials
      const user = await adminLogin(email, password)

      // Store user info in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
        }),
      )

      // Redirect to admin dashboard
      router.push("/dashboard/admin")
    } catch (error) {
      console.error("Login error:", error)
      throw new Error("Invalid credentials or you don't have admin privileges")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm type="admin" onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  )
}
