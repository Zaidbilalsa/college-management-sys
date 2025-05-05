"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Plus, FileDown, Search, Edit, Trash, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// List of months
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<string[]>([])
  const [subjects, setSubjects] = useState<Record<string, string[]>>({})
  const [students, setStudents] = useState<Record<string, any[]>>({})
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [workingDays, setWorkingDays] = useState(22)
  const [studentAttendance, setStudentAttendance] = useState<
    { id: number; rollNumber: string; name: string; presentDays: number; absentDays: number; odDays: number }[]
  >([])
  const [currentEditRecord, setCurrentEditRecord] = useState<any>(null)
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

  // Fetch faculty data (classes, subjects)
  const fetchFacultyData = async (facultyId: string) => {
    console.log("Faculty ID being used:", facultyId)
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

        // Fetch subjects for each class
        const subjectsMap: Record<string, string[]> = {}
        const studentsMap: Record<string, any[]> = {}

        // Fetch all subjects assigned to this faculty
        const { data: facultySubjects, error: subjectsError } = await supabase
          .from("faculty_subjects")
          .select(`
            subjects(id, name)
          `)
          .eq("faculty_id", facultyId)

        if (subjectsError) throw subjectsError

        // Create a list of all subjects taught by this faculty
        const allSubjects = facultySubjects.map((fs) => fs.subjects.name)

        // Assign all subjects to each class for simplicity
        // In a real application, you would have a more complex relationship between classes and subjects
        for (const className of classNames) {
          subjectsMap[className] = allSubjects
        }

        // Fetch students for each class
        for (const fc of facultyClasses) {
          // Fetch students for this class
          const { data: classStudents, error: studentsError } = await supabase
            .from("students")
            .select(`
              id, name, roll_number, email
            `)
            .eq("class_id", fc.classes.id)

          if (studentsError) throw studentsError

          if (classStudents && classStudents.length > 0) {
            studentsMap[fc.classes.name] = classStudents.map((student) => ({
              id: student.id,
              name: student.name,
              rollNumber: student.roll_number,
              email: student.email,
            }))
          } else {
            studentsMap[fc.classes.name] = []
          }
        }

        setSubjects(subjectsMap)
        setStudents(studentsMap)
      }

      // Fetch attendance records
      fetchAttendanceRecords(facultyId)
    } catch (error) {
      console.error("Error fetching faculty data:", error)
      toast({
        title: "Error",
        description: "Failed to load faculty data. Please try again.",
        variant: "destructive",
      })

      // Use demo data on error
      const demoClasses = ["Second Year A", "Third Year B"]
      setClasses(demoClasses)

      const demoSubjects = {
        "Second Year A": ["Data Structures", "Algorithms"],
        "Third Year B": ["Database Management", "Computer Networks"],
      }
      setSubjects(demoSubjects)

      const demoStudents = {
        "Second Year A": [
          { id: 1, name: "John Doe", rollNumber: "IT2023001", email: "john@example.com" },
          { id: 2, name: "Jane Smith", rollNumber: "IT2023002", email: "jane@example.com" },
        ],
        "Third Year B": [
          { id: 3, name: "Alice Johnson", rollNumber: "IT2022001", email: "alice@example.com" },
          { id: 4, name: "Bob Williams", rollNumber: "IT2022002", email: "bob@example.com" },
        ],
      }
      setStudents(demoStudents)

      // Demo attendance records
      const demoAttendance = [
        {
          id: 1,
          month: "April",
          year: "2023",
          class: "Second Year A",
          subject: "Data Structures",
          workingDays: 22,
          presentDays: 18,
          absentDays: 3,
          odDays: 1,
        },
        {
          id: 2,
          month: "March",
          year: "2023",
          class: "Third Year B",
          subject: "Database Management",
          workingDays: 20,
          presentDays: 17,
          absentDays: 2,
          odDays: 1,
        },
      ]
      setAttendanceRecords(demoAttendance)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch attendance records
  const fetchAttendanceRecords = async (facultyId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id, month, year, working_days, present_days, absent_days, od_days,
          classes(name),
          subjects(name)
        `)
        .eq("faculty_id", facultyId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })

      if (error) throw error

      if (data) {
        const formattedRecords = data.map((record) => ({
          id: record.id,
          month: record.month,
          year: record.year,
          class: record.classes.name,
          subject: record.subjects.name,
          workingDays: record.working_days,
          presentDays: record.present_days,
          absentDays: record.absent_days,
          odDays: record.od_days,
        }))
        setAttendanceRecords(formattedRecords)
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance records. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter attendance records based on search term
  const filteredRecords = attendanceRecords.filter(
    (record) =>
      record.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.year.includes(searchTerm),
  )

  // Initialize student attendance when class changes
  useEffect(() => {
    if (selectedClass && students[selectedClass]) {
      const initialAttendance = students[selectedClass].map((student) => ({
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        presentDays: Math.floor(workingDays * 0.8), // Default 80% attendance
        absentDays: Math.floor(workingDays * 0.15), // Default 15% absence
        odDays: Math.floor(workingDays * 0.05), // Default 5% OD
      }))
      setStudentAttendance(initialAttendance)
    }
  }, [selectedClass, workingDays, students])

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedSubject("")
  }

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value)
  }

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
  }

  const handlePresentDaysChange = (studentId: number, value: number) => {
    setStudentAttendance((prev) =>
      prev.map((item) =>
        item.id === studentId
          ? {
              ...item,
              presentDays: value,
              // Ensure total days don't exceed working days
              absentDays: Math.min(item.absentDays, workingDays - value - item.odDays),
            }
          : item,
      ),
    )
  }

  const handleAbsentDaysChange = (studentId: number, value: number) => {
    setStudentAttendance((prev) =>
      prev.map((item) =>
        item.id === studentId
          ? {
              ...item,
              absentDays: value,
              // Ensure total days don't exceed working days
              presentDays: Math.min(item.presentDays, workingDays - value - item.odDays),
            }
          : item,
      ),
    )
  }

  const handleOdDaysChange = (studentId: number, value: number) => {
    setStudentAttendance((prev) =>
      prev.map((item) =>
        item.id === studentId
          ? {
              ...item,
              odDays: value,
              // Ensure total days don't exceed working days
              presentDays: Math.min(item.presentDays, workingDays - value - item.absentDays),
            }
          : item,
      ),
    )
  }

  const handleAddAttendance = async () => {
    if (!selectedClass || !selectedSubject || !selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if attendance for this month/year/class/subject already exists
    const exists = attendanceRecords.some(
      (record) =>
        record.month === selectedMonth &&
        record.year === selectedYear &&
        record.class === selectedClass &&
        record.subject === selectedSubject,
    )

    if (exists) {
      toast({
        title: "Error",
        description: "Attendance record already exists for this month, year, class and subject",
        variant: "destructive",
      })
      return
    }

    try {
      // Get class ID
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("name", selectedClass)
        .single()

      if (classError) {
        console.error("Class error:", classError)
        throw new Error(`Failed to get class ID: ${classError.message}`)
      }

      // Get subject ID
      const { data: subjectData, error: subjectError } = await supabase
        .from("subjects")
        .select("id")
        .eq("name", selectedSubject)
        .single()

      if (subjectError) {
        console.error("Subject error:", subjectError)
        throw new Error(`Failed to get subject ID: ${subjectError.message}`)
      }

      // Calculate average attendance
      const totalStudents = studentAttendance.length
      const avgPresentDays = Math.round(
        studentAttendance.reduce((sum, student) => sum + student.presentDays, 0) / totalStudents,
      )
      const avgAbsentDays = Math.round(
        studentAttendance.reduce((sum, student) => sum + student.absentDays, 0) / totalStudents,
      )
      const avgOdDays = Math.round(studentAttendance.reduce((sum, student) => sum + student.odDays, 0) / totalStudents)

      // First, check if the faculty exists in the faculty table
      let facultyId = user?.facultyId || user?.id
      console.log("User object:", user)
      console.log("Attempting to use faculty ID:", facultyId)

      // Check if the faculty ID exists in the faculty table
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("id")
        .eq("id", facultyId)
        .single()

      if (facultyError) {
        console.error("Faculty check error:", facultyError)

        // If faculty doesn't exist with the current ID, try to find the faculty by email
        if (user?.email) {
          const { data: facultyByEmail, error: emailError } = await supabase
            .from("faculty")
            .select("id")
            .eq("email", user.email)
            .single()

          if (!emailError && facultyByEmail) {
            facultyId = facultyByEmail.id
            console.log("Found faculty by email, using ID:", facultyId)
          } else {
            console.error("Could not find faculty by email:", emailError)
            throw new Error("Your faculty account is not properly set up. Please contact an administrator.")
          }
        } else {
          throw new Error("Faculty ID not found. Please log out and log back in.")
        }
      }

      // Insert attendance record
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .insert([
          {
            date: `${selectedYear}-${months.indexOf(selectedMonth) + 1}-01`, // Add proper date in YYYY-MM-DD format
            month: selectedMonth,
            year: selectedYear,
            class_id: classData.id,
            subject_id: subjectData.id,
            faculty_id: facultyId, // Use the verified faculty ID
            working_days: workingDays,
            present_days: avgPresentDays,
            absent_days: avgAbsentDays,
            od_days: avgOdDays,
          },
        ])
        .select()

      if (attendanceError) {
        console.error("Attendance insert error:", attendanceError)
        throw new Error(`Failed to insert attendance: ${attendanceError.message}`)
      }

      if (!attendanceData || attendanceData.length === 0) {
        throw new Error("No attendance data returned after insert")
      }

      // Insert individual student attendance records
      for (const student of studentAttendance) {
        const { error: studentAttendanceError } = await supabase.from("student_attendance").insert([
          {
            attendance_id: attendanceData[0].id,
            student_id: student.id,
            present_days: student.presentDays,
            absent_days: student.absentDays,
            od_days: student.odDays,
          },
        ])

        if (studentAttendanceError) {
          console.error("Student attendance error:", studentAttendanceError)
          throw new Error(`Failed to insert student attendance: ${studentAttendanceError.message}`)
        }
      }

      // Add to local state
      const newRecord = {
        id: attendanceData[0].id,
        month: selectedMonth,
        year: selectedYear,
        class: selectedClass,
        subject: selectedSubject,
        workingDays: workingDays,
        presentDays: avgPresentDays,
        absentDays: avgAbsentDays,
        odDays: avgOdDays,
      }

      setAttendanceRecords([newRecord, ...attendanceRecords])
      setIsAddDialogOpen(false)

      // Reset form
      setSelectedClass("")
      setSelectedSubject("")
      setSelectedMonth("")
      setWorkingDays(22)

      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      })
    } catch (error) {
      console.error("Error adding attendance:", error instanceof Error ? error.message : error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record attendance. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditAttendance = (record: any) => {
    setCurrentEditRecord(record)
    setSelectedClass(record.class)
    setSelectedSubject(record.subject)
    setSelectedMonth(record.month)
    setSelectedYear(record.year)
    setWorkingDays(record.workingDays)

    // Fetch student attendance details for this record
    fetchStudentAttendanceDetails(record.id)
    setIsEditDialogOpen(true)
  }

  const fetchStudentAttendanceDetails = async (attendanceId: number) => {
    try {
      const { data, error } = await supabase
        .from("student_attendance")
        .select(`
          student_id, present_days, absent_days, od_days,
          students(id, name, roll_number)
        `)
        .eq("attendance_id", attendanceId)

      if (error) throw error

      if (data) {
        const studentDetails = data.map((item) => ({
          id: item.student_id,
          name: item.students.name,
          rollNumber: item.students.roll_number,
          presentDays: item.present_days,
          absentDays: item.absent_days,
          odDays: item.od_days,
        }))
        setStudentAttendance(studentDetails)
      }
    } catch (error) {
      console.error("Error fetching student attendance details:", error)
      toast({
        title: "Error",
        description: "Failed to load student attendance details.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAttendance = async () => {
    if (!currentEditRecord) return

    try {
      // Calculate average attendance
      const totalStudents = studentAttendance.length
      const avgPresentDays = Math.round(
        studentAttendance.reduce((sum, student) => sum + student.presentDays, 0) / totalStudents,
      )
      const avgAbsentDays = Math.round(
        studentAttendance.reduce((sum, student) => sum + student.absentDays, 0) / totalStudents,
      )
      const avgOdDays = Math.round(studentAttendance.reduce((sum, student) => sum + student.odDays, 0) / totalStudents)

      // Update attendance record
      const { error: attendanceError } = await supabase
        .from("attendance")
        .update({
          date: `${selectedYear}-${months.indexOf(selectedMonth) + 1}-01`, // Add proper date in YYYY-MM-DD format
          working_days: workingDays,
          present_days: avgPresentDays,
          absent_days: avgAbsentDays,
          od_days: avgOdDays,
        })
        .eq("id", currentEditRecord.id)

      if (attendanceError) throw attendanceError

      // Update individual student attendance records
      for (const student of studentAttendance) {
        const { error: studentAttendanceError } = await supabase
          .from("student_attendance")
          .update({
            present_days: student.presentDays,
            absent_days: student.absentDays,
            od_days: student.odDays,
          })
          .eq("attendance_id", currentEditRecord.id)
          .eq("student_id", student.id)

        if (studentAttendanceError) throw studentAttendanceError
      }

      // Update local state
      setAttendanceRecords(
        attendanceRecords.map((record) =>
          record.id === currentEditRecord.id
            ? {
                ...record,
                workingDays,
                presentDays: avgPresentDays,
                absentDays: avgAbsentDays,
                odDays: avgOdDays,
              }
            : record,
        ),
      )

      setIsEditDialogOpen(false)
      setCurrentEditRecord(null)

      toast({
        title: "Success",
        description: "Attendance updated successfully",
      })
    } catch (error) {
      console.error("Error updating attendance:", error)
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAttendance = async (id: number) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return

    try {
      // Delete student attendance records first
      const { error: studentAttendanceError } = await supabase
        .from("student_attendance")
        .delete()
        .eq("attendance_id", id)

      if (studentAttendanceError) throw studentAttendanceError

      // Delete attendance record
      const { error } = await supabase.from("attendance").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setAttendanceRecords(attendanceRecords.filter((record) => record.id !== id))

      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting attendance:", error)
      toast({
        title: "Error",
        description: "Failed to delete attendance record. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportAttendance = () => {
    // Create CSV content
    const headers = [
      "Month",
      "Year",
      "Class",
      "Subject",
      "Working Days",
      "Present Days",
      "Absent Days",
      "OD Days",
      "Attendance %",
    ]
    const rows = filteredRecords.map((record) => [
      record.month,
      record.year,
      record.class,
      record.subject,
      record.workingDays,
      record.presentDays,
      record.absentDays,
      record.odDays,
      `${Math.round(((record.presentDays + record.odDays) / record.workingDays) * 100)}%`,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_records_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Complete",
      description: "Attendance records have been exported to CSV",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">Record and manage monthly student attendance</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search records..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Monthly Attendance
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Record Monthly Attendance</DialogTitle>
                  <DialogDescription>Enter monthly attendance details for students</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="month" className="text-right">
                      Month*
                    </Label>
                    <div className="col-span-3">
                      <Select value={selectedMonth} onValueChange={handleMonthChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="year" className="text-right">
                      Year*
                    </Label>
                    <div className="col-span-3">
                      <Select value={selectedYear} onValueChange={handleYearChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {[2022, 2023, 2024, 2025].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                    <Label htmlFor="subject" className="text-right">
                      Subject*
                    </Label>
                    <div className="col-span-3">
                      <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={!selectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedClass &&
                            subjects[selectedClass]?.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="workingDays" className="text-right">
                      Working Days
                    </Label>
                    <Input
                      id="workingDays"
                      type="number"
                      value={workingDays}
                      onChange={(e) => setWorkingDays(Number.parseInt(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  {selectedClass && students[selectedClass] && students[selectedClass].length > 0 ? (
                    <div className="col-span-4 mt-4">
                      <h3 className="font-medium mb-2">Student Monthly Attendance</h3>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Roll No</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Present Days</TableHead>
                              <TableHead>Absent Days</TableHead>
                              <TableHead>OD Days</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentAttendance.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>{student.rollNumber}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={workingDays}
                                    value={student.presentDays}
                                    onChange={(e) =>
                                      handlePresentDaysChange(student.id, Number.parseInt(e.target.value))
                                    }
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={workingDays}
                                    value={student.absentDays}
                                    onChange={(e) =>
                                      handleAbsentDaysChange(student.id, Number.parseInt(e.target.value))
                                    }
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={workingDays}
                                    value={student.odDays}
                                    onChange={(e) => handleOdDaysChange(student.id, Number.parseInt(e.target.value))}
                                    className="w-16"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : selectedClass ? (
                    <div className="col-span-4 mt-4">
                      <div className="text-center p-4 border rounded-md">
                        <p className="mb-4">No students found for this class. Would you like to add students?</p>
                        <Button
                          onClick={() => {
                            // Redirect to the classes page to add students
                            window.location.href = "/dashboard/faculty/classes"
                          }}
                        >
                          Add Students
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAttendance} className="bg-black hover:bg-gray-800 text-white">
                    Save Attendance
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={exportAttendance}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Edit Monthly Attendance</DialogTitle>
              <DialogDescription>
                Update attendance for {currentEditRecord?.month} {currentEditRecord?.year}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editWorkingDays" className="text-right">
                  Working Days
                </Label>
                <Input
                  id="editWorkingDays"
                  type="number"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number.parseInt(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="col-span-4 mt-4">
                <h3 className="font-medium mb-2">Student Monthly Attendance</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Present Days</TableHead>
                        <TableHead>Absent Days</TableHead>
                        <TableHead>OD Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentAttendance.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={workingDays}
                              value={student.presentDays}
                              onChange={(e) => handlePresentDaysChange(student.id, Number.parseInt(e.target.value))}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={workingDays}
                              value={student.absentDays}
                              onChange={(e) => handleAbsentDaysChange(student.id, Number.parseInt(e.target.value))}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={workingDays}
                              value={student.odDays}
                              onChange={(e) => handleOdDaysChange(student.id, Number.parseInt(e.target.value))}
                              className="w-16"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAttendance} className="bg-black hover:bg-gray-800 text-white">
                Update Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Monthly Attendance Records
            </CardTitle>
            <CardDescription>View and manage monthly attendance records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Loading attendance records...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Working Days</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>OD</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.month}</TableCell>
                        <TableCell>{record.year}</TableCell>
                        <TableCell>{record.class}</TableCell>
                        <TableCell>{record.subject}</TableCell>
                        <TableCell>{record.workingDays}</TableCell>
                        <TableCell>{record.presentDays}</TableCell>
                        <TableCell>{record.absentDays}</TableCell>
                        <TableCell>{record.odDays}</TableCell>
                        <TableCell>
                          <span
                            className={
                              (record.presentDays + record.odDays) / record.workingDays >= 0.75
                                ? "text-green-600"
                                : "text-amber-600"
                            }
                          >
                            {Math.round(((record.presentDays + record.odDays) / record.workingDays) * 100)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAttendance(record)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAttendance(record.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-4">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
