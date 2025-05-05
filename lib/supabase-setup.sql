-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student', 'parent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty table
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  semester INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty-Classes relationship
CREATE TABLE faculty_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculty_id, class_id)
);

-- Faculty-Subjects relationship
CREATE TABLE faculty_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculty_id, subject_id)
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  roll_number TEXT NOT NULL UNIQUE,
  class_id UUID REFERENCES classes(id),
  department TEXT NOT NULL,
  semester INTEGER NOT NULL,
  year INTEGER NOT NULL,
  dob DATE,
  mobile TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents table
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  relation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  working_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records table
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'od')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  total_marks INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marks table
CREATE TABLE marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  marks INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  attendance TEXT,
  cat_i TEXT,
  cat_ii TEXT,
  model TEXT,
  behavior TEXT,
  comments TEXT,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_faculty_email ON faculty(email);
CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_records_attendance_id ON attendance_records(attendance_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_exams_date ON exams(date);
CREATE INDEX idx_marks_exam_id ON marks(exam_id);
CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_reports_student_id ON reports(student_id);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other tables...
-- (For brevity, I'm not including all policies, but you would create similar ones for each table)

-- Sample data for testing
-- Insert classes
INSERT INTO classes (name, year, section) VALUES
  ('Second Year A', 2, 'A'),
  ('Second Year B', 2, 'B'),
  ('Third Year A', 3, 'A'),
  ('Third Year B', 3, 'B'),
  ('Final Year A', 4, 'A'),
  ('Final Year B', 4, 'B');

-- Insert subjects
INSERT INTO subjects (name, code, semester) VALUES
  ('Data Structures', 'CS201', 3),
  ('Algorithms', 'CS202', 3),
  ('Database Management', 'CS301', 5),
  ('Computer Networks', 'CS302', 5),
  ('Operating Systems', 'CS303', 5),
  ('Machine Learning', 'CS401', 7),
  ('Artificial Intelligence', 'CS402', 7),
  ('Web Development', 'CS403', 7);
