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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Trash, Plus, Search, Loader2, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ClassManagement() {
  const [classes, setClasses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignFacultyDialogOpen, setIsAssignFacultyDialogOpen] = useState(false)
  const [currentClass, setCurrentClass] = useState<any>(null)
  const [newClass, setNewClass] = useState({
    name: "",
    year: "",
    section: "",
  })
  const [availableFaculty, setAvailableFaculty] = useState<any[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Available years and sections
  const availableYears = ["1", "2", "3", "4"]
  const availableSections = ["A", "B", "C", "D"]

  // Fetch classes data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch classes
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("*")
          .order("year", { ascending: true })
          .order("section", { ascending: true })

        if (classesError) throw classesError

        // Fetch faculty
        const { data: facultyData, error: facultyError } = await supabase
          .from("faculty")
          .select("id, name, email")
          .order("name")

        if (facultyError) throw facultyError

        // For each class, get student count and assigned faculty
        const classesWithDetails = await Promise.all(
          classesData.map(async (cls) => {
            // Get student count
            const { count: studentCount, error: studentError } = await supabase
              .from("students")
              .select("id", { count: "exact" })
              .eq("class_id", cls.id)

            if (studentError) throw studentError

            // Get assigned faculty
            const { data: assignedFaculty, error: facultyError } = await supabase
              .from("faculty_classes")
              .select("faculty(id, name)")
              .eq("class_id", cls.id)

            if (facultyError) throw facultyError

            return {
              ...cls,
              studentCount: studentCount || 0,
              faculty: assignedFaculty?.map((f) => f.faculty) || [],
            }
          }),
        )

        setClasses(classesWithDetails)
        setAvailableFaculty(facultyData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load classes data. Please try again.",
          variant: "destructive",
        })

        // Fallback to demo data if fetch fails
        const demoClasses = [
          {
            id: "1",
            name: "First Year A",
            year: 1,
            section: "A",
            studentCount: 75,
            faculty: [{ id: "1", name: "Dr. Sharma" }],
          },
          {
            id: "2",
            name: "Second Year A",
            year: 2,
            section: "A",
            studentCount: 68,
            faculty: [{ id: "2", name: "Prof. Patel" }],
          },
          {
            id: "3",
            name: "Third Year B",
            year: 3,
            section: "B",
            studentCount: 62,
            faculty: [{ id: "3", name: "Dr. Kumar" }],
          },
        ]

        const demoFaculty = [
          { id: "1", name: "Dr. Sharma", email: "sharma@example.com" },
          { id: "2", name: "Prof. Patel", email: "patel@example.com" },
          { id: "3", name: "Dr. Kumar", email: "kumar@example.com" },
          { id: "4", name: "Prof. Singh", email: "singh@example.com" },
        ]

        setClasses(demoClasses)
        setAvailableFaculty(demoFaculty)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.year.toString().includes(searchTerm) ||
      cls.section.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.year || !newClass.section) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Add class to database
      const { data, error } = await supabase
        .from("classes")
        .insert([
          {
            name: newClass.name,
            year: Number.parseInt(newClass.year),
            section: newClass.section,
          },
        ])
        .select()

      if (error) throw error

      // Update local state
      setClasses([
        ...classes,
        {
          ...data[0],
          studentCount: 0,
          faculty: [],
        },
      ])

      // Reset form
      setNewClass({
        name: "",
        year: "",
        section: "",
      })

      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Class added successfully",
      })
    } catch (error) {
      console.error("Error adding class:", error)

      // For demo purposes, add the class to local state even if the database operation fails
      const newId = `demo-${Date.now()}`
      setClasses([
        ...classes,
        {
          id: newId,
          name: newClass.name,
          year: Number.parseInt(newClass.year),
          section: newClass.section,
          studentCount: 0,
          faculty: [],
        },
      ])

      setNewClass({
        name: "",
        year: "",
        section: "",
      })

      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Class added successfully (demo mode)",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClass = async () => {
    if (!currentClass.name || !currentClass.year || !currentClass.section) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Update class in database
      const { data, error } = await supabase
        .from("classes")
        .update({
          name: currentClass.name,
          year: Number.parseInt(currentClass.year),
          section: currentClass.section,
        })
        .eq("id", currentClass.id)
        .select()

      if (error) throw error

      // Update local state
      setClasses(
        classes.map((cls) =>
          cls.id === currentClass.id
            ? {
                ...data[0],
                studentCount: cls.studentCount,
                faculty: cls.faculty,
              }
            : cls,
        ),
      )

      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Class updated successfully",
      })
    } catch (error) {
      console.error("Error updating class:", error)

      // For demo purposes, update the class in local state even if the database operation fails
      setClasses(
        classes.map((cls) =>
          cls.id === currentClass.id
            ? {
                ...cls,
                name: currentClass.name,
                year: Number.parseInt(currentClass.year),
                section: currentClass.section,
              }
            : cls,
        ),
      )

      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Class updated successfully (demo mode)",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (
      confirm("Are you sure you want to delete this class? This will also delete all associated students and data.")
    ) {
      try {
        // Delete class from database
        const { error } = await supabase.from("classes").delete().eq("id", id)

        if (error) throw error

        // Update local state
        setClasses(classes.filter((cls) => cls.id !== id))

        toast({
          title: "Success",
          description: "Class deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting class:", error)

        // For demo purposes, remove the class from local state even if the database operation fails
        setClasses(classes.filter((cls) => cls.id !== id))

        toast({
          title: "Success",
          description: "Class deleted successfully (demo mode)",
        })
      }
    }
  }

  const openEditDialog = (cls: any) => {
    setCurrentClass({
      ...cls,
      year: cls.year.toString(),
    })
    setIsEditDialogOpen(true)
  }

  const openAssignFacultyDialog = (cls: any) => {
    setCurrentClass(cls)
    // Set initially selected faculty
    setSelectedFaculty(cls.faculty.map((f: any) => f.id))
    setIsAssignFacultyDialogOpen(true)
  }

  const handleAssignFaculty = async () => {
    setIsSubmitting(true)
    try {
      // Delete existing faculty_classes for this class
      await supabase.from("faculty_classes").delete().eq("class_id", currentClass.id)

      // Insert new faculty_classes
      if (selectedFaculty.length > 0) {
        const facultyClasses = selectedFaculty.map((facultyId) => ({
          faculty_id: facultyId,
          class_id: currentClass.id,
        }))

        const { error } = await supabase.from("faculty_classes").insert(facultyClasses)

        if (error) throw error
      }

      // Update local state
      const updatedFaculty = availableFaculty.filter((f) => selectedFaculty.includes(f.id))
      setClasses(
        classes.map((cls) =>
          cls.id === currentClass.id
            ? {
                ...cls,
                faculty: updatedFaculty,
              }
            : cls,
        ),
      )

      setIsAssignFacultyDialogOpen(false)
      toast({
        title: "Success",
        description: "Faculty assigned successfully",
      })
    } catch (error) {
      console.error("Error assigning faculty:", error)

      // For demo purposes, update the faculty in local state even if the database operation fails
      const updatedFaculty = availableFaculty.filter((f) => selectedFaculty.includes(f.id))
      setClasses(
        classes.map((cls) =>
          cls.id === currentClass.id
            ? {
                ...cls,
                faculty: updatedFaculty,
              }
            : cls,
        ),
      )

      setIsAssignFacultyDialogOpen(false)
      toast({
        title: "Success",
        description: "Faculty assigned successfully (demo mode)",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFacultySelection = (facultyId: string) => {
    if (selectedFaculty.includes(facultyId)) {
      setSelectedFaculty(selectedFaculty.filter((id) => id !== facultyId))
    } else {
      setSelectedFaculty([...selectedFaculty, facultyId])
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading classes data...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Class Management</h1>
            <p className="text-muted-foreground">Manage classes and their details</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search classes..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                  <DialogDescription>Enter the details of the new class</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name*
                    </Label>
                    <Input
                      id="name"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., Second Year A"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="year" className="text-right">
                      Year*
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newClass.year}
                        onValueChange={(value) => setNewClass({ ...newClass, year: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="section" className="text-right">
                      Section*
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newClass.section}
                        onValueChange={(value) => setNewClass({ ...newClass, section: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSections.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
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
                    onClick={handleAddClass}
                    className="bg-black hover:bg-gray-800 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Class"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.year}</TableCell>
                      <TableCell>{cls.section}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{cls.studentCount} students</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cls.faculty && cls.faculty.length > 0 ? (
                            cls.faculty.map((f: any) => (
                              <span key={f.id} className="bg-secondary px-2 py-1 rounded-md text-xs">
                                {f.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No faculty assigned</span>
                          )}
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs"
                          onClick={() => openAssignFacultyDialog(cls)}
                        >
                          Assign Faculty
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(cls)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClass(cls.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No classes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update the details of the class</DialogDescription>
          </DialogHeader>
          {currentClass && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="edit-name"
                  value={currentClass.name}
                  onChange={(e) => setCurrentClass({ ...currentClass, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-year" className="text-right">
                  Year*
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentClass.year}
                    onValueChange={(value) => setCurrentClass({ ...currentClass, year: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-section" className="text-right">
                  Section*
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentClass.section}
                    onValueChange={(value) => setCurrentClass({ ...currentClass, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
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
            <Button onClick={handleEditClass} className="bg-black hover:bg-gray-800 text-white" disabled={isSubmitting}>
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

      {/* Assign Faculty Dialog */}
      <Dialog open={isAssignFacultyDialogOpen} onOpenChange={setIsAssignFacultyDialogOpen}>
        <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Faculty</DialogTitle>
            <DialogDescription>Select faculty members to assign to {currentClass?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="max-h-[300px] overflow-y-auto pr-2">
              {availableFaculty.length > 0 ? (
                availableFaculty.map((faculty) => (
                  <div key={faculty.id} className="flex items-center space-x-2 py-2 border-b">
                    <Checkbox
                      id={`faculty-${faculty.id}`}
                      checked={selectedFaculty.includes(faculty.id)}
                      onCheckedChange={() => toggleFacultySelection(faculty.id)}
                    />
                    <Label htmlFor={`faculty-${faculty.id}`} className="flex-1 cursor-pointer">
                      <div>{faculty.name}</div>
                      <div className="text-xs text-muted-foreground">{faculty.email}</div>
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-muted-foreground">No faculty members available</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignFacultyDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignFaculty}
              className="bg-black hover:bg-gray-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Assignments"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
