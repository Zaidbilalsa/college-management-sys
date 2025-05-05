"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, BookOpen, GraduationCap, BarChart } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    attendance: "85%",
    subjects: 6,
    upcomingExams: [
      { name: "CAT II", date: "2025-06-15", subject: "Data Structures" },
      { name: "CAT II", date: "2025-06-17", subject: "Algorithms" },
      { name: "Model Exam", date: "2025-07-10", subject: "Database Management" },
    ],
    recentMarks: [
      { exam: "CAT I", subject: "Data Structures", marks: "42/50", percentage: 84 },
      { exam: "CAT I", subject: "Algorithms", marks: "38/50", percentage: 76 },
      { exam: "CAT I", subject: "Database Management", marks: "45/50", percentage: 90 },
    ],
  })

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem("user")
    const storedStudent = localStorage.getItem("student")

    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)

      if (storedStudent) {
        const studentData = JSON.parse(storedStudent)
        setStudent(studentData)
      }

      // If it's a demo user, load demo data
      if (userData.id.startsWith("demo-")) {
        loadDemoData()
      } else {
        fetchStudentData(userData.id)
      }
    }

    setLoading(false)
  }, [])

  // Load demo data for testing
  const loadDemoData = () => {
    // Demo stats
    const demoStats = {
      attendance: "92%",
      subjects: 6,
      upcomingExams: [
        { name: "CAT II", date: "2025-05-20", subject: "Data Structures" },
        { name: "CAT II", date: "2025-05-22", subject: "Database Management" },
        { name: "CAT II", date: "2025-05-25", subject: "Web Development" },
        { name: "Model Exam", date: "2025-06-15", subject: "Data Structures" },
      ],
      recentMarks: [
        { exam: "CAT I", subject: "Data Structures", marks: "45/50", percentage: 90 },
        { exam: "CAT I", subject: "Database Management", marks: "42/50", percentage: 84 },
        { exam: "CAT I", subject: "Web Development", marks: "47/50", percentage: 94 },
        { exam: "CAT I", subject: "Computer Networks", marks: "40/50", percentage: 80 },
      ],
    }

    setStats(demoStats)
  }

  // Fetch student data from database
  const fetchStudentData = async (studentId: string) => {
    try {
      // Fetch attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_records")
        .select(`
          status,
          attendance(
            date,
            working_days,
            subjects(name)
          )
        `)
        .eq("student_id", studentId)

      if (!attendanceError && attendanceData) {
        // Calculate overall attendance percentage
        const totalRecords = attendanceData.length
        const presentRecords = attendanceData.filter(
          (record) => record.status === "present" || record.status === "od",
        ).length
        const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

        setStats((prev) => ({
          ...prev,
          attendance: `${percentage}%`,
        }))
      }

      // Fetch marks
      const { data: marksData, error: marksError } = await supabase
        .from("marks")
        .select(`
          marks,
          exams(
            name,
            date,
            total_marks,
            subjects(name)
          )
        `)
        .eq("student_id", studentId)

      if (!marksError && marksData) {
        const recentMarks = marksData.map((mark) => {
          return {
            exam: mark.exams.name,
            subject: mark.exams.subjects.name,
            marks: `${mark.marks}/${mark.exams.total_marks}`,
            percentage: Math.round((mark.marks / mark.exams.total_marks) * 100),
          }
        })

        setStats((prev) => ({
          ...prev,
          recentMarks,
        }))
      }

      // Fetch upcoming exams (this would be from a different table in a real app)
      // For now, we'll use the demo data
    } catch (error) {
      console.error("Error fetching student data:", error)
      // Fallback to demo data
      loadDemoData()
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {student?.name || user?.name || "Student"}! Here's your academic overview.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4cc9f0] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Attendance
              </CardTitle>
              <CardDescription className="text-white/80">Your overall attendance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.attendance}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4895ef] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Subjects
              </CardTitle>
              <CardDescription className="text-white/80">Total enrolled subjects</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.subjects}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#3a86ff] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <GraduationCap className="mr-2 h-5 w-5" />
                Class
              </CardTitle>
              <CardDescription className="text-white/80">Your current class</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{student?.classes?.name || "Second Year B"}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#4361ee] text-white pb-2">
              <CardTitle className="flex items-center text-lg">
                <BarChart className="mr-2 h-5 w-5" />
                Performance
              </CardTitle>
              <CardDescription className="text-white/80">Average marks in CAT I</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">
                {stats.recentMarks.length > 0
                  ? `${Math.round(stats.recentMarks.reduce((sum, mark) => sum + mark.percentage, 0) / stats.recentMarks.length)}%`
                  : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#f72585] text-white pb-2">
              <CardTitle>Upcoming Exams</CardTitle>
              <CardDescription className="text-white/80">Your exam schedule</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {stats.upcomingExams.map((exam, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{exam.subject}</p>
                      <p className="text-sm text-muted-foreground">{exam.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{new Date(exam.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exam.date).toLocaleDateString(undefined, { weekday: "long" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-[#7209b7] text-white pb-2">
              <CardTitle>Recent Marks</CardTitle>
              <CardDescription className="text-white/80">Your performance in recent exams</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {stats.recentMarks.map((mark, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{mark.subject}</p>
                      <p className="text-sm text-muted-foreground">{mark.exam}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{mark.marks}</p>
                      <p className={`text-sm ${mark.percentage >= 60 ? "text-green-600" : "text-amber-600"}`}>
                        {mark.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
