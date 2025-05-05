"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, BookOpen, Calendar, BarChart } from "lucide-react"
import Link from "next/link"

export default function FacultyDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    assignedClasses: [],
    subjects: [],
    recentAttendance: [],
    upcomingExams: [],
  })

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // In a real application, you would fetch this data from your API
    // For now, we'll use mock data
    setStats({
      totalStudents: 147,
      assignedClasses: ["Second Year A", "Third Year B"],
      subjects: ["Data Structures", "Algorithms"],
      recentAttendance: [
        { date: "2023-05-01", class: "Second Year A", subject: "Data Structures", present: 68, total: 75 },
        { date: "2023-05-02", class: "Third Year B", subject: "Algorithms", present: 65, total: 70 },
        { date: "2023-05-03", class: "Second Year A", subject: "Data Structures", present: 70, total: 75 },
      ],
      upcomingExams: [
        { name: "CAT I", date: "2023-05-15", class: "Second Year A", subject: "Data Structures" },
        { name: "CAT I", date: "2023-05-17", class: "Third Year B", subject: "Algorithms" },
        { name: "Model Exam", date: "2023-06-10", class: "Second Year A", subject: "Data Structures" },
      ],
    })
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#3a86ff] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <Users className="mr-2 h-5 w-5" />
                Students
              </CardTitle>
              <CardDescription className="text-white/80">Total students in your classes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4cc9f0] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Classes
              </CardTitle>
              <CardDescription className="text-white/80">Assigned classes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.assignedClasses.length}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.assignedClasses.map((cls, index) => (
                  <span key={index} className="bg-secondary px-2 py-1 rounded-md text-xs">
                    {cls}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4895ef] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Subjects
              </CardTitle>
              <CardDescription className="text-white/80">Subjects you teach</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.subjects.length}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.subjects.map((subject, index) => (
                  <span key={index} className="bg-secondary px-2 py-1 rounded-md text-xs">
                    {subject}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4361ee] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Attendance
              </CardTitle>
              <CardDescription className="text-white/80">Recent attendance records</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <p className="text-3xl font-bold">{stats.recentAttendance.length}</p>
              </div>
              <Link
                href="/dashboard/faculty/attendance"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                View all records
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Recent Attendance
              </CardTitle>
              <CardDescription>Latest attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentAttendance.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell>
                        <span className={record.present / record.total >= 0.75 ? "text-green-600" : "text-amber-600"}>
                          {record.present}/{record.total} ({Math.round((record.present / record.total) * 100)}%)
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Link href="/dashboard/faculty/attendance">
                  <Button variant="outline" className="w-full">
                    View All Attendance Records
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Upcoming Exams
              </CardTitle>
              <CardDescription>Scheduled exams and assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.upcomingExams.map((exam, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                      <TableCell>{exam.class}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Link href="/dashboard/faculty/marks">
                  <Button variant="outline" className="w-full">
                    Manage Marks
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for faculty members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/dashboard/faculty/attendance">
                  <Button className="w-full bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                    <Calendar className="mr-2 h-5 w-5" />
                    Take Attendance
                  </Button>
                </Link>
                <Link href="/dashboard/faculty/marks">
                  <Button className="w-full bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                    <BarChart className="mr-2 h-5 w-5" />
                    Update Marks
                  </Button>
                </Link>
                <Link href="/dashboard/faculty/reports">
                  <Button className="w-full bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                    <Users className="mr-2 h-5 w-5" />
                    Generate Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
