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

  // Update the handleLogin function to properly handle parent login
  const handleLogin = async (mobileNumber: string, studentDob: string) => {
    setIsLoading(true)
    try {
      // Format the date to ensure consistency
      const formattedDob = new Date(studentDob).toISOString().split("T")[0]

      // Attempt to sign in with parent credentials
      const userData = await parentLogin(mobileNumber, formattedDob)

      const { user, parent } = userData

      // Store user info in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          role: "parent",
          email: user.email || parent.email,
          name: user.name || parent.name,
          parentId: parent.id,
          childId: parent.students.id,
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
      toast({
        title: "Error",
        description: "Invalid credentials. Please check your mobile number and child's date of birth.",
        variant: "destructive",
      })
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
