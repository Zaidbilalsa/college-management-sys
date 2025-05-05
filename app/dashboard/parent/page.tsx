"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { BookOpen, Calendar, GraduationCap, LineChart, User } from "lucide-react"

export default function ParentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [childInfo, setChildInfo] = useState<any>(null)
  const [attendance, setAttendance] = useState<any>(null)
  const [marks, setMarks] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login/parent")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "parent") {
      router.push("/login/parent")
      return
    }

    setUser(userData)
    fetchChildData(userData.childId)
  }, [router])

  const fetchChildData = async (childId: string) => {
    setIsLoading(true)
    try {
      // If it's a demo user, load demo data
      if (childId.startsWith("demo-")) {
        loadDemoData()
        return
      }

      // Fetch child's details including class
      const { data: childData, error: childError } = await supabase
        .from("students")
        .select(`
          *,
          classes(*)
        `)
        .eq("id", childId)
        .single()

      if (childError) throw childError

      if (childData) {
        setChildInfo({
          id: childData.id,
          name: childData.name,
          rollNumber: childData.roll_number,
          class: childData.classes.name,
        })
      }

      // Fetch child's attendance
      const attendancePercentage = await fetchAttendance(childId)
      setAttendance(attendancePercentage)

      // Fetch child's marks
      const marksData = await fetchMarks(childId)
      setMarks(marksData)

      // Fetch child's reports
      const reportsData = await fetchReports(childId)
      setReports(reportsData)

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching child data:", error)
      // Load demo data as fallback
      loadDemoData()
    }
  }

  const fetchAttendance = async (childId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          status,
          attendance(
            date,
            working_days,
            subjects(name)
          )
        `)
        .eq("student_id", childId)

      if (error) throw error

      // Calculate overall attendance percentage
      const totalRecords = data.length
      const presentRecords = data.filter((record) => record.status === "present" || record.status === "od").length
      const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

      return `${percentage}%`
    } catch (error) {
      console.error("Error fetching attendance:", error)
      return "N/A"
    }
  }

  const fetchMarks = async (childId: string) => {
    try {
      const { data, error } = await supabase
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
        .eq("student_id", childId)

      if (error) throw error

      // Transform data to match the expected format
      return data.map((mark) => {
        return {
          exam: mark.exams.name,
          subject: mark.exams.subjects.name,
          marks: mark.marks,
          totalMarks: mark.exams.total_marks,
          percentage: Math.round((mark.marks / mark.exams.total_marks) * 100),
          date: new Date(mark.exams.date).toLocaleDateString(),
        }
      })
    } catch (error) {
      console.error("Error fetching marks:", error)
      return []
    }
  }

  const fetchReports = async (childId: string) => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          faculty(name)
        `)
        .eq("student_id", childId)
        .order("date", { ascending: false })

      if (error) throw error

      return data.map((report) => {
        return {
          id: report.id,
          date: new Date(report.date).toLocaleDateString(),
          facultyName: report.faculty?.name || "Unknown",
          attendance: report.attendance,
          catI: report.cat_i,
          catII: report.cat_ii,
          model: report.model,
          behavior: report.behavior,
          comments: report.comments,
        }
      })
    } catch (error) {
      console.error("Error fetching reports:", error)
      return []
    }
  }

  const loadDemoData = () => {
    // Demo attendance data
    setAttendance("85%")

    // Demo marks data
    const demoMarks = [
      {
        exam: "CAT I",
        subject: "Mathematics",
        marks: 42,
        totalMarks: 50,
        percentage: 84,
        date: "2025-04-15",
      },
      {
        exam: "CAT I",
        subject: "Physics",
        marks: 38,
        totalMarks: 50,
        percentage: 76,
        date: "2025-04-10",
      },
      {
        exam: "CAT II",
        subject: "Mathematics",
        marks: 44,
        totalMarks: 50,
        percentage: 88,
        date: "2025-05-20",
      },
      {
        exam: "CAT II",
        subject: "Physics",
        marks: 40,
        totalMarks: 50,
        percentage: 80,
        date: "2025-05-15",
      },
    ]
    setMarks(demoMarks)

    // Demo reports data
    const demoReports = [
      {
        id: "demo-r1",
        date: "2025-05-25",
        facultyName: "Dr. Smith",
        attendance: 85,
        catI: 80,
        catII: 84,
        model: 78,
        behavior: "Good",
        comments: "Performing well in mathematics. Needs to focus more on physics practical sessions.",
      },
      {
        id: "demo-r2",
        date: "2025-04-15",
        facultyName: "Prof. Johnson",
        attendance: 82,
        catI: 76,
        catII: 0, // Not conducted yet
        model: 0, // Not conducted yet
        behavior: "Excellent",
        comments: "Active participation in class discussions. Showing improvement in problem-solving skills.",
      },
    ]
    setReports(demoReports)

    setIsLoading(false)
  }

  // Calculate overall performance
  const calculateOverallPerformance = () => {
    if (marks.length === 0) return 0

    const totalPercentage = marks.reduce((sum, mark) => sum + mark.percentage, 0)
    return Math.round(totalPercentage / marks.length)
  }

  const overallPerformance = calculateOverallPerformance()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.name || "Parent"}. View your child's academic progress.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Child Name</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{childInfo?.name || user?.childName || "Student Name"}</div>
              <p className="text-xs text-muted-foreground">
                Roll Number: {childInfo?.rollNumber || user?.childRollNumber || "N/A"} | Class:{" "}
                {childInfo?.class || user?.childClass || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendance || "N/A"}</div>
              <Progress
                value={Number.parseInt(attendance?.replace("%", "") || "0")}
                className="h-2 mt-2"
                indicatorClassName={
                  Number.parseInt(attendance?.replace("%", "") || "0") >= 75
                    ? "bg-green-500"
                    : Number.parseInt(attendance?.replace("%", "") || "0") >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }
              />
              <p className="text-xs text-muted-foreground mt-2">Overall attendance percentage</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Academic Performance</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallPerformance}%</div>
              <Progress
                value={overallPerformance}
                className="h-2 mt-2"
                indicatorClassName={
                  overallPerformance >= 75 ? "bg-green-500" : overallPerformance >= 60 ? "bg-yellow-500" : "bg-red-500"
                }
              />
              <p className="text-xs text-muted-foreground mt-2">Average marks across all subjects</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                Last report: {reports.length > 0 ? reports[0].date : "No reports yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="marks" className="space-y-4">
          <TabsList className="grid grid-cols-3 h-auto">
            <TabsTrigger value="marks" className="py-2">
              Marks
            </TabsTrigger>
            <TabsTrigger value="attendance" className="py-2">
              Attendance
            </TabsTrigger>
            <TabsTrigger value="reports" className="py-2">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marks" className="space-y-4">
            <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="mr-2 h-5 w-5" />
                  Academic Performance
                </CardTitle>
                <CardDescription>View your child's marks in various subjects and exams</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <p>Loading marks data...</p>
                  </div>
                ) : marks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marks.map((mark, index) => (
                        <TableRow key={index}>
                          <TableCell>{mark.date}</TableCell>
                          <TableCell>{mark.exam}</TableCell>
                          <TableCell>{mark.subject}</TableCell>
                          <TableCell>
                            {mark.marks}/{mark.totalMarks}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                mark.percentage >= 75
                                  ? "text-green-600"
                                  : mark.percentage >= 60
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }
                            >
                              {mark.percentage}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p>No marks data available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Attendance Records
                </CardTitle>
                <CardDescription>View your child's attendance details</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <p>Loading attendance data...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                      <div className="text-4xl font-bold mb-2">{attendance}</div>
                      <p className="text-sm text-muted-foreground">Overall Attendance</p>
                      <Progress
                        value={Number.parseInt(attendance?.replace("%", "") || "0")}
                        className="h-2 w-full max-w-md mt-4"
                        indicatorClassName={
                          Number.parseInt(attendance?.replace("%", "") || "0") >= 75
                            ? "bg-green-500"
                            : Number.parseInt(attendance?.replace("%", "") || "0") >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }
                      />
                      <div className="flex justify-between w-full max-w-md mt-2">
                        <span className="text-xs">0%</span>
                        <span className="text-xs">50%</span>
                        <span className="text-xs">100%</span>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Attendance Guidelines</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>Above 75%: Good attendance</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span>60% - 75%: Needs improvement</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span>Below 60%: Critical - May affect exam eligibility</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Note to Parents</h3>
                      <p className="text-sm">
                        Regular attendance is crucial for academic success. If your child's attendance is below 75%,
                        please ensure they attend classes regularly. For any unavoidable absences, please provide a
                        written explanation to the class teacher.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Faculty Reports
                </CardTitle>
                <CardDescription>View detailed reports from faculty members</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <p>Loading reports...</p>
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-6">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">Report by {report.facultyName}</h3>
                            <p className="text-sm text-muted-foreground">Date: {report.date}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Attendance</p>
                            <p className="text-lg font-medium">{report.attendance}%</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">CAT I</p>
                            <p className="text-lg font-medium">{report.catI ? `${report.catI}%` : "Not Available"}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">CAT II</p>
                            <p className="text-lg font-medium">{report.catII ? `${report.catII}%` : "Not Available"}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Model Exam</p>
                            <p className="text-lg font-medium">{report.model ? `${report.model}%` : "Not Available"}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">Behavior</h4>
                          <p className="text-sm">{report.behavior}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-1">Comments</h4>
                          <p className="text-sm">{report.comments}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>No reports available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
