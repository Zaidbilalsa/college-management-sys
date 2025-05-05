import { supabase } from "./supabase"
import { generateRandomPassword } from "./utils"

// Authentication functions
export async function adminLogin(email: string, password: string) {
  try {
    // First authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw new Error(authError.message)

    // For demo purposes, if no auth user exists yet, allow login with hardcoded admin credentials
    if (email === "admin@example.com" && password === "admin123") {
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

      if (!userError && userData) {
        return userData
      }

      // If admin user doesn't exist in the database yet, return a mock admin user
      return {
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      }
    }

    // Then check if user is an admin in our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", "admin")
      .single()

    if (userError || !userData) throw new Error("Invalid credentials or you don't have admin privileges")

    return userData
  } catch (error) {
    console.error("Admin login error:", error)
    throw error
  }
}

// Fix the facultyLogin function to properly handle login
export async function facultyLogin(email: string, password: string) {
  try {
    // First authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // For development/testing purposes, allow login with demo credentials
      if (email === "faculty@example.com" && password === "faculty123") {
        // Check if faculty exists in the database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .eq("role", "faculty")
          .single()

        if (!userError && userData) {
          // Get faculty details
          const { data: facultyData, error: facultyError } = await supabase
            .from("faculty")
            .select("*")
            .eq("user_id", userData.id)
            .single()

          if (!facultyError && facultyData) {
            return { user: userData, faculty: facultyData }
          }
        }

        // If no faculty record exists, create a demo faculty user
        return {
          user: {
            id: "demo-faculty-id",
            email: "faculty@example.com",
            name: "Demo Faculty",
            role: "faculty",
          },
          faculty: {
            id: "demo-faculty-profile",
            user_id: "demo-faculty-id",
            name: "Demo Faculty",
            email: "faculty@example.com",
            contact: "1234567890",
          },
        }
      } else {
        throw new Error(authError.message)
      }
    }

    // Then check if user is a faculty in our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", "faculty")
      .single()

    if (userError || !userData) throw new Error("Invalid credentials or you don't have faculty privileges")

    // Get faculty details
    const { data: facultyData, error: facultyError } = await supabase
      .from("faculty")
      .select("*")
      .eq("user_id", userData.id)
      .single()

    if (facultyError) {
      // If faculty record doesn't exist, create one
      const { data: newFacultyData, error: newFacultyError } = await supabase
        .from("faculty")
        .insert([
          {
            user_id: userData.id,
            name: userData.name,
            email: userData.email,
            contact: "",
          },
        ])
        .select()

      if (newFacultyError) throw new Error("Failed to create faculty profile")

      return { user: userData, faculty: newFacultyData[0] }
    }

    return { user: userData, faculty: facultyData }
  } catch (error) {
    console.error("Faculty login error:", error)
    throw error
  }
}

// Fix the studentLogin function to handle date format correctly
export async function studentLogin(rollNumber: string, dob: string) {
  try {
    console.log("Attempting student login with:", { rollNumber, dob })

    // For demo purposes, allow login with demo credentials
    if (rollNumber === "demo" || (rollNumber === "IT2023001" && dob === "2000-01-01")) {
      return {
        user: {
          id: "demo-student-id",
          email: "student@example.com",
          name: "Demo Student",
          role: "student",
        },
        student: {
          id: "demo-student-profile-id",
          user_id: "demo-student-id",
          name: "Demo Student",
          email: "student@example.com",
          roll_number: "IT2023001",
          classes: { name: "Second Year B" },
          department: "IT",
          semester: 4,
          year: 2,
          dob: "2000-01-01",
          mobile: "9876543210",
        },
      }
    }

    // Check if student exists with the given roll number and DOB
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*, classes(name)")
      .eq("roll_number", rollNumber)
      .eq("dob", dob)
      .single()

    if (studentError) {
      console.error("Student lookup error:", studentError)

      // Try again with a more flexible date comparison
      const { data: allStudents, error: allStudentsError } = await supabase
        .from("students")
        .select("*, classes(name)")
        .eq("roll_number", rollNumber)

      if (allStudentsError) {
        throw new Error("Student not found with the given roll number")
      }

      // Find a student with matching DOB (accounting for date format differences)
      const matchingStudent = allStudents.find((student) => {
        const studentDob = new Date(student.dob).toISOString().split("T")[0]
        const inputDob = new Date(dob).toISOString().split("T")[0]
        return studentDob === inputDob
      })

      if (!matchingStudent) {
        throw new Error("Invalid credentials. Please check your roll number and date of birth.")
      }

      // Use the matching student
      const studentData = matchingStudent
    }

    // Handle case where user_id might be null
    if (!studentData.user_id) {
      // Create a temporary user object for the session
      const tempUser = {
        id: `temp-${studentData.id}`,
        email: studentData.email || `student-${rollNumber}@example.com`,
        name: studentData.name,
        role: "student",
      }

      return { user: tempUser, student: studentData }
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", studentData.user_id)
      .single()

    if (userError) {
      // Create a temporary user object if user record not found
      const tempUser = {
        id: `temp-${studentData.id}`,
        email: studentData.email || `student-${rollNumber}@example.com`,
        name: studentData.name,
        role: "student",
      }

      return { user: tempUser, student: studentData }
    }

    return { user: userData, student: studentData }
  } catch (error) {
    console.error("Student login error:", error)
    throw error
  }
}

// Fix the parentLogin function to handle date format correctly
export async function parentLogin(mobileNumber: string, studentDob: string) {
  try {
    // Format the date to ensure consistency
    const formattedDob = new Date(studentDob).toISOString().split("T")[0]

    // For demo purposes, allow login with demo credentials
    if (mobileNumber === "9999999999" || (mobileNumber === "9876543210" && formattedDob === "2000-01-01")) {
      return {
        user: {
          id: "demo-parent-id",
          email: "parent@example.com",
          name: "Demo Parent",
          role: "parent",
        },
        parent: {
          id: "demo-parent-profile-id",
          user_id: "demo-parent-id",
          name: "Demo Parent",
          email: "parent@example.com",
          mobile: "9999999999",
          relation: "Father",
          students: {
            id: "demo-student-profile-id",
            name: "Demo Student",
            roll_number: "IT2023001",
            classes: { name: "Second Year B" },
            department: "IT",
            semester: 4,
            year: 2,
            dob: "2000-01-01",
          },
        },
      }
    }

    // First find the parent with the given mobile number
    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .select("*, students(*, classes(name))")
      .eq("mobile", mobileNumber)
      .single()

    if (parentError) {
      console.error("Parent lookup error:", parentError)
      throw new Error("Invalid credentials. Please check your mobile number.")
    }

    // Then verify the student's DOB with flexible date comparison
    const studentDobDate = new Date(parentData.students.dob).toISOString().split("T")[0]
    const inputDobDate = formattedDob

    if (studentDobDate !== inputDobDate) {
      throw new Error("Invalid credentials. Please check your child's date of birth.")
    }

    // Handle case where user_id might be null
    if (!parentData.user_id) {
      // Create a temporary user object for the session
      const tempUser = {
        id: `temp-parent-${parentData.id}`,
        email: parentData.email || `parent-${mobileNumber}@example.com`,
        name: parentData.name,
        role: "parent",
      }

      return { user: tempUser, parent: parentData }
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", parentData.user_id)
      .single()

    if (userError) {
      // Create a temporary user object if user record not found
      const tempUser = {
        id: `temp-parent-${parentData.id}`,
        email: parentData.email || `parent-${mobileNumber}@example.com`,
        name: parentData.name,
        role: "parent",
      }

      return { user: tempUser, parent: parentData }
    }

    return { user: userData, parent: parentData }
  } catch (error) {
    console.error("Parent login error:", error)
    throw error
  }
}

export async function createAdminUser(email: string, password: string, name: string) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw new Error(authError.message)

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ id: authData.user?.id, email, name, role: "admin" }])
      .select()

    if (userError) throw new Error(userError.message)

    return userData[0]
  } catch (error) {
    console.error("Create admin error:", error)
    throw error
  }
}

export async function createFacultyUser(facultyData: any) {
  try {
    // Generate a temporary password
    const tempPassword = generateRandomPassword()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: facultyData.email,
      password: tempPassword,
    })

    if (authError) throw new Error(authError.message)

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ id: authData.user?.id, email: facultyData.email, name: facultyData.name, role: "faculty" }])
      .select()

    if (userError) throw new Error(userError.message)

    // Create faculty record
    const { data: facultyRecord, error: facultyError } = await supabase
      .from("faculty")
      .insert([
        {
          user_id: userData[0].id,
          name: facultyData.name,
          email: facultyData.email,
          contact: facultyData.contact,
          temp_password: tempPassword, // Store temporary password for admin to share
        },
      ])
      .select()

    if (facultyError) throw new Error(facultyError.message)

    return { user: userData[0], faculty: facultyRecord[0], tempPassword }
  } catch (error) {
    console.error("Create faculty error:", error)
    throw error
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    // First verify current password
    const { data: userData, error: userError } = await supabase.from("users").select("email").eq("id", userId).single()

    if (userError) throw new Error("User not found")

    // Try to sign in with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword,
    })

    if (signInError) throw new Error("Current password is incorrect")

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) throw new Error(updateError.message)

    // If faculty, clear temp password flag
    await supabase.from("faculty").update({ temp_password: null }).eq("user_id", userId)

    return { success: true }
  } catch (error) {
    console.error("Change password error:", error)
    throw error
  }
}

// Add a fallback function for demo purposes
export async function demoLogin(role: string) {
  try {
    // Create demo user data based on role
    switch (role) {
      case "admin":
        return {
          id: "demo-admin-id",
          role: "admin",
          email: "admin@example.com",
          name: "Demo Admin",
        }
      case "faculty":
        return {
          user: {
            id: "demo-faculty-id",
            role: "faculty",
            email: "faculty@example.com",
            name: "Demo Faculty",
          },
          faculty: {
            id: "demo-faculty-profile-id",
            user_id: "demo-faculty-id",
            name: "Demo Faculty",
            email: "faculty@example.com",
            contact: "1234567890",
          },
        }
      case "student":
        return {
          user: {
            id: "demo-student-id",
            role: "student",
            email: "student@example.com",
            name: "Demo Student",
          },
          student: {
            id: "demo-student-profile-id",
            user_id: "demo-student-id",
            name: "Demo Student",
            email: "student@example.com",
            roll_number: "IT2023001",
            classes: { name: "Second Year B" },
            department: "IT",
            semester: 4,
            year: 2,
            dob: "2000-01-01",
            mobile: "9876543210",
          },
        }
      case "parent":
        return {
          user: {
            id: "demo-parent-id",
            role: "parent",
            email: "parent@example.com",
            name: "Demo Parent",
          },
          parent: {
            id: "demo-parent-profile-id",
            user_id: "demo-parent-id",
            name: "Demo Parent",
            email: "parent@example.com",
            mobile: "9999999999",
            relation: "Father",
            students: {
              id: "demo-student-profile-id",
              name: "Demo Student",
              roll_number: "IT2023001",
              classes: { name: "Second Year B" },
              department: "IT",
              semester: 4,
              year: 2,
              dob: "2000-01-01",
            },
          },
        }
      default:
        throw new Error("Invalid role")
    }
  } catch (error) {
    console.error("Demo login error:", error)
    throw error
  }
}
