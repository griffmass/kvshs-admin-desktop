import { useRef } from 'react';
import { Student } from '../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StudentDetailsModalProps {
  isOpen: boolean;
  student: Student | null;
  editedStudent: Student | null;
  isEditing: boolean;
  hasChanges: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onInputChange: (field: keyof Student, value: string) => void;
}

export default function StudentDetailsModal({
  isOpen,
  student,
  editedStudent,
  isEditing,
  hasChanges,
  onClose,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
}: StudentDetailsModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const handleGeneratePDF = () => {
    const input = modalContentRef.current;
    if (!input) return;

    const originalClass = input.className;
    input.className = originalClass.replace('overflow-y-auto', '').replace('max-h-[75vh]', '');

    html2canvas(input, { backgroundColor: '#ffffff' })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const margin = 10;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pageWidth - (margin * 2);
        const usableHeight = pageHeight - (margin * 2);

        const canvasRatio = canvas.width / canvas.height;
        let finalWidth, finalHeight;

        if (canvasRatio < (usableWidth / usableHeight)) {
          finalHeight = usableHeight;
          finalWidth = finalHeight * canvasRatio;
        } else {
          finalWidth = usableWidth;
          finalHeight = finalWidth / canvasRatio;
        }

        const x = margin + (usableWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'PNG', x, margin, finalWidth, finalHeight);
        pdf.save(`student-${student.lname}-${student.lrn}.pdf`);
      })
      .catch((err) => {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF');
      })
      .finally(() => {
        input.className = originalClass;
      });
  };

  const renderField = (label: string, field: keyof Student, type: string = 'text') => {
    const getFieldValue = (obj: Student | null): string => {
      if (!obj) return '';
      const val = obj[field];
      if (val === undefined || val === null) return '';
      return String(val);
    };

    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {isEditing ? (
          <input
            type={type}
            value={getFieldValue(editedStudent)}
            onChange={(e) => onInputChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-lg font-semibold text-gray-900">{getFieldValue(student) || 'N/A'}</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Student Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>

        <div ref={modalContentRef} className="p-6 overflow-y-auto max-h-[75vh]">
          {/* --- Personal Information --- */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-blue-600 mb-4 border-b-2 border-blue-200 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderField("LRN", "lrn")}
              {renderField("School Year", "schoolYear")}
              {renderField("Grade Level", "gradeLevel")}
              {renderField("PSA", "psa")}
              {renderField("Date", "date", "date")}
              {renderField("Contact Number", "cn")}
              {renderField("Last Name", "lname")}
              {renderField("First Name", "fname")}
              {renderField("Middle Name", "mname")}
              {renderField("Extension Name", "ename")}
              {renderField("Birthday", "bday", "date")}
              {renderField("Age", "age")}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                {isEditing ? (
                  <select
                    value={editedStudent?.sex || ''}
                    onChange={(e) => onInputChange('sex', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{student.sex || 'N/A'}</p>
                )}
              </div>

              {renderField("Birthplace", "birthplace")}
              {renderField("Religion", "religion")}
              {renderField("Mother Tongue", "motherTongue")}
              {renderField("Civil Status", "civilStatus")}
              {renderField("Indigenous People", "indigenousPeople")}
              {renderField("4Ps", "fourPS")}
            </div>
          </div>

          {/* --- Address Information --- */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-green-600 mb-4 border-b-2 border-green-200 pb-2">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">Current Address</h4>
                <div className="space-y-2">
                  {renderField("House Number", "houseNumber")}
                  {renderField("Street Name", "streetName")}
                  {renderField("Barangay", "barangay")}
                  {renderField("Municipality", "municipality")}
                  {renderField("Province", "province")}
                  {renderField("Country", "country")}
                  {renderField("Zip Code", "zipCode")}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">Permanent Address</h4>
                <div className="space-y-2">
                  {renderField("House Number", "pHN")}
                  {renderField("Street Name", "pSN")}
                  {renderField("Barangay", "pbrgy")}
                  {renderField("Municipality", "pMunicipal")}
                  {renderField("Province", "pProvince")}
                  {renderField("Country", "pCountry")}
                  {renderField("Zip Code", "pZipCode")}
                </div>
              </div>
            </div>
          </div>

          {/* --- Parent/Guardian Information --- */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">Parent/Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">Father</h4>
                {renderField("First Name", "fatherFN")}
                {renderField("Middle Name", "fatherMN")}
                {renderField("Last Name", "fatherLN")}
                {renderField("Contact", "fatherCN")}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">Mother</h4>
                {renderField("First Name", "motherFN")}
                {renderField("Middle Name", "motherMN")}
                {renderField("Last Name", "motherLN")}
                {renderField("Contact", "motherCN")}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">Guardian</h4>
                {renderField("First Name", "guardianFN")}
                {renderField("Middle Name", "guardianMN")}
                {renderField("Last Name", "guardianLN")}
                {renderField("Contact", "guardianCN")}
              </div>
            </div>
          </div>

          {/* --- Academic Information --- */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-orange-600 mb-4 border-b-2 border-orange-200 pb-2">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderField("SNEP", "SNEP")}
              {renderField("PWD", "pwd")}
              {renderField("PWD ID", "pwdID")}
              {renderField("Education Info", "education_information")}
              {renderField("OSY", "OSY")}
              {renderField("ALS Attended", "als_attended")}
              {renderField("Complete Program", "complete_program")}
              {renderField("KMS", "kms")}
              {renderField("Hour", "hour")}
              {renderField("Transportation", "transportation")}
              {renderField("Day", "day")}
              {renderField("Time", "time")}
              {renderField("RL Grade Level Comp.", "rlGradeLevelComplete")}
              {renderField("RL Last SY Comp.", "rlLastSYComplete")}
              {renderField("RL Last School", "rlLastSchoolAtt")}
              {renderField("RL School ID", "rlSchoolID")}
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                {isEditing ? (
                  <select
                    value={editedStudent?.semester || ''}
                    onChange={(e) => onInputChange('semester', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Semester</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                  </select>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{student.semester || 'N/A'}</p>
                )}
              </div>

              {renderField("Track", "track")}

              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
                {isEditing ? (
                  <select
                    value={editedStudent?.strand || ''}
                    onChange={(e) => onInputChange('strand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Strand</option>
                    <option value="STEM">STEM</option>
                    <option value="ABM">ABM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="TVL-ICT">TVL-ICT</option>
                    <option value="ALS">ALS</option>
                  </select>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{student.strand || 'N/A'}</p>
                )}
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance Learning</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={Array.isArray(editedStudent?.distanceLearning) 
                      ? editedStudent?.distanceLearning.join(', ') 
                      : editedStudent?.distanceLearning || ''}
                    onChange={(e) => onInputChange('distanceLearning', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">
                    {Array.isArray(student.distanceLearning) 
                      ? student.distanceLearning.join(', ') 
                      : student.distanceLearning || 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
                {isEditing ? (
                  <select
                    value={editedStudent?.enrollment_status || ''}
                    onChange={(e) => onInputChange('enrollment_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Enrolled">Enrolled</option>
                  </select>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{student.enrollment_status || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-white">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
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
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}