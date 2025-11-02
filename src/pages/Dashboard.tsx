import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [alsPendingStudents, setAlsPendingStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({
    enrolled: 0,
    pending: 0,
    total: 0,
    stem: 0,
    abm: 0,
    tvlIct: 0,
    humss: 0,
    alsEnrolled: 0,
    alsPending: 0,
  });

  useEffect(() => {
    fetchStudents();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('dashboard_students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'NewStudents' }, () => {
        fetchStudents();
      })
      .subscribe();

    const alsSubscription = supabase
      .channel('dashboard_als_students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ALS' }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      alsSubscription.unsubscribe();
    };
  }, []);

  const fetchStudents = async () => {
    try {
      // Fetch enrolled students from NewStudents
      const { data: enrolledData, error: enrolledError } = await supabase
        .from('NewStudents')
        .select('lrn, lname, fname, mname, semester, strand, enrollment_status')
        .eq('enrollment_status', 'Enrolled')
        .order('lrn', { ascending: true });

      if (enrolledError) throw enrolledError;

      // Fetch pending students from NewStudents (limit to 3 for dashboard, most recent first)
      const { data: pendingData, error: pendingError } = await supabase
        .from('NewStudents')
        .select('lrn, lname, fname, mname, semester, strand, enrollment_status')
        .eq('enrollment_status', 'Pending')
        .order('lrn', { ascending: false })
        .limit(3);

      if (pendingError) throw pendingError;

      // Fetch enrolled ALS students
      const { data: alsEnrolledData, error: alsEnrolledError } = await supabase
        .from('ALS')
        .select('lrn, lname, fname, mname, age, enrollment_status')
        .eq('enrollment_status', 'Enrolled')
        .order('lrn', { ascending: true });

      if (alsEnrolledError) throw alsEnrolledError;

      // Fetch pending ALS students (limit to 3 for dashboard, most recent first)
      const { data: alsPendingData, error: alsPendingError } = await supabase
        .from('ALS')
        .select('lrn, lname, fname, mname, age, enrollment_status')
        .eq('enrollment_status', 'Pending')
        .order('lrn', { ascending: false })
        .limit(3);

      if (alsPendingError) throw alsPendingError;

      setPendingStudents(pendingData || []);
      setAlsPendingStudents(alsPendingData || []);

      // Calculate strand counts
      const stemCount = enrolledData?.filter(s => s.strand === 'STEM').length || 0;
      const abmCount = enrolledData?.filter(s => s.strand === 'ABM').length || 0;
      const tvlIctCount = enrolledData?.filter(s => s.strand === 'TVL-ICT').length || 0;
      const humssCount = enrolledData?.filter(s => s.strand === 'HUMSS').length || 0;

      setStats({
        enrolled: enrolledData?.length || 0,
        pending: pendingData?.length || 0,
        total: (enrolledData?.length || 0) + (pendingData?.length || 0),
        stem: stemCount,
        abm: abmCount,
        tvlIct: tvlIctCount,
        humss: humssCount,
        alsEnrolled: alsEnrolledData?.length || 0,
        alsPending: alsPendingData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };


  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Main container for the two-part background */}
      <div className="absolute left-68 inset-y-0 right-0 -z-10">
        <div className="w-full h-[450px] bg-gradient-to-br from-blue-500 to-blue-50"></div>
        <div className="w-full h-full bg-gray-100 -mt-[2px]"></div> {/* Clean overlap */}
      </div>

      <div className="flex-1 flex flex-col min-h-screen ml-68 overflow-y-auto">
        <div className="p-4 pl-32 pt-8 ml-0">
          <header className="flex justify-between items-center mb-8 mt-5">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div>
                <p className="font-bold text-gray-600 uppercase">STEM STUDENTS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.stem}</p>
              </div>
              <div className="bg-gradient-to-tr from-green-400 to-green-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div>
                <p className="font-bold text-gray-600 uppercase">ABM STUDENTS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.abm}</p>
              </div>
              <div className="bg-gradient-to-tr from-blue-400 to-blue-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div>
                <p className="font-bold text-gray-600 uppercase">TVL-ICT STUDENTS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.tvlIct}</p>
              </div>
              <div className="bg-gradient-to-tr from-teal-400 to-teal-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div>
                <p className="font-bold text-gray-600 uppercase">HUMSS STUDENTS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.humss}</p>
              </div>
              <div className="bg-gradient-to-tr from-purple-400 to-purple-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20M1 14v5h22v-5" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div>
                <p className="font-bold text-gray-600 uppercase">ALS STUDENTS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.alsEnrolled}</p>
              </div>
              <div className="bg-gradient-to-tr from-orange-400 to-orange-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md flex-grow hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
              <div className="flex justify-between items-center border-b-2 border-gray-300 pb-2 mb-4">
                <h2 className="text-lg font-bold text-gray-600">RECENT ENROLLMENT APPLICATIONS:</h2>
                <button
                  onClick={() => onNavigate('new-student')}
                  className="text-sm font-medium text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-all duration-200"
                >
                  See All
                </button>
              </div>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="py-3 px-6">Name</th>
                      <th scope="col" className="py-3 px-6">Strand</th>
                      <th scope="col" className="py-3 px-6">Year Level</th>
                      <th scope="col" className="py-3 px-6">Semester</th>
                      <th scope="col" className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStudents.map((student) => (
                      <tr key={student.lrn} className="bg-white border-b">
                        <td className="py-3 px-6">{student.lname}, {student.fname} {student.mname}</td>
                        <td className="py-3 px-6">{student.strand}</td>
                        <td className="py-3 px-6">{student.semester}</td>
                        <td className="py-3 px-6">{student.semester}</td>
                        <td className="py-3 px-6">
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            {student.enrollment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-xl shadow-md flex-grow hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
            <div className="flex justify-between items-center border-b-2 border-gray-300 pb-2 mb-4">
              <h2 className="text-lg font-bold text-gray-600">RECENT ALS ENROLLMENT APPLICATIONS:</h2>
              <button
                onClick={() => onNavigate('als-new-enrollees')}
                className="text-sm font-medium text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-all duration-200"
              >
                See All
              </button>
            </div>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="py-3 px-6">Name</th>
                    <th scope="col" className="py-3 px-6">LRN</th>
                    <th scope="col" className="py-3 px-6">Age</th>
                    <th scope="col" className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alsPendingStudents.map((student) => (
                    <tr key={student.lrn} className="bg-white border-b">
                      <td className="py-3 px-6">{student.lname}, {student.fname} {student.mname}</td>
                      <td className="py-3 px-6">{student.lrn}</td>
                      <td className="py-3 px-6">{student.age}</td>
                      <td className="py-3 px-6">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {student.enrollment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg xl:w-1/3 mt-8 hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
            <div className="border-b-2 border-gray-400 pb-2 mb-4">
              <h2 className="text-lg font-bold text-gray-600">NO. OF ENROLLMENT APPLICATIONS:</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <div className="flex justify-between w-full">
                  <span>Pending</span>
                  <span>{stats.pending}</span>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <div className="flex justify-between w-full">
                  <span>Enrolled</span>
                  <span>{stats.enrolled}</span>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <div className="flex justify-between w-full">
                  <span>ALS Pending</span>
                  <span>{stats.alsPending}</span>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <div className="flex justify-between w-full">
                  <span>ALS Enrolled</span>
                  <span>{stats.alsEnrolled}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
