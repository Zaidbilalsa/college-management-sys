"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StudentAuthForm } from "@/components/student-auth-form"
import { useToast } from "@/components/ui/use-toast"
import { studentLogin } from "@/lib/auth"

export default function StudentLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Fix the handleLogin function to properly handle login
  const handleLogin = async (rollNumber: string, dob: string) => {
    setIsLoading(true)
    try {
      // Format the date to ensure consistency (YYYY-MM-DD)
      const formattedDob = new Date(dob).toISOString().split("T")[0]

      // Attempt to sign in with student credentials
      const userData = await studentLogin(rollNumber, formattedDob)

      const { user, student } = userData

      // Store user info in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          role: "student",
          email: user.email || student.email,
          name: user.name || student.name,
          studentId: student.id,
          rollNumber: student.roll_number,
          class: student.classes?.name || "",
          department: student.department,
        }),
      )

      // Redirect to student dashboard
      router.push("/dashboard/student")
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Invalid credentials. Please check your roll number and date of birth.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <StudentAuthForm onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  )
}
