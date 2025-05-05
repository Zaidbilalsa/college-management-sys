"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useToast } from "@/components/ui/use-toast"
import { facultyLogin } from "@/lib/auth"

export default function FacultyLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Attempt to sign in with faculty credentials
      const { user, faculty } = await facultyLogin(email, password)

      // Check if this is first login with temporary password
      const needsPasswordChange = !!faculty.temp_password

      // Store user info in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
          facultyId: faculty.id,
          needsPasswordChange,
        }),
      )

      // Redirect to password change page if using temporary password
      if (needsPasswordChange) {
        router.push("/dashboard/faculty/change-password")
      } else {
        // Redirect to faculty dashboard
        router.push("/dashboard/faculty")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw new Error("Invalid credentials or you don't have faculty privileges")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm type="faculty" onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  )
}
