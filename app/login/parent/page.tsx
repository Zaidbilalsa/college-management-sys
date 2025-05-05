"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ParentAuthForm } from "@/components/parent-auth-form"
import { useToast } from "@/components/ui/use-toast"
import { parentLogin } from "@/lib/auth"

export default function ParentLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (mobileNumber: string, studentDob: string) => {
    setIsLoading(true)
    try {
      // Attempt to sign in with parent credentials
      const { user, parent } = await parentLogin(mobileNumber, studentDob)

      // Store user info in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
          parentId: parent.id,
          childName: parent.students.name,
          childRollNumber: parent.students.roll_number,
          childClass: parent.students.classes.name,
          relation: parent.relation,
        }),
      )

      // Redirect to parent dashboard
      router.push("/dashboard/parent")
    } catch (error) {
      console.error("Login error:", error)
      throw new Error("Invalid credentials. Please check your mobile number and child's date of birth.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ParentAuthForm onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  )
}
