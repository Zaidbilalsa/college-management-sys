export async function demoLogin(role: string) {
    try {
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
              temp_password: null,
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
              classes: { name: "Second Year A" },
              department: "IT",
              dob: "2002-01-01",
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
              mobile: "9876543210",
              relation: "Father",
              students: {
                name: "Demo Student",
                roll_number: "IT2023001",
                classes: { name: "Second Year A" },
                dob: "2002-01-01",
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
  