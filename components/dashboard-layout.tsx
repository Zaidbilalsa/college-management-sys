"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, LogOut, User, Users, BookOpen, Calendar, BarChart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      router.push("/")
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f8f8]">
        <div className="h-16 bg-[#4361ee] shadow-md"></div>
        <div className="flex flex-1">
          <div className="hidden md:block w-64 border-r-4 border-black bg-white">
            <div className="h-32 bg-[#4361ee]"></div>
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <main className="flex-1 p-4 md:p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navItems: Record<string, NavItem[]> = {
    admin: [
      { label: "Dashboard", href: "/dashboard/admin", icon: BarChart },
      { label: "Faculty Management", href: "/dashboard/admin/faculty", icon: Users },
      { label: "Student Management", href: "/dashboard/admin/students", icon: Users },
      { label: "Class Management", href: "/dashboard/admin/classes", icon: BookOpen },
      { label: "Subject Management", href: "/dashboard/admin/subjects", icon: BookOpen },
    ],
    faculty: [
      { label: "Dashboard", href: "/dashboard/faculty", icon: BarChart },
      { label: "My Classes", href: "/dashboard/faculty/classes", icon: BookOpen },
      { label: "Attendance", href: "/dashboard/faculty/attendance", icon: Calendar },
      { label: "Marks", href: "/dashboard/faculty/marks", icon: BarChart },
      { label: "Reports", href: "/dashboard/faculty/reports", icon: BarChart },
    ],
    student: [
      { label: "Dashboard", href: "/dashboard/student", icon: BarChart },
      { label: "Attendance", href: "/dashboard/student/attendance", icon: Calendar },
      { label: "Marks", href: "/dashboard/student/marks", icon: BarChart },
      { label: "Profile", href: "/dashboard/student/profile", icon: User },
    ],
    parent: [
      { label: "Dashboard", href: "/dashboard/parent", icon: BarChart },
      { label: "Child's Attendance", href: "/dashboard/parent/attendance", icon: Calendar },
      { label: "Child's Marks", href: "/dashboard/parent/marks", icon: BarChart },
      { label: "Behavior Reports", href: "/dashboard/parent/reports", icon: BarChart },
      { label: "Profile", href: "/dashboard/parent/profile", icon: User },
    ],
  }

  const roleColors = {
    admin: "bg-[#4361ee]",
    faculty: "bg-[#3a86ff]",
    student: "bg-[#4cc9f0]",
    parent: "bg-[#4895ef]",
  }

  const roleTitles = {
    admin: "Administrator",
    faculty: "Faculty",
    student: "Student",
    parent: "Parent",
  }

  const currentNavItems = navItems[user.role] || []

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      {/* Header */}
      <header
        className={`${roleColors[user.role]} text-white p-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.8)] sticky top-0 z-30`}
      >
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 md:hidden text-white hover:bg-white/20">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-r-4 border-black p-0 w-[280px] sm:w-[350px]">
                <div className={`${roleColors[user.role]} p-4 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{roleTitles[user.role]} Panel</h2>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                  </div>
                  <div className="text-sm">
                    <p>Logged in as:</p>
                    <p className="font-bold">{user.name}</p>
                    <p>{user.email}</p>
                  </div>
                </div>
                <nav className="p-4">
                  <ul className="space-y-2">
                    {currentNavItems.map((item, index) => (
                      <li key={index}>
                        <Link href={item.href}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start ${
                              pathname === item.href ? "bg-black text-white hover:bg-gray-800" : ""
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <item.icon className="mr-2 h-5 w-5" />
                            {item.label}
                          </Button>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Logout
                      </Button>
                    </li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl md:text-2xl font-bold">IT Department Management</h1>
          </div>
          <div className="flex items-center">
            <span className="hidden md:inline mr-4">{user.name}</span>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar - desktop only */}
        <aside className="hidden md:block w-64 border-r-4 border-black bg-white h-[calc(100vh-4rem)] sticky top-16 overflow-auto">
          <div className={`${roleColors[user.role]} p-4 text-white`}>
            <h2 className="text-xl font-bold">{roleTitles[user.role]} Panel</h2>
            <div className="text-sm mt-2">
              <p>Logged in as:</p>
              <p className="font-bold">{user.name}</p>
              <p>{user.email}</p>
            </div>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {currentNavItems.map((item, index) => (
                <li key={index}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        pathname === item.href ? "bg-black text-white hover:bg-gray-800" : ""
                      }`}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                </li>
              ))}
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
