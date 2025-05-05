import { z } from "zod"

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "faculty", "student", "parent"]),
})

// Faculty validation schema
export const facultySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  contact: z.string().min(10, "Contact number must be at least 10 characters"),
  classes: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
})

// Student validation schema
export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  rollNumber: z.string().min(3, "Roll number must be at least 3 characters"),
  class: z.string().min(1, "Class is required"),
  department: z.string().min(1, "Department is required"),
  semester: z.number().min(1).max(8),
  year: z.number().min(1).max(4),
  dob: z.string().optional(),
  mobile: z.string().optional(),
  parentName: z.string().optional(),
  parentMobile: z.string().optional(),
  parentEmail: z.string().email("Please enter a valid parent email").optional(),
  relation: z.string().optional(),
})

// Attendance validation schema
export const attendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  class: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  workingDays: z.number().min(1, "Working days must be at least 1"),
  facultyId: z.string().uuid("Invalid faculty ID"),
})

export const studentAttendanceSchema = z.array(
  z.object({
    id: z.number().or(z.string()),
    status: z.enum(["present", "absent", "od"]),
  }),
)

// Marks validation schema
export const marksSchema = z.object({
  date: z.string().min(1, "Date is required"),
  class: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  examType: z.string().min(1, "Exam type is required"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  facultyId: z.string().uuid("Invalid faculty ID"),
})

export const studentMarksSchema = z.array(
  z.object({
    id: z.number().or(z.string()),
    marks: z.number().min(0, "Marks cannot be negative"),
  }),
)

// Report validation schema
export const reportSchema = z.object({
  date: z.string().min(1, "Date is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  parentEmail: z.string().email("Please enter a valid parent email"),
  attendance: z.string().min(1, "Attendance is required"),
  catI: z.string().min(1, "CAT I marks are required"),
  catII: z.string().min(1, "CAT II marks are required"),
  model: z.string().min(1, "Model exam marks are required"),
  behavior: z.string().min(1, "Behavior rating is required"),
  comments: z.string().optional(),
  facultyId: z.string().uuid("Invalid faculty ID"),
})

// Validation function
export function validateData<T>(schema: z.ZodType<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ")
      return { success: false, error: errorMessage }
    }
    return { success: false, error: "Validation failed" }
  }
}
