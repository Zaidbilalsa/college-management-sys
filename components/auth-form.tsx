"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { validateData, loginSchema } from "@/lib/validations"

interface AuthFormProps {
  type: "admin" | "faculty"
  onSubmit: (email: string, password: string) => Promise<void>
  isLoading?: boolean
}

export function AuthForm({ type, onSubmit, isLoading = false }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const router = useRouter()
  const { toast } = useToast()

  const titles = {
    admin: "Administrator",
    faculty: "Faculty Member",
  }

  const descriptions = {
    admin: "Access system administration features",
    faculty: "Manage classes and student performance",
  }

  const colors = {
    admin: "bg-[#4361ee]",
    faculty: "bg-[#3a86ff]",
  }

  const validateForm = () => {
    const schema = loginSchema
    const result = validateData(schema, { email, password })

    if (!result.success && result.error) {
      const newErrors: { email?: string; password?: string } = {}

      if (result.error.includes("email")) {
        newErrors.email = "Please enter a valid email address"
      }

      if (result.error.includes("password")) {
        newErrors.password = "Password must be at least 6 characters"
      }

      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    // Validate form
    if (!validateForm()) return

    try {
      await onSubmit(email, password)
      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-md border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
      <CardHeader className={`${colors[type]} text-white`}>
        <div className="flex items-center mb-2">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon" className="text-white hover:text-white/80 hover:bg-transparent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <CardTitle className="text-2xl">{titles[type]} Login</CardTitle>
        </div>
        <CardDescription className="text-white/80">{descriptions[type]}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`border-2 ${errors.email ? "border-red-500" : "border-black"}`}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`border-2 pr-10 ${errors.password ? "border-red-500" : "border-black"}`}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
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
