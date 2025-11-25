import { useEffect, useState, useRef } from 'react';
import { supabase, Student } from '../lib/supabase';
import { Search, Eye, CheckCircle, Trash2, Pencil } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// HighlightedText component for search highlighting
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default function ALSNewEnrollees() {
  const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
  const lrnDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState('');
  const [sortSex, setSortSex] = useState('');
  const [sortLRN, setSortLRN] = useState('');
  const [sortDate, setSortDate] = useState('');
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
    type: 'enroll' | 'delete';
    studentLrn: string | undefined;
    studentName?: string;
  } | null>(null);

  const modalContentRef = useRef<HTMLDivElement>(null);

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.lname || ''}, ${student.fname || ''} ${student.mname || ''}`.trim();
    const matchesSearch = searchTerm === '' ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.lrn && student.lrn.toString().includes(searchTerm));

    const matchesAlphabetical = sortAlphabetical === '' ||
      (student.lname && student.lname.toLowerCase().startsWith(sortAlphabetical.toLowerCase())) ||
      (student.fname && student.fname.toLowerCase().startsWith(sortAlphabetical.toLowerCase())) ||
      (student.mname && student.mname.toLowerCase().startsWith(sortAlphabetical.toLowerCase()));

    const matchesLRN = sortLRN === '' || (student.lrn && student.lrn.toString().startsWith(sortLRN));
    const matchesSex = sortSex === '' || student.sex === sortSex;

    return matchesSearch && matchesAlphabetical && matchesSex && matchesLRN;
  }).sort((a, b) => {
    if (sortDate === '') return 0;

    const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
    const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;

    if (sortDate === 'newest') {
      return dateB - dateA; // Descending (newest first)
    } else if (sortDate === 'oldest') {
      return dateA - dateB; // Ascending (oldest first)
    }

    return 0;
  });

  useEffect(() => {
    fetchALSNewEnrollees();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('als_new_enrollees')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ALS' }, () => {
        fetchALSNewEnrollees();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchALSNewEnrollees = async () => {
    try {
      const { data, error } = await supabase
        .from('ALS')
        .select('*')
        .eq('enrollment_status', 'Pending');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching ALS new enrollees:', error);
    }
  };

  const handleEnroll = (studentLrn: string | undefined, studentName?: string) => {
    if (!studentLrn) return;
    setConfirmAction({
      type: 'enroll',
      studentLrn,
      studentName
    });
    setShowConfirmModal(true);
  };

  const handleConfirmEnroll = async () => {
    if (!confirmAction || confirmAction.type !== 'enroll') return;

    try {
      const { error } = await supabase
        .from('ALS')
        .update({
          enrollment_status: 'Enrolled',
          approved_at: new Date().toISOString()
        })
        .eq('lrn', confirmAction.studentLrn);

      if (error) throw error;

      setStudents(students.filter((s) => s.lrn !== confirmAction.studentLrn));
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSuccessMessage('Student enrolled successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('Failed to enroll student');
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

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setOriginalLrn(student.lrn);
    setShowModal(true);
    setIsEditing(true);
    setHasChanges(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setEditedStudent(null);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditedStudent(selectedStudent ? { ...selectedStudent } : null);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedStudent || !originalLrn || !hasChanges) return;

    try {
      // Create a copy of editedStudent and handle array fields properly
      const updateData = { ...editedStudent };
      const processedData: Record<string, unknown> = {};
      const arrayFields = ['distanceLearning']; // Add other array field names here

      Object.keys(updateData).forEach(key => {
        const value = (updateData as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          processedData[key] = value;
        } else if (arrayFields.includes(key) && typeof value === 'string' && value.trim()) {
          // Convert comma-separated string back to array for array fields
          processedData[key] = value.split(',').map(item => item.trim());
        } else {
          processedData[key] = value;
        }
      });

      const { error } = await supabase
        .from('ALS')
        .update(processedData)
        .eq('lrn', originalLrn);

      if (error) throw error;

      setSelectedStudent(editedStudent);
      setStudents(students.map(s => s.lrn === originalLrn ? editedStudent : s));
      setIsEditing(false);
      setHasChanges(false);
      setSuccessMessage('Student information updated successfully!');
      setShowSuccessModal(true);
      closeModal();
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student information');
    }
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    if (editedStudent) {
      const updatedStudent = { ...editedStudent, [field]: value };
      setEditedStudent(updatedStudent);
      // Check if there are changes compared to original student
      const originalStudent = selectedStudent;
      if (originalStudent) {
        const changed = Object.keys(updatedStudent).some(key => updatedStudent[key as keyof Student] !== originalStudent[key as keyof Student]);
        setHasChanges(changed);
      }
    }
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
      const { error } = await supabase
        .from('ALS')
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
    }
  };

  const handleGeneratePDF = () => {
    const input = modalContentRef.current;

    // Get the grandparent modal container (which has max-h-[95vh])
    const modalContainer = input?.parentElement?.parentElement;

    if (!input || !modalContainer || !selectedStudent) {
      console.error('Modal elements or student not found');
      return;
    }

    // 1. Store original CSS classes to restore them later
    const inputOriginalClass = input.className;
    const containerOriginalClass = modalContainer.className;

    // 2. Temporarily remove all overflow and max-height classes
    input.className = input.className
      .replace('overflow-y-auto', '')
      .replace('max-h-[75vh]', '');
    modalContainer.className = modalContainer.className
      .replace('overflow-hidden', '')
      .replace('max-h-[95vh]', '');

    // 3. Run html2canvas on the now-full-height content
    html2canvas(input, {
      backgroundColor: '#ffffff',
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

        // 4. Set PDF back to A4 size
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const margin = 10;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pageWidth - (margin * 2);
        const usableHeight = pageHeight - (margin * 2);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let finalWidth, finalHeight;
        if (canvasRatio < (usableWidth / usableHeight)) {
          finalHeight = usableHeight;
          finalWidth = finalHeight * canvasRatio;
        } else {
          finalWidth = usableWidth;
          finalHeight = finalWidth / canvasRatio;
        }

        const x = margin + (usableWidth - finalWidth) / 2;
        const y = margin;

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        pdf.save(`student-${selectedStudent.lname}-${selectedStudent.lrn}.pdf`);
      })
      .catch((err) => {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF');
      })
      .finally(() => {
        // 5. ALWAYS restore the original classes
        input.className = inputOriginalClass;
        modalContainer.className = containerOriginalClass;
      });
  };


  return (
    <div className="w-full">
      <div className="border-b-2 border-gray-300 pb-2 mb-4">
        <h2 className="text-lg font-bold text-gray-800">LIST OF ALL ALS NEW ENROLLEES:</h2>
      </div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">SORT BY:</span>
          <select
            value={sortAlphabetical}
            onChange={(e) => setSortAlphabetical(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 shadow-sm"
            title="Filter students by the starting letter of their First, Middle, or Last Name"
          >
            <option value="">NAME (First/Mid/Last)</option>
            {alphabet.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>
          <select
            value={sortSex}
            onChange={(e) => setSortSex(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 shadow-sm"
          >
            <option value="">SEX</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            value={sortLRN}
            onChange={(e) => setSortLRN(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 shadow-sm"
          >
            <option value="">LRN (Start)</option>
            {lrnDigits.map((digit) => (
              <option key={digit} value={digit}>
                {digit}
              </option>
            ))}
          </select>
          <select
            value={sortDate}
            onChange={(e) => setSortDate(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 shadow-sm"
          >
            <option value="">SUBMITTED DATE</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, LRN, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && console.log('Search triggered')}
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
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-600">
          Searching for: <span className="font-medium text-blue-600">"{searchTerm}"</span>
          <span className="ml-2 text-xs text-gray-500">
            ({filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''} found)
          </span>
        </div>
      )}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No ALS new enrollees found</div>
        ) : (
          <table className="w-full table-fixed text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-600 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="py-3 px-6" style={{width: '16.5%'}}>Action</th>
                <th scope="col" className="py-3 px-6" style={{width: '15%'}}>LRN</th>
                <th scope="col" className="py-3 px-6" style={{width: '22%'}}>Name</th>
                <th scope="col" className="py-3 px-6" style={{width: '8%'}}>Age</th>
                <th scope="col" className="py-3 px-6" style={{width: '17%'}}>Submitted At</th>
                <th scope="col" className="py-3 px-6" style={{width: '10.5%'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.lrn} className="bg-white border-b">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(student)}
                        className="p-1.5 bg-blue-400 text-white text-xs rounded hover:bg-blue-600"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="p-1.5 bg-yellow-400 text-white text-xs rounded hover:bg-yellow-600"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.lrn, `${student.lname}, ${student.fname}`)}
                        className="p-1.5 bg-red-400 text-white text-xs rounded hover:bg-red-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => handleEnroll(student.lrn, `${student.lname}, ${student.fname}`)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-400 text-white text-xs rounded hover:bg-green-600"
                      >
                        <CheckCircle size={14} />
                        <span>Enroll</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-6"><HighlightedText text={student.lrn || 'N/A'} highlight={searchTerm} /></td>
                  <td className="py-3 px-6"><HighlightedText text={`${student.lname}, ${student.fname} ${student.mname}`} highlight={searchTerm} /></td>
                  <td className="py-3 px-6">{student.age}</td>
                  <td className="py-3 px-6">
                    {student.added_at
                      ? new Date(student.added_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-6">
                    <span className="bg-yellow-100 text-yellow-600 text-xs font-medium px-2.5 py-0.5 rounded">
                      {student.enrollment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Confirm {confirmAction.type === 'delete' ? 'Delete' : 'Enroll'}
                </h2>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-lg">
                  {confirmAction.type === 'delete'
                    ? `Are you sure you want to delete the student "${confirmAction.studentName}"?`
                    : `Are you sure you want to enroll the student "${confirmAction.studentName}"?`
                  }
                </p>
                {confirmAction.type === 'delete' && (
                  <p className="text-red-600 text-sm mt-2 font-medium">
                    This action cannot be undone.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.type === 'delete' ? handleConfirmDelete : handleConfirmEnroll}
                  className={`px-6 py-2 text-white rounded-lg transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    confirmAction.type === 'delete'
                      ? 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 focus:ring-red-600'
                      : 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:ring-green-600'
                  }`}
                >
                  {confirmAction.type === 'delete' ? 'Delete' : 'Enroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Success</h2>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg text-center">{successMessage}</p>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing student details */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-3xl font-bold text-gray-800">Student Details</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>
              <div ref={modalContentRef} className="overflow-y-auto max-h-[75vh]">
                {/* Personal Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-blue-600 mb-4 border-b-2 border-blue-200 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">LRN</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.lrn || ''}
                          onChange={(e) => handleInputChange('lrn', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.lrn || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedStudent?.date || ''}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.date || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.cn || ''}
                          onChange={(e) => handleInputChange('cn', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.cn || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.lname || ''}
                          onChange={(e) => handleInputChange('lname', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.lname || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.fname || ''}
                          onChange={(e) => handleInputChange('fname', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.fname || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.mname || ''}
                          onChange={(e) => handleInputChange('mname', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.mname || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Extension Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.ename || ''}
                          onChange={(e) => handleInputChange('ename', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.ename || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedStudent?.bday || ''}
                          onChange={(e) => handleInputChange('bday', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.bday || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.age || ''}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.age || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      {isEditing ? (
                        <select
                          value={editedStudent?.sex || ''}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.sex || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birthplace</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.birthplace || ''}
                          onChange={(e) => handleInputChange('birthplace', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.birthplace || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.religion || ''}
                          onChange={(e) => handleInputChange('religion', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.religion || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Tongue</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.motherTongue || ''}
                          onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.motherTongue || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.civilStatus || ''}
                          onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.civilStatus || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indigenous People</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.indigenousPeople || ''}
                          onChange={(e) => handleInputChange('indigenousPeople', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.indigenousPeople || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">4Ps</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.fourPS || ''}
                          onChange={(e) => handleInputChange('fourPS', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.fourPS || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-green-600 mb-4 border-b-2 border-green-200 pb-2">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Current Address</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">House Number:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.houseNumber || ''}
                              onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.houseNumber || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Street Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.streetName || ''}
                              onChange={(e) => handleInputChange('streetName', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.streetName || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Barangay:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.barangay || ''}
                              onChange={(e) => handleInputChange('barangay', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.barangay || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Municipality:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.municipality || ''}
                              onChange={(e) => handleInputChange('municipality', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.municipality || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Province:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.province || ''}
                              onChange={(e) => handleInputChange('province', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.province || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Country:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.country || ''}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.country || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Zip Code:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.zipCode || ''}
                              onChange={(e) => handleInputChange('zipCode', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.zipCode || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Permanent Address</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">House Number:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pHN || ''}
                              onChange={(e) => handleInputChange('pHN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pHN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Street Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pSN || ''}
                              onChange={(e) => handleInputChange('pSN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pSN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Barangay:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pbrgy || ''}
                              onChange={(e) => handleInputChange('pbrgy', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pbrgy || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Municipality:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pMunicipal || ''}
                              onChange={(e) => handleInputChange('pMunicipal', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pMunicipal || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Province:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pProvince || ''}
                              onChange={(e) => handleInputChange('pProvince', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pProvince || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Country:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pCountry || ''}
                              onChange={(e) => handleInputChange('pCountry', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pCountry || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Zip Code:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pZipCode || ''}
                              onChange={(e) => handleInputChange('pZipCode', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pZipCode || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">Parent/Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Father</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">First Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherFN || ''}
                              onChange={(e) => handleInputChange('fatherFN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherFN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Middle Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherMN || ''}
                              onChange={(e) => handleInputChange('fatherMN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherMN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Last Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherLN || ''}
                              onChange={(e) => handleInputChange('fatherLN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherLN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Contact:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherCN || ''}
                              onChange={(e) => handleInputChange('fatherCN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherCN || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Mother</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">First Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherFN || ''}
                              onChange={(e) => handleInputChange('motherFN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherFN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Middle Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherMN || ''}
                              onChange={(e) => handleInputChange('motherMN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherMN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Last Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherLN || ''}
                              onChange={(e) => handleInputChange('motherLN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherLN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Contact:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherCN || ''}
                              onChange={(e) => handleInputChange('motherCN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherCN || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Guardian</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">First Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianFN || ''}
                              onChange={(e) => handleInputChange('guardianFN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianFN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Middle Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianMN || ''}
                              onChange={(e) => handleInputChange('guardianMN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianMN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Last Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianLN || ''}
                              onChange={(e) => handleInputChange('guardianLN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianLN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Contact:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianCN || ''}
                              onChange={(e) => handleInputChange('guardianCN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianCN || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-orange-600 mb-4 border-b-2 border-orange-200 pb-2">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">PWD</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.pwd || ''}
                          onChange={(e) => handleInputChange('pwd', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.pwd || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">PWD ID</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.pwdID || ''}
                          onChange={(e) => handleInputChange('pwdID', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.pwdID || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education Information</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.education_information || ''}
                          onChange={(e) => handleInputChange('education_information', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.education_information || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">OSY</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.OSY || ''}
                          onChange={(e) => handleInputChange('OSY', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.OSY || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ALS Attended</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.als_attended || ''}
                          onChange={(e) => handleInputChange('als_attended', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.als_attended || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complete Program</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.complete_program || ''}
                          onChange={(e) => handleInputChange('complete_program', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.complete_program || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">KMS</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.kms || ''}
                          onChange={(e) => handleInputChange('kms', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.kms || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hour</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.hour || ''}
                          onChange={(e) => handleInputChange('hour', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.hour || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transportation</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.transportation || ''}
                          onChange={(e) => handleInputChange('transportation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.transportation || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.day || ''}
                          onChange={(e) => handleInputChange('day', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.day || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.time || ''}
                          onChange={(e) => handleInputChange('time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.time || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance Learning</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={Array.isArray(editedStudent?.distanceLearning) ? editedStudent.distanceLearning.join(', ') : editedStudent?.distanceLearning || ''}
                          onChange={(e) => handleInputChange('distanceLearning', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{Array.isArray(selectedStudent.distanceLearning) ? selectedStudent.distanceLearning.join(', ') : selectedStudent.distanceLearning || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
                      {isEditing ? (
                        <select
                          value={editedStudent?.enrollment_status || ''}
                          onChange={(e) => handleInputChange('enrollment_status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Enrolled">Enrolled</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.enrollment_status || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end border-t pt-4">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <div className="w-4"></div>
                    <button
                      onClick={handleSave}
                      disabled={!hasChanges}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Save
                    </button>
                  </>
                )}
                <button
                  onClick={handleGeneratePDF}
                  disabled={isEditing}
                  className="ml-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}