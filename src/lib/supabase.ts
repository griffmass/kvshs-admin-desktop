import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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