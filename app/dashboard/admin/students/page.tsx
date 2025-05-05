"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Trash, Plus, Search, Loader2 } from "lucide-react"
import { getStudents, addStudent, updateStudent, deleteStudent, getClasses } from "@/lib/db"

// Mock data for relations
const availableRelations = ["Father", "Mother", "Guardian"]

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<any>(null)
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    rollNumber: "",
    class: "",
    department: "IT",
    semester: 0,
    year: 0,
    dob: "",
    mobile: "",
    parentName: "",
    parentMobile: "",
    parentEmail: "",
    relation: "",
  })
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Available semesters and years
  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8]
  const availableYears = [1, 2, 3, 4]

  // Fetch students data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, classesData] = await Promise.all([getStudents(), getClasses()])
        setStudents(studentsData)
        setAvailableClasses(classesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load student data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStudent = async () => {
    if (
      !newStudent.name ||
      !newStudent.email ||
      !newStudent.rollNumber ||
      !newStudent.class ||
      !newStudent.semester ||
      !newStudent.year
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Add student to database
      const addedStudent = await addStudent(newStudent)

      // Update local state
      setStudents([...students, addedStudent])

      // Reset form
      setNewStudent({
        name: "",
        email: "",
        rollNumber: "",
        class: "",
        department: "IT",
        semester: 0,
        year: 0,
        dob: "",
        mobile: "",
        parentName: "",
        parentMobile: "",
        parentEmail: "",
        relation: "",
      })

      setIsAddDialogOpen(false)
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

  const handleEditStudent = async () => {
    if (
      !currentStudent.name ||
      !currentStudent.email ||
      !currentStudent.rollNumber ||
      !currentStudent.class ||
      !currentStudent.semester ||
      !currentStudent.year
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Update student in database
      const updatedStudent = await updateStudent(currentStudent.id, currentStudent)

      // Update local state
      setStudents(students.map((s) => (s.id === currentStudent.id ? updatedStudent : s)))

      setIsEditDialogOpen(false)
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

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        // Delete student from database
        await deleteStudent(id)

        // Update local state
        setStudents(students.filter((s) => s.id !== id))

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

  const openEditDialog = (student: any) => {
    setCurrentStudent({ ...student })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading student data...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Student Management</h1>
            <p className="text-muted-foreground">Manage students and their details</p>
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Enter the details of the new student</DialogDescription>
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
                    <Label htmlFor="class" className="text-right">
                      Class*
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newStudent.class}
                        onValueChange={(value) => setNewStudent({ ...newStudent, class: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClasses.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department" className="text-right">
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={newStudent.department}
                      onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                      className="col-span-3"
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="semester" className="text-right">
                      Semester*
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newStudent.semester.toString()}
                        onValueChange={(value) => setNewStudent({ ...newStudent, semester: Number.parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSemesters.map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>
                              {sem}
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
                      <Select
                        value={newStudent.year.toString()}
                        onValueChange={(value) => setNewStudent({ ...newStudent, year: Number.parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
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

        <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
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
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.mobile}</TableCell>
                        <TableCell>{student.parentName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)}>
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
                      <TableCell colSpan={7} className="text-center py-4">
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                <Label htmlFor="edit-class" className="text-right">
                  Class*
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentStudent.class}
                    onValueChange={(value) => setCurrentStudent({ ...currentStudent, class: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-department" className="text-right">
                  Department
                </Label>
                <Input
                  id="edit-department"
                  value={currentStudent.department}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, department: e.target.value })}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-semester" className="text-right">
                  Semester*
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentStudent.semester.toString()}
                    onValueChange={(value) =>
                      setCurrentStudent({ ...currentStudent, semester: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSemesters.map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-year" className="text-right">
                  Year*
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentStudent.year.toString()}
                    onValueChange={(value) => setCurrentStudent({ ...currentStudent, year: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
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
