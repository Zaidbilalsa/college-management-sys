"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { BookOpen, Users, Plus, Edit, Trash, Search, Loader2 } from 'lucide-react'
import { supabase } from "@/lib/supabase"

export default function FacultyClassesPage() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false)
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<any>(null)
  const [newStudent, setNewStudent] = useState({
    name: "",
    rollNumber: "",
    email: "",
    dob: "",
    mobile: "",
    parentName: "",
    parentMobile: "",
    parentEmail: "",
    relation: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Available relations for parent
  const availableRelations = ["Father", "Mother", "Guardian"]

  // Fetch user data and initialize
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      fetchFacultyClasses(userData.facultyId || userData.id)
    }
  }, [])

  // Fetch faculty's assigned classes
  const fetchFacultyClasses = async (facultyId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("faculty_classes")
        .select(`
          classes(id, name, year, section)
        `)
        .eq("faculty_id", facultyId)

      if (error) throw error

      if (data && data.length > 0) {
        const formattedClasses = data.map((item) => ({
          id: item.classes.id,
          name: item.classes.name,
          year: item.classes.year,
          section: item.classes.section,
        }))
        
        setClasses(formattedClasses)
        
        // Select the first class by default
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].id)
          fetchStudents(formattedClasses[0].id)
        }
      } else {
        // If no classes found, use demo data
        const demoClasses = [
          { id: "1", name: "Second Year A", year: 2, section: "A" },
          { id: "2", name: "Third Year B", year: 3, section: "B" },
        ]
        setClasses(demoClasses)
        setSelectedClass(demoClasses[0].id)
        
        // Fetch demo students
        const demoStudents = [
          {
            id: "1",
            name: "John Doe",
            rollNumber: "IT2023001",
            email: "john@example.com",
            dob: "2002-05-15",
            mobile: "9876543210",
            parentName: "Robert Doe",
            parentMobile: "9876543211",
            parentEmail: "robert@example.com",
            relation: "Father",
          },
          {
            id: "2",
            name: "Jane Smith",
            rollNumber: "IT2023002",
            email: "jane@example.com",
            dob: "2002-07-22",
            mobile: "9876543212",
            parentName: "Mary Smith",
            parentMobile: "9876543213",
            parentEmail: "mary@example.com",
            relation: "Mother",
          },
        ]
        setStudents(demoStudents)
      }
    } catch (error) {
      console.error("Error fetching faculty classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again.",
        variant: "destructive",
      })
      
      // Use demo data on error
      const demoClasses = [
        { id: "1", name: "Second Year A", year: 2, section: "A" },
        { id: "2", name: "Third Year B", year: 3, section: "B" },
      ]
      setClasses(demoClasses)
      setSelectedClass(demoClasses[0].id)
      
      // Set demo students
      const demoStudents = [
        {
          id: "1",
          name: "John Doe",
          rollNumber: "IT2023001",
          email: "john@example.com",
          dob: "2002-05-15",
          mobile: "9876543210",
          parentName: "Robert Doe",
          parentMobile: "9876543211",
          parentEmail: "robert@example.com",
          relation: "Father",
        },
        {
          id: "2",
          name: "Jane Smith",
          rollNumber: "IT2023002",
          email: "jane@example.com",
          dob: "2002-07-22",
          mobile: "9876543212",
          parentName: "Mary Smith",
          parentMobile: "9876543213",
          parentEmail: "mary@example.com",
          relation: "Mother",
        },
      ]
      setStudents(demoStudents)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch students for a specific class
  const fetchStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, name, roll_number, email, dob, mobile, department, semester, year,
          parents(id, name, email, mobile, relation)
        `)
        .eq("class_id", classId)

      if (error) throw error

      if (data && data.length > 0) {
        const formattedStudents = data.map((student) => {
          const parent = student.parents && student.parents.length > 0 ? student.parents[0] : null
          
          return {
            id: student.id,
            name: student.name,
            rollNumber: student.roll_number,
            email: student.email,
            dob: student.dob,
            mobile: student.mobile,
            department: student.department,
            semester: student.semester,
            year: student.year,
            parentName: parent ? parent.name : "",
            parentEmail: parent ? parent.email : "",
            parentMobile: parent ? parent.mobile : "",
            relation: parent ? parent.relation : "",
          }
        })
        
        setStudents(formattedStudents)
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle class change
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    fetchStudents(classId)
  }

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle adding a new student
  const handleAddStudent = async () => {
    if (!selectedClass || !newStudent.name || !newStudent.rollNumber || !newStudent.email) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Insert student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .insert([
          {
            name: newStudent.name,
            roll_number: newStudent.rollNumber,
            email: newStudent.email,
            class_id: selectedClass,
            department: "IT", // Default department
            semester: classes.find(c => c.id === selectedClass)?.year * 2, // Calculate semester based on year
            year: classes.find(c => c.id === selectedClass)?.year,
            dob: newStudent.dob,
            mobile: newStudent.mobile,
          },
        ])
        .select()

      if (studentError) throw studentError

      // Insert parent if provided
      if (newStudent.parentName && newStudent.parentEmail) {
        const { error: parentError } = await supabase.from("parents").insert([
          {
            student_id: studentData[0].id,
            name: newStudent.parentName,
            email: newStudent.parentEmail,
            mobile: newStudent.parentMobile,
            relation: newStudent.relation,
          },
        ])

        if (parentError) throw parentError
      }

      // Refresh students list
      fetchStudents(selectedClass)

      // Reset form
      setNewStudent({
        name: "",
        rollNumber: "",
        email: "",
        dob: "",
        mobile: "",
        parentName: "",
        parentMobile: "",
        parentEmail: "",
        relation: "",
      })

      setIsAddStudentDialogOpen(false)
      toast({
        title: "Success",
        description: "Student added successfully",
      })
    } catch (error) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit student dialog
  const openEditStudentDialog = (student: any) => {
    setCurrentStudent(student)
    setIsEditStudentDialogOpen(true)
  }

  // Handle editing a student
  const handleEditStudent = async () => {
    if (!currentStudent.name || !currentStudent.rollNumber || !currentStudent.email) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Update student
      const { error: studentError } = await supabase
        .from("students")
        .update({
          name: currentStudent.name,
          roll_number: currentStudent.rollNumber,
          email: currentStudent.email,
          dob: currentStudent.dob,
          mobile: currentStudent.mobile,
        })
        .eq("id", currentStudent.id)

      if (studentError) throw studentError

      // Check if parent exists
      const { data: parentData, error: getParentError } = await supabase
        .from("parents")
        .select("id")
        .eq("student_id", currentStudent.id)

      if (getParentError) throw getParentError

      // Update or insert parent
      if (currentStudent.parentName && currentStudent.parentEmail) {
        if (parentData && parentData.length > 0) {
          // Update existing parent
          const { error: parentError } = await supabase
            .from("parents")
            .update({
              name: currentStudent.parentName,
              email: currentStudent.parentEmail,
              mobile: currentStudent.parentMobile,
              relation: currentStudent.relation,
            })
            .eq("id", parentData[0].id)

          if (parentError) throw parentError
        } else {
          // Insert new parent
          const { error: parentError } = await supabase.from("parents").insert([
            {
              student_id: currentStudent.id,
              name: currentStudent.parentName,
              email: currentStudent.parentEmail,
              mobile: currentStudent.parentMobile,
              relation: currentStudent.relation,
            },
          ])

          if (parentError) throw parentError
        }
      }

      // Refresh students list
      fetchStudents(selectedClass!)

      setIsEditStudentDialogOpen(false)
      toast({
        title: "Success",
        description: "Student updated successfully",
      })
    } catch (error) {
      console.error("Error updating student:", error)
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a student
  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        // Delete parent
        const { error: deleteParentError } = await supabase.from("parents").delete().eq("student_id", id)

        if (deleteParentError) throw deleteParentError

        // Delete student
        const { error } = await supabase.from("students").delete().eq("id", id)

        if (error) throw error

        // Refresh students list
        fetchStudents(selectedClass!)

        toast({
          title: "Success",
          description: "Student deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting student:", error)
        toast({
          title: "Error",
          description: "Failed to delete student. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Classes</h1>
            <p className="text-muted-foreground">Manage your assigned classes and students</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading classes data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Classes tabs */}
            <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Assigned Classes
                </CardTitle>
                <CardDescription>Classes assigned to you for this academic year</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={selectedClass || ""} onValueChange={handleClassChange}>
                  <TabsList className="mb-4">
                    {classes.map((cls) => (
                      <TabsTrigger key={cls.id} value={cls.id}>
                        {cls.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {classes.map((cls) => (
                    <TabsContent key={cls.id} value={cls.id}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{cls.name}</h3>
                          <p className="text-muted-foreground">Year {cls.year}, Section {cls.section}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search students..."
                              className="pl-8 w-full sm:w-[250px]"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Student
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Add New Student</DialogTitle>
                                <DialogDescription>Enter the details of the new student for {cls.name}</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="name" className="text-right">
                                    Name*
                                  </Label>
                                  <Input
                                    id="name"
                                    value={newStudent.name}
                                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="rollNumber" className="text-right">
                                    Roll Number*
                                  </Label>
                                  <Input
                                    id="rollNumber"
                                    value={newStudent.rollNumber}
                                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="email" className="text-right">
                                    Email*
                                  </Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={newStudent.email}
                                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="dob" className="text-right">
                                    Date of Birth
                                  </Label>
                                  <Input
                                    id="dob"
                                    type="date"
                                    value={newStudent.dob}
                                    onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="mobile" className="text-right">
                                    Mobile
                                  </Label>
                                  <Input
                                    id="mobile"
                                    value={newStudent.mobile}
                                    onChange={(e) => setNewStudent({ ...newStudent, mobile: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="parentName" className="text-right">
                                    Parent Name
                                  </Label>
                                  <Input
                                    id="parentName"
                                    value={newStudent.parentName}
                                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="parentMobile" className="text-right">
                                    Parent Mobile
                                  </Label>
                                  <Input
                                    id="parentMobile"
                                    value={newStudent.parentMobile}
                                    onChange={(e) => setNewStudent({ ...newStudent, parentMobile: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="parentEmail" className="text-right">
                                    Parent Email
                                  </Label>
                                  <Input
                                    id="parentEmail"
                                    type="email"
                                    value={newStudent.parentEmail}
                                    onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="relation" className="text-right">
                                    Relation
                                  </Label>
                                  <div className="col-span-3">
                                    <Select
                                      value={newStudent.relation}
                                      onValueChange={(value) => setNewStudent({ ...newStudent, relation: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select relation" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableRelations.map((relation) => (
                                          <SelectItem key={relation} value={relation}>
                                            {relation}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)} disabled={isSubmitting}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleAddStudent}
                                  className="bg-black hover:bg-gray-800 text-white"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Adding...
                                    </>
                                  ) : (
                                    "Add Student"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Students table */}
                      <Card>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Roll Number</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Mobile</TableHead>
                                <TableHead>Parent Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.rollNumber}</TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>{student.mobile}</TableCell>
                                    <TableCell>{student.parentName}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => openEditStudentDialog(student)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => handleDeleteStudent(student.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-4">
                                    No students found
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
        <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the details of the student</DialogDescription>
          </DialogHeader>
          {currentStudent && (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="edit-name"
                  value={currentStudent.name}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-rollNumber" className="text-right">
                  Roll Number*
                </Label>
                <Input
                  id="edit-rollNumber"
                  value={currentStudent.rollNumber}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, rollNumber: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email*
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={currentStudent.email}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-dob" className="text-right">
                  Date of Birth
                </Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={currentStudent.dob}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, dob: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-mobile" className="text-right">
                  Mobile
                </Label>
                <Input
                  id="edit-mobile"
                  value={currentStudent.mobile}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, mobile: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parentName" className="text-right">
                  Parent Name
                </Label>
                <Input
                  id="edit-parentName"
                  value={currentStudent.parentName}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, parentName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parentMobile" className="text-right">
                  Parent Mobile
                </Label>
                <Input
                  id="edit-parentMobile"
                  value={currentStudent.parentMobile}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, parentMobile: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parentEmail" className="text-right">
                  Parent Email
                </Label>
                <Input
                  id="edit-parentEmail"
                  type="email"
                  value={currentStudent.parentEmail}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, parentEmail: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-relation" className="text-right">
                  Relation
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentStudent.relation}
                    onValueChange={(value) => setCurrentStudent({ ...currentStudent, relation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRelations.map((relation) => (
                        <SelectItem key={relation} value={relation}>
                          {relation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStudentDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleEditStudent}
              className="bg-black hover:bg-gray-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
