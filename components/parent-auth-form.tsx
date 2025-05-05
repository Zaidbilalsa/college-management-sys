"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"

interface ParentAuthFormProps {
  onSubmit: (mobileNumber: string, studentDob: string) => Promise<void>
  isLoading?: boolean
}

export function ParentAuthForm({ onSubmit, isLoading = false }: ParentAuthFormProps) {
  const [mobileNumber, setMobileNumber] = useState("")
  const [studentDob, setStudentDob] = useState("")
  const [errors, setErrors] = useState<{ mobileNumber?: string; studentDob?: string }>({})

  const validateForm = () => {
    const newErrors: { mobileNumber?: string; studentDob?: string } = {}

    if (!mobileNumber) {
      newErrors.mobileNumber = "Mobile number is required"
    }

    if (!studentDob) {
      newErrors.studentDob = "Student's date of birth is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Update the handleSubmit function to format the date correctly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    // Validate form
    if (!validateForm()) return

    try {
      // Format is already yyyy-mm-dd from the date input, so we don't need to convert
      await onSubmit(mobileNumber, studentDob)
    } catch (error) {
      setErrors({
        mobileNumber: "Invalid credentials",
        studentDob: "Invalid credentials",
      })
    }
  }

  return (
    <Card className="w-full max-w-md border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
      <CardHeader className="bg-[#4895ef] text-white">
        <div className="flex items-center mb-2">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon" className="text-white hover:text-white/80 hover:bg-transparent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <CardTitle className="text-2xl">Parent Login</CardTitle>
        </div>
        <CardDescription className="text-white/80">Monitor your child's academic progress</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              placeholder="Enter your registered mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
              className={`border-2 ${errors.mobileNumber ? "border-red-500" : "border-black"}`}
              disabled={isLoading}
            />
            {errors.mobileNumber && <p className="text-sm text-red-500">{errors.mobileNumber}</p>}
          </div>
          {/* Update the date input to include a helper text */}
          <div className="space-y-2">
            <Label htmlFor="studentDob">Child's Date of Birth</Label>
            <Input
              id="studentDob"
              type="text"
              value={studentDob}
              onChange={(e) => setStudentDob(e.target.value)}
              required
              className={`border-2 ${errors.studentDob ? "border-red-500" : "border-black"}`}
              disabled={isLoading}
            />
            {errors.studentDob && <p className="text-sm text-red-500">{errors.studentDob}</p>}
            <p className="text-xs text-muted-foreground">Format: YYYY-MM-DD</p>
          </div>
          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t-2 border-black pt-4">
        <Link href="/" className="text-blue-600 hover:underline">
          Back to home
        </Link>
      </CardFooter>
    </Card>
  )
}
