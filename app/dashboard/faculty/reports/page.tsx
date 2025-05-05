"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Plus, Search, Eye, Trash } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Mock data for behavior options
const behaviorOptions = ["Good", "Average", "Needs Improvement"]

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<string[]>([])
  const [students, setStudents] = useState<Record<string, any[]>>({})
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [reports, setReports] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [reportDate, setReportDate] = useState("")
  const [attendance, setAttendance] = useState("")
  const [catI, setCatI] = useState("")
  const [catII, setCatII] = useState("")
  const [model, setModel] = useState("")
  const [behavior, setBehavior] = useState("")
  const [comments, setComments] = useState("")
  const [currentViewReport, setCurrentViewReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Fetch user data and initialize
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      fetchFacultyData(userData.facultyId || userData.id)
    }
  }, [])

  // Fetch faculty data (classes, students)
  const fetchFacultyData = async (facultyId: string) => {
    setIsLoading(true)
    try {
      // Fetch faculty's assigned classes
      const { data: facultyClasses, error: classesError } = await supabase
        .from("faculty_classes")
        .select(`
          classes(id, name)
        `)
        .eq("faculty_id", facultyId)

      if (classesError) throw classesError

      if (facultyClasses && facultyClasses.length > 0) {
        const classNames = facultyClasses.map((fc) => fc.classes.name)
        setClasses(classNames)

        // Fetch students for each class
        const studentsMap: Record<string, any[]> = {}

        for (const fc of facultyClasses) {
          // Fetch students for this class
          const { data: classStudents, error: studentsError } = await supabase
            .from("students")
            .select(`
              id, name, roll_number, email,
              parents(id, name, email)
            `)
            .eq("class_id", fc.classes.id)

          if (studentsError) throw studentsError

          if (classStudents && classStudents.length > 0) {
            studentsMap[fc.classes.name] = classStudents.map((student) => ({
              id: student.id,
              name: student.name,
              rollNumber: student.roll_number,
              email: student.email,
              parentEmail: student.parents && student.parents.length > 0 ? student.parents[0].email : null,
            }))
          } else {
            studentsMap[fc.classes.name] = []
          }
        }

        setStudents(studentsMap)
      } else {
        // If no classes are assigned, show a message
        toast({
          title: "No Classes Assigned",
          description: "You don't have any classes assigned. Please contact the administrator.",
          variant: "destructive",
        })
      }

      // Fetch reports
      fetchReports(facultyId)
    } catch (error) {
      console.error("Error fetching faculty data:", error)
      toast({
        title: "Error",
        description: "Failed to load faculty data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch reports
  const fetchReports = async (facultyId: string) => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id, date, attendance, cat_i, cat_ii, model, behavior, comments, sent, parent_email,
          students(id, name, roll_number, classes(name))
        `)
        .eq("faculty_id", facultyId)
        .order("date", { ascending: false })

      if (error) throw error

      if (data) {
        const formattedReports = data.map((report) => ({
          id: report.id,
          date: report.date,
          class: report.students.classes.name,
          student: report.students.name,
          rollNumber: report.students.roll_number,
          parentEmail: report.parent_email,
          attendance: report.attendance,
          catI: report.cat_i,
          catII: report.cat_ii,
          model: report.model,
          behavior: report.behavior,
          comments: report.comments,
          sent: report.sent,
        }))
        setReports(formattedReports)
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter reports based on search term
  const filteredReports = reports.filter(
    (report) =>
      report.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedStudent("")
  }

  const handleStudentChange = (value: string) => {
    setSelectedStudent(value)
  }

  const handleGenerateReport = async () => {
    if (!selectedClass || !selectedStudent || !reportDate || !attendance || !catI || !catII || !model || !behavior) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    const student = students[selectedClass].find((s) => s.id.toString() === selectedStudent)

    if (!student) {
      toast({
        title: "Error",
        description: "Student not found",
        variant: "destructive",
      })
      return
    }

    try {
      // Insert report
      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            date: reportDate,
            student_id: student.id,
            faculty_id: user.facultyId || user.id,
            parent_email: student.parentEmail,
            attendance,
            cat_i: catI,
            cat_ii: catII,
            model,
            behavior,
            comments,
            sent: false,
          },
        ])
        .select()

      if (error) throw error

      // Add to local state
      const newReport = {
        id: data[0].id,
        date: reportDate,
        class: selectedClass,
        student: student.name,
        rollNumber: student.rollNumber,
        parentEmail: student.parentEmail,
        attendance,
        catI,
        catII,
        model,
        behavior,
        comments,
        sent: false,
      }

      setReports([newReport, ...reports])
      setIsGenerateDialogOpen(false)

      // Reset form
      setSelectedClass("")
      setSelectedStudent("")
      setReportDate("")
      setAttendance("")
      setCatI("")
      setCatII("")
      setModel("")
      setBehavior("")
      setComments("")

      toast({
        title: "Success",
        description: "Report generated successfully",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewReport = (report: any) => {
    setCurrentViewReport(report)
    setIsViewDialogOpen(true)
  }

  const handleMarkAsSent = async (id: number) => {
    try {
      // Update report status
      const { error } = await supabase.from("reports").update({ sent: true }).eq("id", id)

      if (error) throw error

      // Update local state
      setReports(reports.map((report) => (report.id === id ? { ...report, sent: true } : report)))

      toast({
        title: "Success",
        description: "Report marked as sent",
      })
    } catch (error) {
      console.error("Error marking report as sent:", error)
      toast({
        title: "Error",
        description: "Failed to update report status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return

    try {
      // Delete report
      const { error } = await supabase.from("reports").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setReports(reports.filter((report) => report.id !== id))

      toast({
        title: "Success",
        description: "Report deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting report:", error)
      toast({
        title: "Error",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reports Management</h1>
            <p className="text-muted-foreground">Generate and manage student reports</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Generate Student Report</DialogTitle>
                  <DialogDescription>Create a comprehensive report for a student</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="class" className="text-right">
                      Class*
                    </Label>
                    <div className="col-span-3">
                      <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="student" className="text-right">
                      Student*
                    </Label>
                    <div className="col-span-3">
                      <Select value={selectedStudent} onValueChange={handleStudentChange} disabled={!selectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedClass &&
                            students[selectedClass]?.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.name} ({student.rollNumber})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date*
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="attendance" className="text-right">
                      Attendance*
                    </Label>
                    <Input
                      id="attendance"
                      placeholder="e.g., 85%"
                      value={attendance}
                      onChange={(e) => setAttendance(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="catI" className="text-right">
                      CAT I Marks*
                    </Label>
                    <Input
                      id="catI"
                      placeholder="e.g., 42/50"
                      value={catI}
                      onChange={(e) => setCatI(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="catII" className="text-right">
                      CAT II Marks*
                    </Label>
                    <Input
                      id="catII"
                      placeholder="e.g., 45/50"
                      value={catII}
                      onChange={(e) => setCatII(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model" className="text-right">
                      Model Exam*
                    </Label>
                    <Input
                      id="model"
                      placeholder="e.g., 78/100"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="behavior" className="text-right">
                      Behavior*
                    </Label>
                    <div className="col-span-3">
                      <Select value={behavior} onValueChange={setBehavior}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select behavior" />
                        </SelectTrigger>
                        <SelectContent>
                          {behaviorOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="comments" className="text-right">
                      Comments
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder="Add comments about the student's performance"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="col-span-3"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateReport} className="bg-black hover:bg-gray-800 text-white">
                    Generate Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Student Reports
            </CardTitle>
            <CardDescription>View and manage student reports</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Behavior</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>{report.class}</TableCell>
                      <TableCell>{report.student}</TableCell>
                      <TableCell>{report.rollNumber}</TableCell>
                      <TableCell>{report.attendance}</TableCell>
                      <TableCell>
                        <span
                          className={
                            report.behavior === "Good"
                              ? "text-green-600"
                              : report.behavior === "Average"
                                ? "text-amber-600"
                                : "text-red-600"
                          }
                        >
                          {report.behavior}
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.sent ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          {!report.sent && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600"
                              onClick={() => handleMarkAsSent(report.id)}
                            >
                              Mark as Sent
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No reports found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>View detailed information about the report</DialogDescription>
          </DialogHeader>
          {currentViewReport && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Date:</Label>
                <div className="col-span-3">{new Date(currentViewReport.date).toLocaleDateString()}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Class:</Label>
                <div className="col-span-3">{currentViewReport.class}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Student:</Label>
                <div className="col-span-3">{currentViewReport.student}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Roll Number:</Label>
                <div className="col-span-3">{currentViewReport.rollNumber}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Attendance:</Label>
                <div className="col-span-3">{currentViewReport.attendance}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">CAT I Marks:</Label>
                <div className="col-span-3">{currentViewReport.catI}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">CAT II Marks:</Label>
                <div className="col-span-3">{currentViewReport.catII}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Model Exam:</Label>
                <div className="col-span-3">{currentViewReport.model}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Behavior:</Label>
                <div className="col-span-3">{currentViewReport.behavior}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Comments:</Label>
                <div className="col-span-3">{currentViewReport.comments}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
