"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, GraduationCap, School } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    facultyCount: 0,
    studentCount: 0,
    classCount: 0,
    subjectCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch counts from database
        const [facultyResult, studentResult, classResult, subjectResult] = await Promise.all([
          supabase.from("faculty").select("id", { count: "exact" }),
          supabase.from("students").select("id", { count: "exact" }),
          supabase.from("classes").select("id", { count: "exact" }),
          supabase.from("subjects").select("id", { count: "exact" }),
        ])

        // Fetch recent activities (could be from a dedicated activities table)
        const { data: activities } = await supabase
          .from("users")
          .select("name, role, created_at")
          .order("created_at", { ascending: false })
          .limit(5)

        // Fetch department data (students per class)
        const { data: classes } = await supabase.from("classes").select("id, name, year, section")

        const classStudentCounts = await Promise.all(
          classes?.map(async (cls) => {
            const { count } = await supabase.from("students").select("id", { count: "exact" }).eq("class_id", cls.id)

            return {
              id: cls.id,
              name: cls.name,
              year: cls.year,
              section: cls.section,
              studentCount: count || 0,
            }
          }) || [],
        )

        // Group by year
        const departmentStructure = classStudentCounts.reduce<Record<string, Array<{ section: string; studentCount: number }>>>((acc, cls) => {
          const yearKey = `Year ${cls.year}`
          if (!acc[yearKey]) {
            acc[yearKey] = []
          }
          acc[yearKey].push({
            section: cls.section,
            studentCount: cls.studentCount,
          })
          return acc
        }, {})

        setStats({
          facultyCount: facultyResult.count || 0,
          studentCount: studentResult.count || 0,
          classCount: classResult.count || 0,
          subjectCount: subjectResult.count || 0,
        })

        setRecentActivities(activities || [])
        setDepartmentData(
          Object.entries(departmentStructure).map(([year, sections]) => ({
            year,
            sections,
          })),
        )
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-b pb-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-1" />
                      <Skeleton className="h-3 w-1/4 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-36" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4361ee] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <Users className="mr-2 h-5 w-5" />
                Faculty Members
              </CardTitle>
              <CardDescription className="text-white/80">Total registered faculty</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.facultyCount}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#3a86ff] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <GraduationCap className="mr-2 h-5 w-5" />
                Students
              </CardTitle>
              <CardDescription className="text-white/80">Total enrolled students</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.studentCount}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4cc9f0] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <School className="mr-2 h-5 w-5" />
                Classes
              </CardTitle>
              <CardDescription className="text-white/80">Total active classes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.classCount}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4895ef] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Subjects
              </CardTitle>
              <CardDescription className="text-white/80">Total subjects offered</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.subjectCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <ul className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <li key={index} className="border-b pb-2">
                      <p className="font-medium">New {activity.role} added</p>
                      <p className="text-sm text-muted-foreground">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No recent activities found</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>IT Department structure</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentData.length > 0 ? (
                <div className="space-y-4">
                  {departmentData.map((yearData, index) => (
                    <div key={index} className="border-b pb-2">
                      <h3 className="font-medium">{yearData.year}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {yearData.sections.map((section: any, sectionIndex: number) => (
                          <div key={sectionIndex} className="bg-gray-100 p-2 rounded">
                            <p className="font-medium">Section {section.section}</p>
                            <p className="text-sm text-muted-foreground">{section.studentCount} students</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No department data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
