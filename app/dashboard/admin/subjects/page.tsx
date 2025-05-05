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
import { supabase } from "@/lib/supabase"

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentSubject, setCurrentSubject] = useState<any>(null)
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    semester: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Available semesters
  const availableSemesters = ["1", "2", "3", "4", "5", "6", "7", "8"]

  // Fetch subjects data on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("semester", { ascending: true })
          .order("name", { ascending: true })

        if (error) throw error

        setSubjects(data || [])
      } catch (error) {
        console.error("Error fetching subjects:", error)
        toast({
          title: "Error",
          description: "Failed to load subjects data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [toast])

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.semester.toString().includes(searchTerm),
  )

  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.semester) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Add subject to database
      const { data, error } = await supabase
        .from("subjects")
        .insert([
          {
            name: newSubject.name,
            code: newSubject.code,
            semester: Number.parseInt(newSubject.semester),
          },
        ])
        .select()

      if (error) throw error

      // Update local state
      setSubjects([...subjects, data[0]])

      // Reset form
      setNewSubject({
        name: "",
        code: "",
        semester: "",
      })

      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Subject added successfully",
      })
    } catch (error) {
      console.error("Error adding subject:", error)
      toast({
        title: "Error",
        description: "Failed to add subject. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubject = async () => {
    if (!currentSubject.name || !currentSubject.code || !currentSubject.semester) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Update subject in database
      const { data, error } = await supabase
        .from("subjects")
        .update({
          name: currentSubject.name,
          code: currentSubject.code,
          semester: Number.parseInt(currentSubject.semester),
        })
        .eq("id", currentSubject.id)
        .select()

      if (error) throw error

      // Update local state
      setSubjects(subjects.map((subject) => (subject.id === currentSubject.id ? data[0] : subject)))

      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Subject updated successfully",
      })
    } catch (error) {
      console.error("Error updating subject:", error)
      toast({
        title: "Error",
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (confirm("Are you sure you want to delete this subject? This will also delete all associated data.")) {
      try {
        // Delete subject from database
        const { error } = await supabase.from("subjects").delete().eq("id", id)

        if (error) throw error

        // Update local state
        setSubjects(subjects.filter((subject) => subject.id !== id))

        toast({
          title: "Success",
          description: "Subject deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting subject:", error)
        toast({
          title: "Error",
          description: "Failed to delete subject. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const openEditDialog = (subject: any) => {
    setCurrentSubject({
      ...subject,
      semester: subject.semester.toString(),
    })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading subjects data...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Subject Management</h1>
            <p className="text-muted-foreground">Manage subjects and their details</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search subjects..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>Enter the details of the new subject</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name*
                    </Label>
                    <Input
                      id="name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., Data Structures"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right">
                      Code*
                    </Label>
                    <Input
                      id="code"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g., CS201"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="semester" className="text-right">
                      Semester*
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newSubject.semester}
                        onValueChange={(value) => setNewSubject({ ...newSubject, semester: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSemesters.map((semester) => (
                            <SelectItem key={semester} value={semester}>
                              {semester}
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
                    onClick={handleAddSubject}
                    className="bg-black hover:bg-gray-800 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Subject"
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
                  <TableHead>Code</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.code}</TableCell>
                      <TableCell>{subject.semester}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/dashboard/admin/subjects/${subject.id}/faculty`}>Assign Faculty</a>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No subjects found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update the details of the subject</DialogDescription>
          </DialogHeader>
          {currentSubject && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="edit-name"
                  value={currentSubject.name}
                  onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">
                  Code*
                </Label>
                <Input
                  id="edit-code"
                  value={currentSubject.code}
                  onChange={(e) => setCurrentSubject({ ...currentSubject, code: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-semester" className="text-right">
                  Semester*
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentSubject.semester}
                    onValueChange={(value) => setCurrentSubject({ ...currentSubject, semester: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSemesters.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
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
              onClick={handleEditSubject}
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
