-- Add RLS policies for autobiography_responses
-- Run this in Supabase SQL Editor

-- Enable RLS (already enabled in 001)
ALTER TABLE autobiography_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view responses for sessions in their family
CREATE POLICY "Family members can view responses" ON autobiography_responses
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM autobiography_sessions
      WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Policy: Interviewers and family editors can manage responses
CREATE POLICY "Interviewers and editors can manage responses" ON autobiography_responses
  FOR ALL USING (
    session_id IN (
      SELECT id FROM autobiography_sessions
      WHERE interviewer_id = auth.uid()
         OR family_id IN (
           SELECT family_id FROM family_members
           WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active'
         )
    )
  );