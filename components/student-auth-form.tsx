"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"

interface StudentAuthFormProps {
  onSubmit: (rollNumber: string, dob: string) => Promise<void>
  isLoading?: boolean
}

export function StudentAuthForm({ onSubmit, isLoading = false }: StudentAuthFormProps) {
  const [rollNumber, setRollNumber] = useState("")
  const [dob, setDob] = useState("")
  const [errors, setErrors] = useState<{ rollNumber?: string; dob?: string }>({})

  const validateForm = () => {
    const newErrors: { rollNumber?: string; dob?: string } = {}

    if (!rollNumber) {
      newErrors.rollNumber = "Roll number is required"
    }

    if (!dob) {
      newErrors.dob = "Date of birth is required"
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
      await onSubmit(rollNumber, dob)
    } catch (error) {
      setErrors({
        rollNumber: "Invalid credentials",
        dob: "Invalid credentials",
      })
    }
  }

  return (
    <Card className="w-full max-w-md border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
      <CardHeader className="bg-[#4cc9f0] text-white">
        <div className="flex items-center mb-2">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon" className="text-white hover:text-white/80 hover:bg-transparent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <CardTitle className="text-2xl">Student Login</CardTitle>
        </div>
        <CardDescription className="text-white/80">Access your academic records and attendance</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rollNumber">Roll Number</Label>
            <Input
              id="rollNumber"
              placeholder="Enter your roll number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
              className={`border-2 ${errors.rollNumber ? "border-red-500" : "border-black"}`}
              disabled={isLoading}
            />
            {errors.rollNumber && <p className="text-sm text-red-500">{errors.rollNumber}</p>}
          </div>
          {/* Update the date input to include a helper text */}
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              className={`border-2 ${errors.dob ? "border-red-500" : "border-black"}`}
              disabled={isLoading}
            />
            {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
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
