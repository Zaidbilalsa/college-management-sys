// This file contains the database schema for Supabase
// You can use this as a reference when setting up your tables

/*
Table: users
- id: uuid (primary key, default: uuid_generate_v4())
- email: text (unique, not null)
- password: text (not null) - Note: Store hashed passwords only
- name: text (not null)
- role: text (not null) - 'admin', 'faculty', 'student', 'parent'
- created_at: timestamp with time zone (default: now())

Table: faculty
- id: uuid (primary key, default: uuid_generate_v4())
- user_id: uuid (foreign key to users.id, not null)
- name: text (not null)
- email: text (not null)
- contact: text
- created_at: timestamp with time zone (default: now())

Table: classes
- id: uuid (primary key, default: uuid_generate_v4())
- name: text (not null) - e.g., 'Second Year A'
- year: integer (not null) - 2, 3, 4
- section: text (not null) - 'A', 'B'
- created_at: timestamp with time zone (default: now())

Table: subjects
- id: uuid (primary key, default: uuid_generate_v4())
- name: text (not null)
- code: text (not null)
- semester: integer (not null) - 1 to 8
- created_at: timestamp with time zone (default: now())

Table: faculty_classes
- id: uuid (primary key, default: uuid_generate_v4())
- faculty_id: uuid (foreign key to faculty.id, not null)
- class_id: uuid (foreign key to classes.id, not null)
- created_at: timestamp with time zone (default: now())

Table: faculty_subjects
- id: uuid (primary key, default: uuid_generate_v4())
- faculty_id: uuid (foreign key to faculty.id, not null)
- subject_id: uuid (foreign key to subjects.id, not null)
- created_at: timestamp with time zone (default: now())

Table: students
- id: uuid (primary key, default: uuid_generate_v4())
- user_id: uuid (foreign key to users.id, not null)
- name: text (not null)
- email: text (not null)
- roll_number: text (not null, unique)
- class_id: uuid (foreign key to classes.id, not null)
- department: text (not null)
- semester: integer (not null)
- year: integer (not null)
- dob: date
- mobile: text
- created_at: timestamp with time zone (default: now())

Table: parents
- id: uuid (primary key, default: uuid_generate_v4())
- user_id: uuid (foreign key to users.id, not null)
- student_id: uuid (foreign key to students.id, not null)
- name: text (not null)
- email: text (not null)
- mobile: text
- relation: text - 'Father', 'Mother', 'Guardian'
- created_at: timestamp with time zone (default: now())

Table: attendance
- id: uuid (primary key, default: uuid_generate_v4())
- date: date (not null)
- class_id: uuid (foreign key to classes.id, not null)
- subject_id: uuid (foreign key to subjects.id, not null)
- faculty_id: uuid (foreign key to faculty.id, not null)
- working_days: integer (not null)
- created_at: timestamp with time zone (default: now())

Table: attendance_records
- id: uuid (primary key, default: uuid_generate_v4())
- attendance_id: uuid (foreign key to attendance.id, not null)
- student_id: uuid (foreign key to students.id, not null)
- status: text (not null) - 'present', 'absent', 'od'
- created_at: timestamp with time zone (default: now())

Table: exams
- id: uuid (primary key, default: uuid_generate_v4())
- name: text (not null) - 'CAT I', 'CAT II', 'Model Exam', 'Final Exam'
- date: date (not null)
- class_id: uuid (foreign key to classes.id, not null)
- subject_id: uuid (foreign key to subjects.id, not null)
- faculty_id: uuid (foreign key to faculty.id, not null)
- total_marks: integer (not null)
- created_at: timestamp with time zone (default: now())

Table: marks
- id: uuid (primary key, default: uuid_generate_v4())
- exam_id: uuid (foreign key to exams.id, not null)
- student_id: uuid (foreign key to students.id, not null)
- marks: integer (not null)
- created_at: timestamp with time zone (default: now())

Table: reports
- id: uuid (primary key, default: uuid_generate_v4())
- date: date (not null)
- student_id: uuid (foreign key to students.id, not null)
- faculty_id: uuid (foreign key to faculty.id, not null)
- parent_email: text
- attendance: text
- cat_i: text
- cat_ii: text
- model: text
- behavior: text - 'Good', 'Average', 'Needs Improvement'
- comments: text
- sent: boolean (default: false)
- created_at: timestamp with time zone (default: now())
*/
