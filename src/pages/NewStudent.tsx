import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';
import { Search, Eye, CheckCircle, Trash2 } from 'lucide-react';
import StudentDetailsModal from '../components/StudentDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';

export default function NewStudent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortStrand, setSortStrand] = useState('');
  const [sortGradeLevel, setSortGradeLevel] = useState('');
  const [sortSemester, setSortSemester] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [originalLrn, setOriginalLrn] = useState<string | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'delete';
    studentLrn: string | undefined;
    studentName?: string;
  } | null>(null);

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('NewStudents')
        .select('*')
        .eq('enrollment_status', 'Pending');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.lname || ''}, ${student.fname || ''} ${student.mname || ''}`.trim();
    const matchesSearch = searchTerm === '' ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.lrn && student.lrn.toString().includes(searchTerm));

    const matchesStrand = sortStrand === '' || student.strand === sortStrand;
    const matchesGradeLevel = sortGradeLevel === '' || student.gradeLevel === sortGradeLevel;
    const matchesSemester = sortSemester === '' || student.semester === sortSemester;

    return matchesSearch && matchesStrand && matchesGradeLevel && matchesSemester;
  });

  const handleApprove = (studentLrn: string | undefined, studentName?: string) => {
    if (!studentLrn) return;
    setConfirmAction({
      type: 'approve',
      studentLrn,
      studentName
    });
    setShowConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!confirmAction || confirmAction.type !== 'approve') return;

    try {
      setProcessing(confirmAction.studentLrn || null);
      const { error } = await supabase
        .from('NewStudents')
        .update({ enrollment_status: 'Enrolled' })
        .eq('lrn', confirmAction.studentLrn);

      if (error) throw error;

      setStudents(students.filter((s) => s.lrn !== confirmAction.studentLrn));
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSuccessMessage('Student approved successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Failed to approve student');
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveALS = (studentLrn: string | undefined, studentName?: string) => {
    // Logic for transferring to ALS table or approving as ALS would go here if needed
    // For now, reusing standard approve as per previous logic
    handleApprove(studentLrn, studentName);
  };

  const handleDelete = (studentLrn: string | undefined, studentName?: string) => {
    if (!studentLrn) return;
    setConfirmAction({
      type: 'delete',
      studentLrn,
      studentName
    });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction || confirmAction.type !== 'delete') return;

    try {
      setProcessing(confirmAction.studentLrn || null);
      const { error } = await supabase
        .from('NewStudents')
        .delete()
        .eq('lrn', confirmAction.studentLrn);

      if (error) throw error;

      setStudents(students.filter((s) => s.lrn !== confirmAction.studentLrn));
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSuccessMessage('Student deleted successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    } finally {
      setProcessing(null);
    }
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setOriginalLrn(student.lrn);
    setShowModal(true);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!editedStudent || !originalLrn || !hasChanges) return;

    try {
      const { error } = await supabase
        .from('NewStudents')
        .update(editedStudent)
        .eq('lrn', originalLrn);

      if (error) throw error;

      setSelectedStudent(editedStudent);
      setStudents(students.map(s => s.lrn === originalLrn ? editedStudent : s));
      setIsEditing(false);
      setHasChanges(false);
      setSuccessMessage('Student information updated successfully!');
      setShowSuccessModal(true);
      setShowModal(false);
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student information');
    }
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    if (editedStudent) {
      const updatedStudent = { ...editedStudent, [field]: value };
      setEditedStudent(updatedStudent);
      const originalStudent = selectedStudent;
      if (originalStudent) {
        const changed = Object.keys(updatedStudent).some(key => updatedStudent[key as keyof Student] !== originalStudent[key as keyof Student]);
        setHasChanges(changed);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute left-68 inset-y-0 right-0 -z-10">
        <div className="w-full h-full bg-white"></div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen ml-68 overflow-y-auto">
        <div className="p-4 pl-32 pt-12">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">New Enrollees</h1>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md flex-grow hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
            <div className="border-b-2 border-gray-300 pb-2 mb-4">
              <h2 className="text-lg font-bold text-gray-600">LIST OF ALL NEW ENROLLEES:</h2>
            </div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 font-medium">SORT BY:</span>
                <select
                  value={sortStrand}
                  onChange={(e) => setSortStrand(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 shadow-sm"
                >
                  <option value="">STRAND</option>
                  <option value="STEM">STEM</option>
                  <option value="ABM">ABM</option>
                  <option value="HUMSS">HUMSS</option>
                  <option value="TVL-ICT">TVL-ICT</option>
                </select>
                <select
                  value={sortGradeLevel}
                  onChange={(e) => setSortGradeLevel(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 shadow-sm"
                >
                  <option value="">GRADE LEVEL</option>
                  <option value="None">None Graded</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
                <select
                  value={sortSemester}
                  onChange={(e) => setSortSemester(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 shadow-sm"
                >
                  <option value="">SEMESTER</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                </select>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, LRN, etc."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 text-gray-700 placeholder-gray-400 shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No new enrollees found</div>
              ) : (
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3 px-6">Action</th>
                      <th scope="col" className="py-3 px-6">LRN</th>
                      <th scope="col" className="py-3 px-6">Name</th>
                      <th scope="col" className="py-3 px-6">Strand</th>
                      <th scope="col" className="py-3 px-6">Grade Level</th>
                      <th scope="col" className="py-3 px-6">Semester</th>
                      <th scope="col" className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.lrn} className="bg-white border-b">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(student)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </button>
                            {student.strand === 'ALS' ? (
                              <button
                                onClick={() => handleApproveALS(student.lrn, `${student.lname}, ${student.fname}`)}
                                disabled={processing === student.lrn}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                <CheckCircle size={14} />
                                <span>Approve ALS</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprove(student.lrn, `${student.lname}, ${student.fname}`)}
                                disabled={processing === student.lrn}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                <CheckCircle size={14} />
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(student.lrn, `${student.lname}, ${student.fname}`)}
                              disabled={processing === student.lrn}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-6">{student.lrn || 'N/A'}</td>
                        <td className="py-3 px-6">{student.lname}, {student.fname} {student.mname}</td>
                        <td className="py-3 px-6">{student.strand}</td>
                        <td className="py-3 px-6">{student.gradeLevel}</td>
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
              )}
            </div>
          </div>
        </div>
      </div>

      <StudentDetailsModal
        isOpen={showModal}
        student={selectedStudent}
        editedStudent={editedStudent}
        isEditing={isEditing}
        hasChanges={hasChanges}
        onClose={() => setShowModal(false)}
        onEdit={() => setIsEditing(true)}
        onCancel={() => {
          setEditedStudent(selectedStudent ? { ...selectedStudent } : null);
          setIsEditing(false);
          setHasChanges(false);
        }}
        onSave={handleSave}
        onInputChange={handleInputChange}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        title={`Confirm ${confirmAction?.type === 'delete' ? 'Delete' : 'Approve'}`}
        message={
          confirmAction?.type === 'delete'
            ? `Are you sure you want to delete the student "${confirmAction?.studentName}"?`
            : `Are you sure you want to approve the student "${confirmAction?.studentName}"?`
        }
        warning={confirmAction?.type === 'delete' ? "This action cannot be undone." : undefined}
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Approve'}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction?.type === 'delete' ? handleConfirmDelete : handleConfirmApprove}
        type={confirmAction?.type || 'approve'}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}