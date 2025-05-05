import { supabase } from "./supabase"

// Auth functions
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Get user role and details
  const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

  if (userError) throw userError

  return userData
}

export async function signUp(email: string, password: string, name: string, role: string) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  // Create user record
  const { data, error } = await supabase.from("users").insert([{ email, name, role }]).select()

  if (error) throw error

  return data[0]
}

// Faculty functions
export async function getFaculty() {
  const { data, error } = await supabase.from("faculty").select(`
      *,
      faculty_classes(
        classes(*)
      ),
      faculty_subjects(
        subjects(*)
      )
    `)

  if (error) throw error

  // Transform data to match the expected format
  return data.map((faculty) => {
    return {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      contact: faculty.contact,
      classes: faculty.faculty_classes.map((fc: any) => fc.classes.name),
      subjects: faculty.faculty_subjects.map((fs: any) => fs.subjects.name),
    }
  })
}

export async function addFaculty(faculty: any) {
  // Insert faculty
  const { data: facultyData, error: facultyError } = await supabase
    .from("faculty")
    .insert([
      {
        name: faculty.name,
        email: faculty.email,
        contact: faculty.contact,
      },
    ])
    .select()

  if (facultyError) throw facultyError

  const facultyId = facultyData[0].id

  // Insert faculty classes
  if (faculty.classes && faculty.classes.length > 0) {
    // First get class IDs
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, name")
      .in("name", faculty.classes)

    if (classError) throw classError

    // Map class names to IDs
    const classMap = classData.reduce((acc: any, cls: any) => {
      acc[cls.name] = cls.id
      return acc
    }, {})

    // Insert faculty_classes records
    const facultyClasses = faculty.classes.map((className: string) => ({
      faculty_id: facultyId,
      class_id: classMap[className],
    }))

    const { error: fcError } = await supabase.from("faculty_classes").insert(facultyClasses)

    if (fcError) throw fcError
  }

  // Insert faculty subjects
  if (faculty.subjects && faculty.subjects.length > 0) {
    // First get subject IDs
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name")
      .in("name", faculty.subjects)

    if (subjectError) throw subjectError

    // Map subject names to IDs
    const subjectMap = subjectData.reduce((acc: any, subj: any) => {
      acc[subj.name] = subj.id
      return acc
    }, {})

    // Insert faculty_subjects records
    const facultySubjects = faculty.subjects.map((subjectName: string) => ({
      faculty_id: facultyId,
      subject_id: subjectMap[subjectName],
    }))

    const { error: fsError } = await supabase.from("faculty_subjects").insert(facultySubjects)

    if (fsError) throw fsError
  }

  return { id: facultyId, ...faculty }
}

export async function updateFaculty(id: string, faculty: any) {
  // Update faculty
  const { error: facultyError } = await supabase
    .from("faculty")
    .update({
      name: faculty.name,
      email: faculty.email,
      contact: faculty.contact,
    })
    .eq("id", id)

  if (facultyError) throw facultyError

  // Delete existing faculty_classes
  const { error: deleteClassesError } = await supabase.from("faculty_classes").delete().eq("faculty_id", id)

  if (deleteClassesError) throw deleteClassesError

  // Delete existing faculty_subjects
  const { error: deleteSubjectsError } = await supabase.from("faculty_subjects").delete().eq("faculty_id", id)

  if (deleteSubjectsError) throw deleteSubjectsError

  // Insert new faculty classes
  if (faculty.classes && faculty.classes.length > 0) {
    // First get class IDs
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, name")
      .in("name", faculty.classes)

    if (classError) throw classError

    // Map class names to IDs
    const classMap = classData.reduce((acc: any, cls: any) => {
      acc[cls.name] = cls.id
      return acc
    }, {})

    // Insert faculty_classes records
    const facultyClasses = faculty.classes.map((className: string) => ({
      faculty_id: id,
      class_id: classMap[className],
    }))

    const { error: fcError } = await supabase.from("faculty_classes").insert(facultyClasses)

    if (fcError) throw fcError
  }

  // Insert new faculty subjects
  if (faculty.subjects && faculty.subjects.length > 0) {
    // First get subject IDs
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name")
      .in("name", faculty.subjects)

    if (subjectError) throw subjectError

    // Map subject names to IDs
    const subjectMap = subjectData.reduce((acc: any, subj: any) => {
      acc[subj.name] = subj.id
      return acc
    }, {})

    // Insert faculty_subjects records
    const facultySubjects = faculty.subjects.map((subjectName: string) => ({
      faculty_id: id,
      subject_id: subjectMap[subjectName],
    }))

    const { error: fsError } = await supabase.from("faculty_subjects").insert(facultySubjects)

    if (fsError) throw fsError
  }

  return { id, ...faculty }
}

export async function deleteFaculty(id: string) {
  // Delete faculty_classes
  const { error: deleteClassesError } = await supabase.from("faculty_classes").delete().eq("faculty_id", id)

  if (deleteClassesError) throw deleteClassesError

  // Delete faculty_subjects
  const { error: deleteSubjectsError } = await supabase.from("faculty_subjects").delete().eq("faculty_id", id)

  if (deleteSubjectsError) throw deleteSubjectsError

  // Delete faculty
  const { error } = await supabase.from("faculty").delete().eq("id", id)

  if (error) throw error

  return { id }
}

// Student functions
export async function getStudents() {
  const { data, error } = await supabase.from("students").select(`
      *,
      classes(*),
      parents(*)
    `)

  if (error) throw error

  // Transform data to match the expected format
  return data.map((student) => {
    const parent = student.parents[0] || {}
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      rollNumber: student.roll_number,
      class: student.classes.name,
      department: student.department,
      semester: student.semester,
      year: student.year,
      dob: student.dob,
      mobile: student.mobile,
      parentName: parent.name,
      parentMobile: parent.mobile,
      parentEmail: parent.email,
      relation: parent.relation,
    }
  })
}

export async function addStudent(student: any) {
  // Get class ID
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("name", student.class)
    .single()

  if (classError) throw classError

  // Insert student
  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .insert([
      {
        name: student.name,
        email: student.email,
        roll_number: student.rollNumber,
        class_id: classData.id,
        department: student.department,
        semester: student.semester,
        year: student.year,
        dob: student.dob,
        mobile: student.mobile,
      },
    ])
    .select()

  if (studentError) throw studentError

  const studentId = studentData[0].id

  // Insert parent if provided
  if (student.parentName && student.parentEmail) {
    const { error: parentError } = await supabase.from("parents").insert([
      {
        student_id: studentId,
        name: student.parentName,
        email: student.parentEmail,
        mobile: student.parentMobile,
        relation: student.relation,
      },
    ])

    if (parentError) throw parentError
  }

  return { id: studentId, ...student }
}

export async function updateStudent(id: string, student: any) {
  // Get class ID
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("name", student.class)
    .single()

  if (classError) throw classError

  // Update student
  const { error: studentError } = await supabase
    .from("students")
    .update({
      name: student.name,
      email: student.email,
      roll_number: student.rollNumber,
      class_id: classData.id,
      department: student.department,
      semester: student.semester,
      year: student.year,
      dob: student.dob,
      mobile: student.mobile,
    })
    .eq("id", id)

  if (studentError) throw studentError

  // Get parent ID
  const { data: parentData, error: getParentError } = await supabase.from("parents").select("id").eq("student_id", id)

  if (getParentError) throw getParentError

  // Update or insert parent
  if (student.parentName && student.parentEmail) {
    if (parentData && parentData.length > 0) {
      // Update existing parent
      const { error: parentError } = await supabase
        .from("parents")
        .update({
          name: student.parentName,
          email: student.parentEmail,
          mobile: student.parentMobile,
          relation: student.relation,
        })
        .eq("id", parentData[0].id)

      if (parentError) throw parentError
    } else {
      // Insert new parent
      const { error: parentError } = await supabase.from("parents").insert([
        {
          student_id: id,
          name: student.parentName,
          email: student.parentEmail,
          mobile: student.parentMobile,
          relation: student.relation,
        },
      ])

      if (parentError) throw parentError
    }
  }

  return { id, ...student }
}

export async function deleteStudent(id: string) {
  // Delete parent
  const { error: deleteParentError } = await supabase.from("parents").delete().eq("student_id", id)

  if (deleteParentError) throw deleteParentError

  // Delete attendance records
  const { error: deleteAttendanceError } = await supabase.from("attendance_records").delete().eq("student_id", id)

  if (deleteAttendanceError) throw deleteAttendanceError

  // Delete marks
  const { error: deleteMarksError } = await supabase.from("marks").delete().eq("student_id", id)

  if (deleteMarksError) throw deleteMarksError

  // Delete reports
  const { error: deleteReportsError } = await supabase.from("reports").delete().eq("student_id", id)

  if (deleteReportsError) throw deleteReportsError

  // Delete student
  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) throw error

  return { id }
}

// Class and Subject functions
export async function getClasses() {
  const { data, error } = await supabase.from("classes").select("*")

  if (error) throw error

  return data.map((cls) => cls.name)
}

export async function getSubjects() {
  const { data, error } = await supabase.from("subjects").select("*")

  if (error) throw error

  return data.map((subject) => subject.name)
}

// Attendance functions
export async function getAttendanceRecords(facultyId: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select(`
      *,
      classes(name),
      subjects(name),
      attendance_records(
        student_id,
        status
      )
    `)
    .eq("faculty_id", facultyId)
    .order("date", { ascending: false })

  if (error) throw error

  // Transform data to match the expected format
  return data.map((record) => {
    const presentCount = record.attendance_records.filter((r: any) => r.status === "present").length
    const absentCount = record.attendance_records.filter((r: any) => r.status === "absent").length
    const odCount = record.attendance_records.filter((r: any) => r.status === "od").length

    return {
      id: record.id,
      date: record.date,
      class: record.classes.name,
      subject: record.subjects.name,
      totalStudents: record.attendance_records.length,
      presentStudents: presentCount,
      absentStudents: absentCount,
      odStudents: odCount,
      workingDays: record.working_days,
    }
  })
}

export async function addAttendanceRecord(attendance: any, studentAttendance: any[]) {
  // Get class ID
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("name", attendance.class)
    .single()

  if (classError) throw classError

  // Get subject ID
  const { data: subjectData, error: subjectError } = await supabase
    .from("subjects")
    .select("id")
    .eq("name", attendance.subject)
    .single()

  if (subjectError) throw subjectError

  // Insert attendance record
  const { data: attendanceData, error: attendanceError } = await supabase
    .from("attendance")
    .insert([
      {
        date: attendance.date,
        class_id: classData.id,
        subject_id: subjectData.id,
        faculty_id: attendance.facultyId,
        working_days: attendance.workingDays,
      },
    ])
    .select()

  if (attendanceError) throw attendanceError

  const attendanceId = attendanceData[0].id

  // Insert attendance records for each student
  const attendanceRecords = studentAttendance.map((record) => ({
    attendance_id: attendanceId,
    student_id: record.id,
    status: record.status,
  }))

  const { error: recordsError } = await supabase.from("attendance_records").insert(attendanceRecords)

  if (recordsError) throw recordsError

  return {
    id: attendanceId,
    date: attendance.date,
    class: attendance.class,
    subject: attendance.subject,
    totalStudents: studentAttendance.length,
    presentStudents: studentAttendance.filter((r) => r.status === "present").length,
    absentStudents: studentAttendance.filter((r) => r.status === "absent").length,
    odStudents: studentAttendance.filter((r) => r.status === "od").length,
    workingDays: attendance.workingDays,
  }
}

// Marks functions
export async function getMarksRecords(facultyId: string) {
  const { data, error } = await supabase
    .from("exams")
    .select(`
      *,
      classes(name),
      subjects(name),
      marks(
        student_id,
        marks
      )
    `)
    .eq("faculty_id", facultyId)
    .order("date", { ascending: false })

  if (error) throw error

  // Transform data to match the expected format
  return data.map((exam) => {
    const totalMarks = exam.total_marks
    const marksSum = exam.marks.reduce((sum: number, m: any) => sum + m.marks, 0)
    const averageMarks = exam.marks.length > 0 ? marksSum / exam.marks.length : 0

    return {
      id: exam.id,
      date: exam.date,
      class: exam.classes.name,
      subject: exam.subjects.name,
      examType: exam.name,
      totalMarks,
      averageMarks: Number.parseFloat(averageMarks.toFixed(1)),
    }
  })
}

export async function addMarksRecord(exam: any, studentMarks: any[]) {
  // Get class ID
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("name", exam.class)
    .single()

  if (classError) throw classError

  // Get subject ID
  const { data: subjectData, error: subjectError } = await supabase
    .from("subjects")
    .select("id")
    .eq("name", exam.subject)
    .single()

  if (subjectError) throw subjectError

  // Insert exam record
  const { data: examData, error: examError } = await supabase
    .from("exams")
    .insert([
      {
        name: exam.examType,
        date: exam.date,
        class_id: classData.id,
        subject_id: subjectData.id,
        faculty_id: exam.facultyId,
        total_marks: exam.totalMarks,
      },
    ])
    .select()

  if (examError) throw examError

  const examId = examData[0].id

  // Insert marks for each student
  const marksRecords = studentMarks.map((record) => ({
    exam_id: examId,
    student_id: record.id,
    marks: record.marks,
  }))

  const { error: marksError } = await supabase.from("marks").insert(marksRecords)

  if (marksError) throw marksError

  // Calculate average marks
  const marksSum = studentMarks.reduce((sum, record) => sum + record.marks, 0)
  const averageMarks = studentMarks.length > 0 ? marksSum / studentMarks.length : 0

  return {
    id: examId,
    date: exam.date,
    class: exam.class,
    subject: exam.subject,
    examType: exam.examType,
    totalMarks: exam.totalMarks,
    averageMarks: Number.parseFloat(averageMarks.toFixed(1)),
  }
}

// Reports functions
export async function getReports(facultyId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      students(
        name,
        roll_number,
        classes(name)
      )
    `)
    .eq("faculty_id", facultyId)
    .order("date", { ascending: false })

  if (error) throw error

  // Transform data to match the expected format
  return data.map((report) => {
    return {
      id: report.id,
      date: report.date,
      class: report.students.classes.name,
      student: report.students.name,
      rollNumber: report.students.roll_number,
      parentEmail: report.parent_email,
      attendance: report.attendance,
      catI: report.cat_i,
      catII: report.cat_ii,
      model: report.model,
      behavior: report.behavior,
      comments: report.comments,
      sent: report.sent,
    }
  })
}

export async function addReport(report: any) {
  // Get student ID
  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("roll_number", report.rollNumber)
    .single()

  if (studentError) throw studentError

  // Insert report
  const { data: reportData, error: reportError } = await supabase
    .from("reports")
    .insert([
      {
        date: report.date,
        student_id: studentData.id,
        faculty_id: report.facultyId,
        parent_email: report.parentEmail,
        attendance: report.attendance,
        cat_i: report.catI,
        cat_ii: report.catII,
        model: report.model,
        behavior: report.behavior,
        comments: report.comments,
        sent: false,
      },
    ])
    .select()

  if (reportError) throw reportError

  return { id: reportData[0].id, ...report, sent: false }
}

// Update report status without sending email
export async function updateReportStatus(id: string) {
  // Update report status
  const { error } = await supabase.from("reports").update({ sent: true }).eq("id", id)

  if (error) throw error

  return { id, sent: true }
}

// Student dashboard functions
export async function getStudentAttendance(studentId: string) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select(`
      status,
      attendance(
        date,
        working_days,
        subjects(name)
      )
    `)
    .eq("student_id", studentId)

  if (error) throw error

  // Calculate overall attendance percentage
  const totalRecords = data.length
  const presentRecords = data.filter((record) => record.status === "present" || record.status === "od").length
  const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

  return `${percentage}%`
}

export async function getStudentMarks(studentId: string) {
  const { data, error } = await supabase
    .from("marks")
    .select(`
      marks,
      exams(
        name,
        date,
        total_marks,
        subjects(name)
      )
    `)
    .eq("student_id", studentId)

  if (error) throw error

  // Transform data to match the expected format
  return data.map((mark) => {
    return {
      exam: mark.exams[0].name,
      subject: mark.exams[0].subjects[0].name,
      marks: `${mark.marks}/${mark.exams[0].total_marks}`,
      percentage: Math.round((mark.marks / mark.exams[0].total_marks) * 100),
    }
  })
}

// Parent dashboard functions
export async function getChildInfo(parentId: string) {
  const { data, error } = await supabase
    .from("parents")
    .select(`
      students(
        id,
        name,
        roll_number,
        classes(name)
      )
    `)
    .eq("id", parentId)
    .single()

  if (error) throw error

  return {
    id: data.students[0].id,
    name: data.students[0].name,
    rollNumber: data.students[0].roll_number,
    class: data.students[0].classes[0].name,
  }
}

export async function getChildReports(studentId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      faculty(name)
    `)
    .eq("student_id", studentId)
    .order("date", { ascending: false })

  if (error) throw error

  return data.map((report) => {
    return {
      id: report.id,
      date: report.date,
      facultyName: report.faculty.name,
      attendance: report.attendance,
      catI: report.cat_i,
      catII: report.cat_ii,
      model: report.model,
      behavior: report.behavior,
      comments: report.comments,
    }
  })
}
