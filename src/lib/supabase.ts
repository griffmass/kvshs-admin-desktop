import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_MY_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or ServiceKey is missing in supabase.ts');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  approved_at?: string;
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
  section?: string;
}