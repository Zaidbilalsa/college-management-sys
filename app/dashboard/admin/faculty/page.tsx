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
import { Edit, Trash, Plus, Search, X, Loader2, Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)
  const [currentFaculty, setCurrentFaculty] = useState<any>({
    name: "",
    email: "",
    contact: "",
    classes: [],
    subjects: [],
    password: "",
  })
  const [tempPassword, setTempPassword] = useState("")
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    contact: "",
    classes: [] as string[],
    subjects: [] as string[],
    password: "",
  })
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Fetch faculty data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch faculty data
        const { data: facultyData, error: facultyError } = await supabase
          .from("faculty")
          .select("*, user_id, temp_password")
          .order("name")

        if (facultyError) throw facultyError

        // Fetch classes
        const { data: classesData, error: classesError } = await supabase.from("classes").select("name").order("name")

        if (classesError) throw classesError

        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("name")
          .order("name")

        if (subjectsError) throw subjectsError

        // For each faculty, fetch their assigned classes and subjects
        const facultyWithAssignments = await Promise.all(
          facultyData.map(async (f) => {
            // Fetch faculty classes
            const { data: facultyClasses, error: fcError } = await supabase
              .from("faculty_classes")
              .select("classes(name)")
              .eq("faculty_id", f.id)

            if (fcError) throw fcError

            // Fetch faculty subjects
            const { data: facultySubjects, error: fsError } = await supabase
              .from("faculty_subjects")
              .select("subjects(name)")
              .eq("faculty_id", f.id)

            if (fsError) throw fsError

            return {
              ...f,
              classes: facultyClasses.map((fc: any) => fc.classes.name),
              subjects: facultySubjects.map((fs: any) => fs.subjects.name),
            }
          }),
        )

        setFaculty(facultyWithAssignments)
        setAvailableClasses(classesData.map((c: any) => c.name))
        setAvailableSubjects(subjectsData.map((s: any) => s.name))
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load faculty data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.email || !newFaculty.contact || !newFaculty.password) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newFaculty.email,
        password: newFaculty.password,
        options: {
          data: {
            role: "faculty",
            name: newFaculty.name,
          },
        },
      })

      if (authError) throw authError

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user?.id,
            email: newFaculty.email,
            name: newFaculty.name,
            role: "faculty",
          },
        ])
        .select()

      if (userError) throw userError

      // Create faculty record
      const { data: facultyRecord, error: facultyError } = await supabase
        .from("faculty")
        .insert([
          {
            user_id: authData.user?.id,
            name: newFaculty.name,
            email: newFaculty.email,
            contact: newFaculty.contact,
          },
        ])
        .select()

      if (facultyError) throw facultyError

      // Get class and subject IDs
      if (newFaculty.classes.length > 0) {
        const { data: classData } = await supabase.from("classes").select("id, name").in("name", newFaculty.classes)

        // Insert faculty_classes records
        if (classData && classData.length > 0) {
          const facultyClasses = classData.map((cls) => ({
            faculty_id: facultyRecord[0].id,
            class_id: cls.id,
          }))

          await supabase.from("faculty_classes").insert(facultyClasses)
        }
      }

      if (newFaculty.subjects.length > 0) {
        const { data: subjectData } = await supabase.from("subjects").select("id, name").in("name", newFaculty.subjects)

        // Insert faculty_subjects records
        if (subjectData && subjectData.length > 0) {
          const facultySubjects = subjectData.map((subj) => ({
            faculty_id: facultyRecord[0].id,
            subject_id: subj.id,
          }))

          await supabase.from("faculty_subjects").insert(facultySubjects)
        }
      }

      // Update local state
      setFaculty([
        ...faculty,
        {
          ...facultyRecord[0],
          classes: newFaculty.classes,
          subjects: newFaculty.subjects,
        },
      ])

      // Show temporary password
      setTempPassword(newFaculty.password)
      setCurrentFaculty(facultyRecord[0])
      setIsAddDialogOpen(false)
      setIsCredentialsDialogOpen(true)

      // Reset form
      setNewFaculty({
        name: "",
        email: "",
        contact: "",
        classes: [],
        subjects: [],
        password: "",
      })
    } catch (error) {
      console.error("Error adding faculty:", error)
      toast({
        title: "Error",
        description: "Failed to add faculty member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditFaculty = async () => {
    if (!currentFaculty.name || !currentFaculty.email || !currentFaculty.contact) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Update faculty in database
      const { error: facultyError } = await supabase
        .from("faculty")
        .update({
          name: currentFaculty.name,
          email: currentFaculty.email,
          contact: currentFaculty.contact,
        })
        .eq("id", currentFaculty.id)

      if (facultyError) throw facultyError

      // Update user record
      if (currentFaculty.user_id) {
        const { error: userError } = await supabase
          .from("users")
          .update({
            name: currentFaculty.name,
            email: currentFaculty.email,
          })
          .eq("id", currentFaculty.user_id)

        if (userError) throw userError
      }

      // Delete existing faculty_classes
      await supabase.from("faculty_classes").delete().eq("faculty_id", currentFaculty.id)

      // Delete existing faculty_subjects
      await supabase.from("faculty_subjects").delete().eq("faculty_id", currentFaculty.id)

      // Insert new faculty classes
      if (currentFaculty.classes && currentFaculty.classes.length > 0) {
        const { data: classData } = await supabase.from("classes").select("id, name").in("name", currentFaculty.classes)

        if (classData && classData.length > 0) {
          const facultyClasses = classData.map((cls) => ({
            faculty_id: currentFaculty.id,
            class_id: cls.id,
          }))

          await supabase.from("faculty_classes").insert(facultyClasses)
        }
      }

      // Insert new faculty subjects
      if (currentFaculty.subjects && currentFaculty.subjects.length > 0) {
        const { data: subjectData } = await supabase
          .from("subjects")
          .select("id, name")
          .in("name", currentFaculty.subjects)

        if (subjectData && subjectData.length > 0) {
          const facultySubjects = subjectData.map((subj) => ({
            faculty_id: currentFaculty.id,
            subject_id: subj.id,
          }))

          await supabase.from("faculty_subjects").insert(facultySubjects)
        }
      }

      // Update local state
      setFaculty(faculty.map((f) => (f.id === currentFaculty.id ? currentFaculty : f)))

      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Faculty member updated successfully",
      })
    } catch (error) {
      console.error("Error updating faculty:", error)
      toast({
        title: "Error",
        description: "Failed to update faculty member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFaculty = async (id: string, userId: string) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      try {
        // Delete faculty from database
        const { error: facultyError } = await supabase.from("faculty").delete().eq("id", id)

        if (facultyError) throw facultyError

        // Delete user from auth
        if (userId) {
          const { error: authError } = await supabase.auth.admin.deleteUser(userId)
          if (authError) console.error("Error deleting user from auth:", authError)
        }

        // Delete user from users table
        if (userId) {
          const { error: userTableError } = await supabase.from("users").delete().eq("id", userId)
          if (userTableError) console.error("Error deleting user from users table:", userTableError)
        }

        // Update local state
        setFaculty(faculty.filter((f) => f.id !== id))

        toast({
          title: "Success",
          description: "Faculty member deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting faculty:", error)
        toast({
          title: "Error",
          description: "Failed to delete faculty member. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const openEditDialog = (faculty: any) => {
    // Ensure classes and subjects are initialized as arrays
    const facultyToEdit = {
      ...faculty,
      classes: faculty.classes || [],
      subjects: faculty.subjects || [],
    }
    setCurrentFaculty(facultyToEdit)
    setIsEditDialogOpen(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading faculty data...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faculty Management</h1>
            <p className="text-muted-foreground">Manage faculty members and their assigned classes</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search faculty..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Faculty Member</DialogTitle>
                  <DialogDescription>Enter the details of the new faculty member</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name*
                    </Label>
                    <Input
                      id="name"
                      value={newFaculty.name}
                      onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
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
                      value={newFaculty.email}
                      onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">
                      Contact*
                    </Label>
                    <Input
                      id="contact"
                      value={newFaculty.contact}
                      onChange={(e) => setNewFaculty({ ...newFaculty, contact: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password*
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newFaculty.password}
                      onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="classes" className="text-right">
                      Classes
                    </Label>
                    <div className="col-span-3">
                      <Select
                        onValueChange={(value) => {
                          if (!newFaculty.classes.includes(value)) {
                            setNewFaculty({ ...newFaculty, classes: [...newFaculty.classes, value] })
                          }
                        }}
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newFaculty.classes.map((cls) => (
                          <div key={cls} className="bg-secondary px-2 py-1 rounded-md flex items-center text-sm">
                            {cls}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() =>
                                setNewFaculty({ ...newFaculty, classes: newFaculty.classes.filter((c) => c !== cls) })
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subjects" className="text-right">
                      Subjects
                    </Label>
                    <div className="col-span-3">
                      <Select
                        onValueChange={(value) => {
                          if (!newFaculty.subjects.includes(value)) {
                            setNewFaculty({ ...newFaculty, subjects: [...newFaculty.subjects, value] })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newFaculty.subjects.map((subject) => (
                          <div key={subject} className="bg-secondary px-2 py-1 rounded-md flex items-center text-sm">
                            {subject}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() =>
                                setNewFaculty({
                                  ...newFaculty,
                                  subjects: newFaculty.subjects.filter((s) => s !== subject),
                                })
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFaculty}
                    className="bg-black hover:bg-gray-800 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Faculty"
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
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.length > 0 ? (
                  filteredFaculty.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell className="font-medium">{faculty.name}</TableCell>
                      <TableCell>{faculty.email}</TableCell>
                      <TableCell>{faculty.contact}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {faculty.classes && faculty.classes.length > 0 ? (
                            faculty.classes.map((cls: string) => (
                              <span key={cls} className="bg-secondary px-2 py-1 rounded-md text-xs">
                                {cls}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No classes assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {faculty.subjects && faculty.subjects.length > 0 ? (
                            faculty.subjects.map((subject: string) => (
                              <span key={subject} className="bg-secondary px-2 py-1 rounded-md text-xs">
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No subjects assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(faculty)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteFaculty(faculty.id, faculty.user_id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No faculty members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Faculty Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Faculty Member</DialogTitle>
            <DialogDescription>Update the details of the faculty member</DialogDescription>
          </DialogHeader>
          {currentFaculty && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="edit-name"
                  value={currentFaculty.name}
                  onChange={(e) => setCurrentFaculty({ ...currentFaculty, name: e.target.value })}
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
                  value={currentFaculty.email}
                  onChange={(e) => setCurrentFaculty({ ...currentFaculty, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contact" className="text-right">
                  Contact*
                </Label>
                <Input
                  id="edit-contact"
                  value={currentFaculty.contact}
                  onChange={(e) => setCurrentFaculty({ ...currentFaculty, contact: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-classes" className="text-right">
                  Classes
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) => {
                      if (!currentFaculty.classes.includes(value)) {
                        setCurrentFaculty({ ...currentFaculty, classes: [...currentFaculty.classes, value] })
                      }
                    }}
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentFaculty.classes &&
                      currentFaculty.classes.map((cls: string) => (
                        <div key={cls} className="bg-secondary px-2 py-1 rounded-md flex items-center text-sm">
                          {cls}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() =>
                              setCurrentFaculty({
                                ...currentFaculty,
                                classes: currentFaculty.classes.filter((c: string) => c !== cls),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-subjects" className="text-right">
                  Subjects
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) => {
                      if (!currentFaculty.subjects.includes(value)) {
                        setCurrentFaculty({ ...currentFaculty, subjects: [...currentFaculty.subjects, value] })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentFaculty.subjects &&
                      currentFaculty.subjects.map((subject: string) => (
                        <div key={subject} className="bg-secondary px-2 py-1 rounded-md flex items-center text-sm">
                          {subject}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() =>
                              setCurrentFaculty({
                                ...currentFaculty,
                                subjects: currentFaculty.subjects.filter((s: string) => s !== subject),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleEditFaculty}
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

      {/* Faculty Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Faculty Login Credentials</DialogTitle>
            <DialogDescription>
              Faculty member has been added successfully. Share these credentials with the faculty member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="faculty-email" className="text-right">
                Email
              </Label>
              <div className="col-span-3 flex items-center">
                <Input id="faculty-email" value={currentFaculty?.email || ""} readOnly className="col-span-3" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temp-password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 flex items-center">
                <Input id="temp-password" value={tempPassword} readOnly className="col-span-3" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => copyToClipboard(tempPassword)}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="col-span-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Please share these credentials with the faculty member. They can use these
                to log in to the system.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCredentialsDialogOpen(false)} className="bg-black hover:bg-gray-800 text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
