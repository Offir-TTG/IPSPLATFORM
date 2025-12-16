-- Attendance System Schema
-- This migration creates the attendance tracking system for courses and lessons

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one attendance record per student per lesson per date
  UNIQUE (tenant_id, course_id, lesson_id, student_id, attendance_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON public.attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lesson_id ON public.attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- Create attendance statistics view
CREATE OR REPLACE VIEW public.attendance_stats AS
SELECT
  a.tenant_id,
  a.course_id,
  a.student_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
  COUNT(*) FILTER (WHERE a.status = 'late') as late_count,
  COUNT(*) FILTER (WHERE a.status = 'excused') as excused_count,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status = 'present')::DECIMAL /
    NULLIF(COUNT(*), 0) * 100), 2
  ) as attendance_percentage
FROM public.attendance a
GROUP BY a.tenant_id, a.course_id, a.student_id;

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance table

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
  ON public.attendance
  FOR SELECT
  USING (
    auth.uid() = student_id
  );

-- Instructors and admins can view all attendance for their tenant
CREATE POLICY "Instructors can view tenant attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = attendance.tenant_id
      AND users.role IN ('instructor', 'admin')
    )
  );

-- Instructors and admins can insert attendance
CREATE POLICY "Instructors can insert attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = attendance.tenant_id
      AND users.role IN ('instructor', 'admin')
    )
  );

-- Instructors and admins can update attendance
CREATE POLICY "Instructors can update attendance"
  ON public.attendance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = attendance.tenant_id
      AND users.role IN ('instructor', 'admin')
    )
  );

-- Admins can delete attendance
CREATE POLICY "Admins can delete attendance"
  ON public.attendance
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = attendance.tenant_id
      AND users.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_attendance_timestamp
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_attendance_updated_at();

-- Comments
COMMENT ON TABLE public.attendance IS 'Tracks student attendance for courses and lessons';
COMMENT ON COLUMN public.attendance.status IS 'Attendance status: present, absent, late, excused';
COMMENT ON COLUMN public.attendance.lesson_id IS 'Optional: specific lesson within the course';
COMMENT ON COLUMN public.attendance.notes IS 'Additional notes about the attendance record';
