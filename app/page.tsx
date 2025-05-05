"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  // Fix hydration errors by ensuring client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Define the role cards
  const roleCards = [
    {
      title: "Admin",
      description: "System administration and management",
      href: "/login/admin",
      color: "bg-[#4361ee]",
    },
    {
      title: "Faculty",
      description: "Manage classes and student performance",
      href: "/login/faculty",
      color: "bg-[#3a86ff]",
    },
    {
      title: "Student",
      description: "View your attendance and marks",
      href: "/login/student",
      color: "bg-[#4cc9f0]",
    },
    {
      title: "Parent",
      description: "Monitor your child's progress",
      href: "/login/parent",
      color: "bg-[#4895ef]",
    },
  ]

  // If not mounted yet, return a placeholder to prevent hydration errors
  if (!mounted) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] flex flex-col">
      <header className="bg-[#ff5757] text-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-full mr-4">
              <Image
                src="/clg-logo.png"
                alt="College Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">C. Abdul Hakeem College of Engineering and Technology</h1>
              <p className="mt-2 text-lg">Manage students, faculty, attendance, and performance</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Login to your account</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roleCards.map((role, index) => (
              <Card
                key={index}
                className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-1"
              >
                <CardHeader className={`${role.color} text-white`}>
                  <CardTitle className="text-xl">{role.title} Login</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <CardDescription className="text-base min-h-[60px]">{role.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Link href={role.href} className="w-full">
                    <Button className="w-full bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                      Login
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-black text-white p-6 mt-auto">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} C. Abdul Hakeem College of Engineering and Technology</p>
        </div>
      </footer>
    </main>
  )
}
