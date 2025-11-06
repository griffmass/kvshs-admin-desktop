import { createClient } from '@supabase/supabase-js';

// --- FINAL FIX: Hardcode the public environment variables ---
// This bypasses any issues with Vite's import.meta.env in the Electron build.
const supabaseUrl = 'https://bvgmaztjetcbnvnucbpw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI“NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Z21henRqZXRjYm52bnVjYnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDc4NTAsImV4cCI6MjA3NjQ4Mzg1MH0.g35d0Cu_I9gUeIa9D2NgjTPhA9-Jt05HumwGWuiQpPw';

// The error check remains, but it will no longer fail.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in supabase.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The rest of your interface definitions remain the same.
export interface Student {
  id?: number;
  lrn?: string;
  date?: string;
  lname?: string;
  fname?: string;
  mname?: string;
  ename?: string;
  cn?: string;
  bday?: string;
  age?: string;
  sex?: string;
  birthplace?: string;
  religion?: string;
  motherTongue?: string;
  civilStatus?: string;
  indigenousPeople?: string;
  fourPS?: string;
  houseNumber?: string;
  streetName?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  country?: string;
  zipCode?: string;
  pHN?: string;
  pSN?: string;
  pbrgy?: string;
  pMunicipal?: string;
  pProvince?: string;
  pCountry?: string;
  pZipCode?: string;
  fatherFN?: string;
  fatherMN?: string;
  fatherLN?: string;
  fatherCN?: string;
  motherFN?: string;
  motherMN?: string;
  motherLN?: string;
  motherCN?: string;
  guardianFN?: string;
  guardianMN?: string;
  guardianCN?: string;
  pwd?: string;
  pwdID?: string;
  education_information?: string;
  OSY?: string;
  als_attended?: string;
  complete_program?: string;
  kms?: string;
  hour?: string;
  transportation?: string;
  day?: string;
  time?: string;
  distanceLearning?: string | string[];
  gradeLevel?: string;
  guardianLN?: string;
  enrollment_status?: 'Pending' | 'Enrolled';
  created_at?: string;
  strand?: string;
  semester?: string;
  schoolYear?: string;
  psa?: string;
  track?: string;
  SNEP?: string;
  rlGradeLevelComplete?: string;
  rlLastSYComplete?: string;
  rlLastSchoolAtt?: string;
  rlSchoolID?: string;
}