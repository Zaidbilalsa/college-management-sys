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
import { BarChart, Plus, FileDown, Search, Trash, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Mock data for exam types
const examTypes = ["CAT I", "CAT II", "Model Exam", "Final Exam"]

export default function MarksPage() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<string[]>([])
  const [facultySubjects, setFacultySubjects] = useState<Record<string, string[]>>({})
  const [students, setStudents] = useState<Record<string, any[]>>({})
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedExamType, setSelectedExamType] = useState("")
  const [marksRecords, setMarksRecords] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [examDate, setExamDate] = useState("")
  const [totalMarks, setTotalMarks] = useState(50)
  const [studentMarks, setStudentMarks] = useState<{ id: string; rollNumber: string; name: string; marks: number }[]>(
    [],
  )
  const [currentViewRecord, setCurrentViewRecord] = useState<any>(null)
  const [viewStudentMarks, setViewStudentMarks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Fetch user data and initialize
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)

      // Determine the correct faculty ID
      const facultyId = userData.facultyId

      // If facultyId is not available, try to get it from the database
      if (!facultyId && userData.id && !userData.id.startsWith("demo-")) {
        // Try to find faculty by user_id
        const getFacultyId = async () => {
          try {
            const { data, error } = await supabase.from("faculty").select("id").eq("user_id", userData.id).single()

            if (!error && data) {
              // Update user data with faculty ID
              userData.facultyId = data.id
              setUser(userData)
              localStorage.setItem("user", JSON.stringify(userData))
              fetchFacultyData(data.id)
            } else {
              console.error("Could not find faculty record:", error)
              toast({
                title: "Error",
                description: "Could not find your faculty record. Please contact administrator.",
                variant: "destructive",
              })
            }
          } catch (err) {
            console.error("Error fetching faculty ID:", err)
          }
        }

        getFacultyId()
      } else {
        // Use the available faculty ID or user ID as fallback
        fetchFacultyData(facultyId || userData.id)
      }
    }
  }, [])

  // Fetch faculty data (classes, subjects)
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

        // Fetch faculty's assigned subjects
        const { data: facultySubjectsData, error: subjectsError } = await supabase
          .from("faculty_subjects")
          .select(`
          subjects(id, name)
        `)
          .eq("faculty_id", facultyId)

        if (subjectsError) throw subjectsError

        if (facultySubjectsData && facultySubjectsData.length > 0) {
          // Group subjects by class (all subjects are available for all classes for now)
          const subjectsByClass: Record<string, string[]> = {}

          classNames.forEach((className) => {
            subjectsByClass[className] = facultySubjectsData.map((fs) => fs.subjects.name)
          })

          setFacultySubjects(subjectsByClass)
        }

        // Fetch students for each class
        const studentsMap: Record<string, any[]> = {}

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

        setStudents(studentsMap)
      } else {
        // If no classes are assigned, show a message or use fallback data
        toast({
          title: "No Classes Assigned",
          description: "You don't have any classes assigned. Please contact the administrator.",
          variant: "destructive",
        })
      }

      // Fetch marks records
      fetchMarksRecords(facultyId)
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

  // Fetch marks records
  const fetchMarksRecords = async (facultyId: string) => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          id, name, date, total_marks,
          classes(name),
          subjects(name)
        `)
        .eq("faculty_id", facultyId)
        .order("date", { ascending: false })

      if (error) throw error

      if (data) {
        const formattedRecords = await Promise.all(
          data.map(async (record) => {
            // Calculate average marks for each exam
            const { data: marksData, error: marksError } = await supabase
              .from("marks")
              .select("marks")
              .eq("exam_id", record.id)

            if (marksError) throw marksError

            let averageMarks = 0
            if (marksData && marksData.length > 0) {
              const sum = marksData.reduce((acc, mark) => acc + mark.marks, 0)
              averageMarks = Number.parseFloat((sum / marksData.length).toFixed(1))
            }

            return {
              id: record.id,
              date: record.date,
              class: record.classes.name,
              subject: record.subjects.name,
              examType: record.name,
              totalMarks: record.total_marks,
              averageMarks,
            }
          }),
        )

        setMarksRecords(formattedRecords)
      }
    } catch (error) {
      console.error("Error fetching marks records:", error)
      toast({
        title: "Error",
        description: "Failed to load marks records. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter marks records based on search term
  const filteredRecords = marksRecords.filter(
    (record) =>
      record.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.examType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm),
  )

  // Initialize student marks when class changes
  useEffect(() => {
    if (selectedClass && students[selectedClass]) {
      const initialMarks = students[selectedClass].map((student) => ({
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        marks: 0,
      }))
      setStudentMarks(initialMarks)
    }

    // Reset subject when class changes
    setSelectedSubject("")
  }, [selectedClass, students])

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
  }

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value)
  }

  const handleExamTypeChange = (value: string) => {
    setSelectedExamType(value)
  }

  const handleMarksChange = (studentId: string, marks: number) => {
    // Ensure marks are within valid range
    const validMarks = Math.min(Math.max(0, marks), totalMarks)

    setStudentMarks((prev) => prev.map((item) => (item.id === studentId ? { ...item, marks: validMarks } : item)))
  }

  const handleAddMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedExamType || !examDate) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
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

      if (classError) throw classError

      // Get subject ID
      const { data: subjectData, error: subjectError } = await supabase
        .from("subjects")
        .select("id")
        .eq("name", selectedSubject)
        .single()

      if (subjectError) throw subjectError

      // Calculate average marks
      const totalStudents = studentMarks.length
      const sumMarks = studentMarks.reduce((sum, item) => sum + item.marks, 0)
      const averageMarks = totalStudents > 0 ? sumMarks / totalStudents : 0

      // Get the correct faculty ID
      let facultyId = user.facultyId || user.id

      // Verify faculty exists in the faculty table
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("id")
        .eq("id", facultyId)
        .single()

      if (facultyError) {
        // If faculty doesn't exist with that ID, try to find by user_id
        const { data: facultyByUser, error: facultyByUserError } = await supabase
          .from("faculty")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (facultyByUserError) {
          throw new Error("Faculty record not found. Please contact administrator.")
        }

        // Use the found faculty ID
        facultyId = facultyByUser.id
      }

      // Insert exam record
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .insert([
          {
            name: selectedExamType,
            date: examDate,
            class_id: classData.id,
            subject_id: subjectData.id,
            faculty_id: facultyId,
            total_marks: totalMarks,
          },
        ])
        .select()

      if (examError) throw examError

      // Insert marks for each student
      for (const student of studentMarks) {
        const { error: marksError } = await supabase.from("marks").insert([
          {
            exam_id: examData[0].id,
            student_id: student.id,
            marks: student.marks,
          },
        ])

        if (marksError) throw marksError
      }

      // Add to local state
      const newRecord = {
        id: examData[0].id,
        date: examDate,
        class: selectedClass,
        subject: selectedSubject,
        examType: selectedExamType,
        totalMarks,
        averageMarks: Number.parseFloat(averageMarks.toFixed(1)),
      }

      setMarksRecords([newRecord, ...marksRecords])
      setIsAddDialogOpen(false)

      // Reset form
      setSelectedClass("")
      setSelectedSubject("")
      setSelectedExamType("")
      setExamDate("")
      setTotalMarks(50)

      toast({
        title: "Success",
        description: "Marks recorded successfully",
      })
    } catch (error) {
      console.error("Error adding marks:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record marks. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewMarks = async (record: any) => {
    setCurrentViewRecord(record)

    try {
      // For demo users, generate dummy student marks
      if (user.id.startsWith("demo-")) {
        const demoStudentMarks =
          students[record.class]?.map((student) => ({
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
            marks: Math.floor(Math.random() * (record.totalMarks * 0.5)) + Math.floor(record.totalMarks * 0.5), // Random marks between 50% and 100%
          })) || []

        setViewStudentMarks(demoStudentMarks)
        setIsViewDialogOpen(true)
        return
      }

      // Fetch student marks for this exam
      const { data, error } = await supabase
        .from("marks")
        .select(`
          marks,
          students(id, name, roll_number)
        `)
        .eq("exam_id", record.id)

      if (error) throw error

      if (data) {
        const studentMarksData = data.map((item) => ({
          id: item.students.id,
          name: item.students.name,
          rollNumber: item.students.roll_number,
          marks: item.marks,
        }))
        setViewStudentMarks(studentMarksData)
        setIsViewDialogOpen(true)
      }
    } catch (error) {
      console.error("Error fetching student marks:", error)
      toast({
        title: "Error",
        description: "Failed to load student marks. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMarks = async (id: string) => {
    if (!confirm("Are you sure you want to delete this marks record?")) return

    try {
      // For demo users, just remove from local state
      if (user.id.startsWith("demo-") || id.startsWith("demo-")) {
        setMarksRecords(marksRecords.filter((record) => record.id !== id))

        toast({
          title: "Success",
          description: "Marks record deleted successfully (Demo Mode)",
        })

        return
      }

      // Delete marks records first
      const { error: marksError } = await supabase.from("marks").delete().eq("exam_id", id)

      if (marksError) throw marksError

      // Delete exam record
      const { error } = await supabase.from("exams").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setMarksRecords(marksRecords.filter((record) => record.id !== id))

      toast({
        title: "Success",
        description: "Marks record deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting marks:", error)
      toast({
        title: "Error",
        description: "Failed to delete marks record. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportMarks = () => {
    // Create CSV content
    const headers = ["Date", "Class", "Subject", "Exam Type", "Total Marks", "Average Marks", "Percentage"]
    const rows = filteredRecords.map((record) => [
      new Date(record.date).toLocaleDateString(),
      record.class,
      record.subject,
      record.examType,
      record.totalMarks,
      record.averageMarks,
      `${Math.round((record.averageMarks / record.totalMarks) * 100)}%`,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `marks_records_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Complete",
      description: "Marks records have been exported to CSV",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Marks Management</h1>
            <p className="text-muted-foreground">Record and manage student marks</p>
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
                  Add Marks
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Record Marks</DialogTitle>
                  <DialogDescription>Enter marks for students in a class</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                          <SelectValue placeholder={selectedClass ? "Select a subject" : "Select a class first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedClass && facultySubjects[selectedClass] ? (
                            facultySubjects[selectedClass].map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No subjects available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="examType" className="text-right">
                      Exam Type*
                    </Label>
                    <div className="col-span-3">
                      <Select value={selectedExamType} onValueChange={handleExamTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          {examTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totalMarks" className="text-right">
                      Total Marks
                    </Label>
                    <Input
                      id="totalMarks"
                      type="number"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number.parseInt(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  {selectedClass && students[selectedClass] && students[selectedClass].length > 0 ? (
                    <div className="col-span-4 mt-4">
                      <h3 className="font-medium mb-2">Student Marks</h3>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Roll No</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Marks (out of {totalMarks})</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentMarks.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>{student.rollNumber}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={totalMarks}
                                    value={student.marks}
                                    onChange={(e) => handleMarksChange(student.id, Number.parseInt(e.target.value))}
                                    className="w-20"
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
                            // Open add student dialog
                            // This would be implemented in a real application
                            toast({
                              title: "Add Student",
                              description: "Student addition functionality would be implemented here",
                            })
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
                  <Button onClick={handleAddMarks} className="bg-black hover:bg-gray-800 text-white">
                    Save Marks
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={exportMarks}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* View Marks Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Student Marks</DialogTitle>
              <DialogDescription>
                {currentViewRecord?.examType} - {currentViewRecord?.subject} - {currentViewRecord?.class} (
                {currentViewRecord?.date})
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Marks (out of {currentViewRecord?.totalMarks})</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewStudentMarks.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.marks}</TableCell>
                        <TableCell>
                          <span
                            className={
                              student.marks / currentViewRecord?.totalMarks >= 0.6 ? "text-green-600" : "text-amber-600"
                            }
                          >
                            {Math.round((student.marks / currentViewRecord?.totalMarks) * 100)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Marks Records
            </CardTitle>
            <CardDescription>View and manage marks records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <p>Loading marks records...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Type</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Average Marks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.class}</TableCell>
                        <TableCell>{record.subject}</TableCell>
                        <TableCell>{record.examType}</TableCell>
                        <TableCell>{record.totalMarks}</TableCell>
                        <TableCell>
                          <span
                            className={
                              record.averageMarks / record.totalMarks >= 0.6 ? "text-green-600" : "text-amber-600"
                            }
                          >
                            {record.averageMarks} ({Math.round((record.averageMarks / record.totalMarks) * 100)}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewMarks(record)}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMarks(record.id)}
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
                      <TableCell colSpan={7} className="text-center py-4">
                        No marks records found
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
