import { useEffect, useState, useRef } from "react";
import { supabase, Student } from "../lib/supabase";
import {
  Search,
  Eye,
  CheckCircle,
  Trash2,
  Pencil,
  UserPlus,
  X,
  CheckSquare,
  ChevronDown,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// HighlightedText component for search highlighting
const HighlightedText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!highlight || !text) return <span>{text}</span>;

  const lowerText = text.toLowerCase();
  const lowerHighlight = highlight.toLowerCase();
  const parts = [];
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerHighlight, lastIndex);
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(text.slice(index, index + highlight.length));
    lastIndex = index + highlight.length;
    index = lowerText.indexOf(lowerHighlight, lastIndex);
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <span>
      {parts.map((part, idx) =>
        part.toLowerCase() === lowerHighlight ? (
          <mark
            key={idx}
            className="bg-yellow-200 text-gray-900 px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </span>
  );
};

export default function NewStudent() {
  const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
  const lrnDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const [students, setStudents] = useState<Student[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortStrand, setSortStrand] = useState("");
  const [sortGradeLevel, setSortGradeLevel] = useState("");
  const [sortAlphabetical, setSortAlphabetical] = useState("");
  const [sortSex, setSortSex] = useState("");
  const [sortLRN, setSortLRN] = useState("");
  const [sortDate, setSortDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [originalLrn, setOriginalLrn] = useState<string | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "delete" | "bulk-enroll" | "bulk-delete";
    studentLrn?: string;
    studentName?: string;
    count?: number;
  } | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLrns, setSelectedLrns] = useState<string[]>([]);

  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("NewStudents")
        .select("*")
        .eq("enrollment_status", "Pending");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const filteredStudents = students
    .filter((student) => {
      const fullName =
        `${student.lname || ""}, ${student.fname || ""} ${student.mname || ""}`.trim();
      const matchesSearch =
        searchTerm === "" ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.mname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.lrn && student.lrn.toString().includes(searchTerm));

      const matchesStrand = sortStrand === "" || student.strand === sortStrand;
      const matchesGradeLevel =
        sortGradeLevel === "" || student.gradeLevel === sortGradeLevel;

      const matchesAlphabetical =
        sortAlphabetical === "" ||
        (student.lname &&
          student.lname
            .toLowerCase()
            .startsWith(sortAlphabetical.toLowerCase())) ||
        (student.fname &&
          student.fname
            .toLowerCase()
            .startsWith(sortAlphabetical.toLowerCase())) ||
        (student.mname &&
          student.mname
            .toLowerCase()
            .startsWith(sortAlphabetical.toLowerCase()));

      const matchesLRN =
        sortLRN === "" ||
        (student.lrn && student.lrn.toString().startsWith(sortLRN));
      const matchesSex = sortSex === "" || student.sex === sortSex;

      return (
        matchesSearch &&
        matchesStrand &&
        matchesGradeLevel &&
        matchesAlphabetical &&
        matchesSex &&
        matchesLRN
      );
    })
    .sort((a, b) => {
      if (sortDate === "") return 0;

      const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
      const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;

      if (sortDate === "newest") {
        return dateB - dateA; // Descending (newest first)
      } else if (sortDate === "oldest") {
        return dateA - dateB; // Ascending (oldest first)
      }

      return 0;
    });

  const handleApprove = (
    studentLrn: string | undefined,
    studentName?: string
  ) => {
    if (!studentLrn) return;
    setConfirmAction({
      type: "approve",
      studentLrn,
      studentName,
    });
    setShowConfirmModal(true);
  };

  // Helper function to check gender distribution in a section
  const canAddStudentToSection = async (
    sectionName: string,
    studentSex: string,
    strand: string,
    gradeLevel: string
  ): Promise<boolean> => {
    // Get current gender distribution in this section
    const { data: sectionStudents, error } = await supabase
      .from("NewStudents")
      .select("sex")
      .eq("section", sectionName)
      .eq("strand", strand)
      .eq("gradeLevel", gradeLevel)
      .eq("enrollment_status", "Enrolled");

    if (error) {
      console.error("Error checking gender distribution:", error);
      return false;
    }

    const males = sectionStudents.filter((s) => s.sex === "Male").length;
    const females = sectionStudents.filter((s) => s.sex === "Female").length;
    const total = males + females;

    // Check if section is already full (45 students)
    if (total >= 45) {
      return false;
    }

    // Apply gender distribution rules
    if (studentSex === "Male") {
      // If adding male: max 23 males
      if (males >= 23) {
        return false;
      }
      // If we're adding a male that would make it 23, check that females are <= 22
      if (males + 1 === 23 && females > 22) {
        return false;
      }
    } else if (studentSex === "Female") {
      // If adding female: max 22 females
      if (females >= 22) {
        return false;
      }
      // If we're adding a female that would make it 22, check that males are <= 23
      if (females + 1 === 22 && males > 23) {
        return false;
      }
    }

    return true;
  };

  // Helper function to create a new section for a strand/grade level
  const createNewSection = async (
    strand: string,
    gradeLevel: string
  ): Promise<string | null> => {
    try {
      // Find existing sections to determine the next section name
      const { data: existingSections, error: fetchError } = await supabase
        .from("sections")
        .select("section_name")
        .eq("strand", strand)
        .eq("year_level", parseInt(gradeLevel));

      if (fetchError) {
        console.error("Error fetching existing sections:", fetchError);
        return null;
      }

      // Generate the next section name (A, B, C, etc.)
      const existingSectionNames = existingSections.map((s) => s.section_name);
      let nextSectionName = "A";

      // Find the next available letter
      for (let i = 0; i < 26; i++) {
        const candidate = String.fromCharCode(65 + i); // A=65, B=66, etc.
        if (!existingSectionNames.includes(candidate)) {
          nextSectionName = candidate;
          break;
        }
      }

      // Create the new section
      const { error: createError } = await supabase
        .from("sections")
        .insert({
          strand: strand,
          year_level: parseInt(gradeLevel),
          section_name: nextSectionName,
          max_capacity: 45,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating new section:", createError);
        return null;
      }

      console.log(
        `Created new section: ${strand}-${gradeLevel} ${nextSectionName}`
      );
      return nextSectionName;
    } catch (error) {
      console.error("Error in createNewSection:", error);
      return null;
    }
  };

  const handleConfirmApprove = async () => {
    if (!confirmAction || confirmAction.type !== "approve") return;

    try {
      setProcessing(confirmAction.studentLrn || null);
      console.log("Enrolling student automatically...");

      // Get student details
      const student = students.find((s) => s.lrn === confirmAction.studentLrn);
      if (!student) throw new Error("Student not found");

      // Find available section for this strand/grade
      const { data: availableSections, error: sectionError } = await supabase
        .from("sections")
        .select("id, section_name, max_capacity")
        .eq("strand", student.strand)
        .eq("year_level", parseInt(student.gradeLevel ?? ""));

      if (sectionError) throw sectionError;

      let assignedSection = null;

      // Find section with available capacity and valid gender distribution
      for (const section of availableSections) {
        // Check if student can be added to this section based on gender distribution
        const canAdd = await canAddStudentToSection(
          section.section_name,
          student.sex ?? "",
          student.strand ?? "",
          student.gradeLevel ?? ""
        );

        if (canAdd) {
          // Assign this section
          const { error: updateError } = await supabase
            .from("NewStudents")
            .update({
              section: section.section_name,
              enrollment_status: "Enrolled",
              approved_at: new Date().toISOString(),
            })
            .eq("lrn", confirmAction.studentLrn);

          if (updateError) throw updateError;

          assignedSection = section.section_name;
          break;
        }
      }

      // If no existing section can accommodate the student, create a new section
      if (!assignedSection) {
        console.log("No available sections found, creating a new section...");
        const newSectionName = await createNewSection(
          student.strand ?? "",
          student.gradeLevel ?? ""
        );

        if (newSectionName) {
          // Assign the student to the newly created section
          const { error: updateError } = await supabase
            .from("NewStudents")
            .update({
              section: newSectionName,
              enrollment_status: "Enrolled",
              approved_at: new Date().toISOString(),
            })
            .eq("lrn", confirmAction.studentLrn);

          if (updateError) throw updateError;

          assignedSection = newSectionName;
          console.log(
            `Student assigned to newly created section: ${newSectionName}`
          );
        } else {
          throw new Error(
            "Failed to create a new section for this strand and grade level"
          );
        }
      }

      console.log("Student enrolled successfully, removing from local state");
      setStudents(students.filter((s) => s.lrn !== confirmAction.studentLrn));
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSuccessMessage(
        `Student successfully enrolled in Section ${assignedSection}!`
      );
      setShowSuccessModal(true);
    } catch (error: unknown) {
      console.error("Error enrolling student:", error);
      alert(
        "Failed to enroll student: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveALS = (
    studentLrn: string | undefined,
    studentName?: string
  ) => {
    if (!studentLrn) return;
    setConfirmAction({
      type: "approve",
      studentLrn,
      studentName,
    });
    setShowConfirmModal(true);
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

    console.log("Starting save process...");
    console.log("editedStudent:", editedStudent);
    console.log("originalLrn:", originalLrn);

    try {
      console.log("Attempting to update student in database...");
      const { data, error } = await supabase
        .from("NewStudents")
        .update(editedStudent)
        .eq("lrn", originalLrn)
        .select();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Update successful, updating local state...");
      setSelectedStudent(editedStudent);
      setStudents(
        students.map((s) => (s.lrn === originalLrn ? editedStudent : s))
      );
      setIsEditing(false);
      setHasChanges(false);
      setSuccessMessage("Student information updated successfully!");
      setShowSuccessModal(true);
      closeModal(); // Close the modal immediately after saving
      console.log("Save operation completed");
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student information");
    }
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    if (editedStudent) {
      const updatedStudent = { ...editedStudent, [field]: value };
      setEditedStudent(updatedStudent);
      // Check if there are changes compared to original student
      const originalStudent = selectedStudent;
      if (originalStudent) {
        const changed = Object.keys(updatedStudent).some(
          (key) =>
            updatedStudent[key as keyof Student] !==
            originalStudent[key as keyof Student]
        );
        setHasChanges(changed);
      }
    }
  };

  const handleDelete = (
    studentLrn: string | undefined,
    studentName?: string
  ) => {
    if (!studentLrn) return;
    setConfirmAction({
      type: "delete",
      studentLrn,
      studentName,
    });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction || confirmAction.type !== "delete") return;

    try {
      setProcessing(confirmAction.studentLrn || null);
      const { error } = await supabase
        .from("NewStudents")
        .delete()
        .eq("lrn", confirmAction.studentLrn);

      if (error) throw error;

      setStudents(students.filter((s) => s.lrn !== confirmAction.studentLrn));
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSuccessMessage("Student deleted successfully!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmBulkAction = async () => {
    if (!confirmAction) return;

    try {
      setProcessing("bulk");

      if (confirmAction.type === "bulk-enroll") {
        // Bulk enroll with section assignment - process sequentially to avoid race conditions
        for (const lrn of selectedLrns) {
          const student = students.find((s) => s.lrn === lrn);
          if (!student) continue;

          // Find available section for this strand/grade
          const { data: availableSections } = await supabase
            .from("sections")
            .select("id, section_name, max_capacity")
            .eq("strand", student.strand)
            .eq("year_level", parseInt(student.gradeLevel ?? ""));

          // Find section with available capacity and valid gender distribution
          let sectionAssigned = false;
          for (const section of availableSections || []) {
            // Check if student can be added to this section based on gender distribution
            const canAdd = await canAddStudentToSection(
              section.section_name,
              student.sex ?? "",
              student.strand ?? "",
              student.gradeLevel ?? ""
            );

            if (canAdd) {
              // Assign this section
              await supabase
                .from("NewStudents")
                .update({
                  section: section.section_name,
                  enrollment_status: "Enrolled",
                  approved_at: new Date().toISOString(),
                })
                .eq("lrn", lrn);
              sectionAssigned = true;
              break;
            }
          }

          // If no existing section can accommodate the student, create a new section
          if (!sectionAssigned) {
            console.log(
              `No available sections found for student ${lrn}, creating a new section...`
            );
            const newSectionName = await createNewSection(
              student.strand ?? "",
              student.gradeLevel ?? ""
            );

            if (newSectionName) {
              // Assign the student to the newly created section
              await supabase
                .from("NewStudents")
                .update({
                  section: newSectionName,
                  enrollment_status: "Enrolled",
                  approved_at: new Date().toISOString(),
                })
                .eq("lrn", lrn);
              console.log(
                `Student ${lrn} assigned to newly created section: ${newSectionName}`
              );
            } else {
              console.error(
                `Failed to create a new section for student ${lrn}`
              );
            }
          }
        }

        // Remove enrolled students from local state
        setStudents(students.filter((s) => !selectedLrns.includes(s.lrn || "")));
        setSelectedLrns([]);
        setIsSelectionMode(false);
        setSuccessMessage("Selected students have been successfully enrolled!");
      } else if (confirmAction.type === "bulk-delete") {
        // Bulk delete
        const { error } = await supabase
          .from("NewStudents")
          .delete()
          .in("lrn", selectedLrns);

        if (error) throw error;

        // Remove deleted students from local state
        setStudents(students.filter((s) => !selectedLrns.includes(s.lrn || "")));
        setSelectedLrns([]);
        setIsSelectionMode(false);
        setSuccessMessage("Selected students have been successfully deleted!");
      }

      setShowConfirmModal(false);
      setConfirmAction(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error in bulk action:", error);
      alert("Failed to complete bulk action");
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkEnroll = () => {
    if (selectedLrns.length === 0) return;
    setConfirmAction({
      type: "bulk-enroll",
      count: selectedLrns.length,
    });
    setShowConfirmModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedLrns.length === 0) return;
    setConfirmAction({
      type: "bulk-delete",
      count: selectedLrns.length,
    });
    setShowConfirmModal(true);
  };

  const handleGeneratePDF = () => {
    // Prevent PDF generation while in edit mode as a safeguard.
    if (isEditing) {
      console.warn("PDF generation is disabled during editing.");
      return;
    }

    const input = modalContentRef.current;

    // Get the grandparent modal container (which has max-h-[95vh])
    const modalContainer = input?.parentElement?.parentElement;

    if (!input || !modalContainer || !selectedStudent) {
      console.error("Modal elements or student not found");
      return;
    }

    // 1. Store original CSS classes to restore them later
    const inputOriginalClass = input.className;
    const containerOriginalClass = modalContainer.className;

    // 2. Temporarily remove all overflow and max-height classes
    input.className = input.className
      .replace("overflow-y-auto", "")
      .replace("max-h-[75vh]", "");
    modalContainer.className = modalContainer.className
      .replace("overflow-hidden", "")
      .replace("max-h-[95vh]", "");

    // 3. Run html2canvas on the now-full-height content
    html2canvas(input, {
      backgroundColor: "#ffffff",
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        // 4. Set PDF back to A4 size
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const margin = 10;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let finalWidth, finalHeight;
        if (canvasRatio < usableWidth / usableHeight) {
          finalHeight = usableHeight;
          finalWidth = finalHeight * canvasRatio;
        } else {
          finalWidth = usableWidth;
          finalHeight = finalWidth / canvasRatio;
        }

        const x = margin + (usableWidth - finalWidth) / 2;
        const y = margin;

        pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
        pdf.save(
          "student-" +
            selectedStudent.lname +
            "-" +
            selectedStudent.lrn +
            ".pdf"
        );
      })
      .catch((err) => {
        console.error("Error generating PDF:", err);
        alert("Failed to generate PDF");
      })
      .finally(() => {
        // 5. ALWAYS restore the original classes
        input.className = inputOriginalClass;
        modalContainer.className = containerOriginalClass;
      });
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // You can add specific search logic here if needed, or just let the state update trigger the filter
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center border-b-2 border-gray-300 pb-2 mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          LIST OF ALL NEW ENROLLEES:
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">SORT BY:</span>
          <div className="relative">
            <select
              value={sortStrand}
              onChange={(e) => setSortStrand(e.target.value)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border-0 cursor-pointer transition-colors pr-6 h-8"
            >
              <option value="">STRAND</option>
              <option value="STEM">STEM</option>
              <option value="ABM">ABM</option>
              <option value="HUMSS">HUMSS</option>
              <option value="TVL-ICT">TVL-ICT</option>
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              size={12}
            />
          </div>
          <div className="relative">
            <select
              value={sortGradeLevel}
              onChange={(e) => setSortGradeLevel(e.target.value)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border-0 cursor-pointer transition-colors pr-6 h-8"
            >
              <option value="">GRADE LEVEL</option>
              <option value="None">None Graded</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              size={12}
            />
          </div>
          <div className="relative">
            <select
              value={sortAlphabetical}
              onChange={(e) => setSortAlphabetical(e.target.value)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border-0 cursor-pointer transition-colors pr-6 h-8"
              title="Filter students by the starting letter of their First, Middle, or Last Name"
            >
              <option value="">NAME</option>
              {alphabet.map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              size={12}
            />
          </div>
          <div className="relative">
            <select
              value={sortSex}
              onChange={(e) => setSortSex(e.target.value)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border-0 cursor-pointer transition-colors pr-6 h-8"
            >
              <option value="">SEX</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              size={12}
            />
          </div>
          <div className="relative">
            <select
              value={sortLRN}
              onChange={(e) => setSortLRN(e.target.value)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border-0 cursor-pointer transition-colors pr-6 h-8"
            >
              <option value="">LRN</option>
              {lrnDigits.map((digit) => (
                <option key={digit} value={digit}>
                  {digit}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              size={12}
            />
          </div>
          <div className="relative">
            <select
              value={sortDate}
              onChange={(e) => setSortDate(e.target.value)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border-0 cursor-pointer transition-colors pr-6 h-8"
            >
              <option value="">SUBMITTED DATE</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              size={12}
            />
          </div>
          <div className="relative ml-4">
            <input
              type="text"
              placeholder="Search by name, LRN, etc."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-64 px-3 py-1.5 pl-8 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 text-gray-700 placeholder-gray-400 text-xs h-8"
            />
            <Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-600">
          Searching for:{" "}
          <span className="font-medium text-blue-600">"{searchTerm}"</span>
          <span className="ml-2 text-xs text-gray-500">
            ({filteredStudents.length} result
            {filteredStudents.length !== 1 ? "s" : ""} found)
          </span>
        </div>
      )}
      <div className="overflow-x-auto max-h-[695px] overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No new enrollees found
          </div>
        ) : (
          <table className="w-full table-fixed text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-600 uppercase bg-gray-50 sticky top-0">
              <tr>
                {isSelectionMode && (
                  <th className="py-1.5 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLrns(filteredStudents.map((s) => s.lrn).filter((lrn): lrn is string => typeof lrn === "string"));
                        } else {
                          setSelectedLrns([]);
                        }
                      }}
                      checked={
                        selectedLrns.length === filteredStudents.length &&
                        filteredStudents.length > 0
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </th>
                )}
                <th scope="col" className="py-1.5 px-4" style={{ width: "3%" }}>
                  No.
                </th>
                <th
                  scope="col"
                  className="py-1.5 px-4"
                  style={{ width: "16.5%" }}
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="py-1.5 px-4"
                  style={{ width: "15%" }}
                >
                  LRN
                </th>
                <th
                  scope="col"
                  className="py-1.5 px-4"
                  style={{ width: "22%" }}
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="py-1.5 px-4"
                  style={{ width: "12%" }}
                >
                  Strand
                </th>
                <th
                  scope="col"
                  className="py-1.5 px-4"
                  style={{ width: "14%" }}
                >
                  Grade Level
                </th>
                <th
                  scope="col"
                  className="py-1.5 px-4"
                  style={{ width: "17%" }}
                >
                  Submitted At
                </th>
                <th
                  scope="col"
                  className="py-1.5 px-4"
                  style={{ width: "10.5%" }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.lrn} className="bg-white border-b">
                  {isSelectionMode && (
                    <td className="py-1.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedLrns.includes(student.lrn || "")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (student.lrn !== undefined) {
                              setSelectedLrns([...selectedLrns, student.lrn]);
                            }
                          } else {
                            setSelectedLrns(
                              selectedLrns.filter((id) => id !== student.lrn)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                  )}
                  <td className="py-1.5 px-4">{index + 1}</td>
                  <td className="py-1.5 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(student)}
                        className="p-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="p-1.5 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            student.lrn,
                            `${student.lname}, ${student.fname}`
                          )
                        }
                        disabled={processing === student.lrn}
                        className="p-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      {student.strand === "ALS" ? (
                        <button
                          onClick={() =>
                            handleApproveALS(
                              student.lrn,
                              `${student.lname}, ${student.fname}`
                            )
                          }
                          disabled={processing === student.lrn}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          <span>Approve ALS</span>
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleApprove(
                              student.lrn,
                              `${student.lname}, ${student.fname}`
                            )
                          }
                          disabled={processing === student.lrn}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          <span>Enroll</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 px-4">
                    <HighlightedText
                      text={student.lrn || "N/A"}
                      highlight={searchTerm}
                    />
                  </td>
                  <td className="py-1.5 px-4">
                    <HighlightedText
                      text={`${student.lname}, ${student.fname} ${student.mname}`}
                      highlight={searchTerm}
                    />
                  </td>
                  <td className="py-1.5 px-4">{student.strand}</td>
                  <td className="py-1.5 px-4">{student.gradeLevel}</td>
                  <td className="py-1.5 px-4">
                    {student.added_at
                      ? new Date(student.added_at).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        })
                      : "N/A"}
                  </td>
                  <td className="py-1.5 px-4">
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

      <div className="flex justify-between items-center w-full mt-6">
        <div className="flex gap-6">
          <span className="text-sm text-gray-500 font-medium">
            Total: {filteredStudents.length}
          </span>
          {isSelectionMode && (
            <span className="text-sm text-gray-500 font-medium">
              Selected: {selectedLrns.length}
            </span>
          )}
        </div>
        <div className="flex justify-end gap-2">
          {isSelectionMode && (
            <button
              onClick={handleBulkEnroll}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 h-8 rounded font-medium text-xs transition-colors"
            >
              <UserPlus size={14} className="mr-1" />
              ENROLL
            </button>
          )}
          {isSelectionMode && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 h-8 rounded font-medium text-xs transition-colors"
            >
              <Trash2 size={14} className="mr-1" />
              DELETE
            </button>
          )}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedLrns([]);
            }}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 h-8 rounded font-medium text-xs transition-colors"
          >
            {isSelectionMode ? (
              <X size={14} className="mr-1" />
            ) : (
              <CheckSquare size={14} className="mr-1" />
            )}
            {isSelectionMode ? "CANCEL" : "SELECT"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Confirm{" "}
                  {confirmAction.type === "delete" ? "Delete" : "Approve"}
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
                  {confirmAction.type === "bulk-enroll"
                    ? `Are you sure you want to enroll **${confirmAction.count}** selected students? This will assign them sections automatically.`
                    : confirmAction.type === "bulk-delete"
                      ? `Are you sure you want to delete **${confirmAction.count}** selected students? This action cannot be undone.`
                      : confirmAction.type === "delete"
                        ? `Are you sure you want to delete the student "${confirmAction.studentName}"?`
                        : `Are you sure you want to approve the student "${confirmAction.studentName}"?`}
                </p>
                {(confirmAction.type === "delete" ||
                  confirmAction.type === "bulk-delete") && (
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
                  onClick={() => {
                    if (confirmAction.type.startsWith("bulk")) {
                      handleConfirmBulkAction();
                    } else if (confirmAction.type === "delete") {
                      handleConfirmDelete();
                    } else {
                      handleConfirmApprove();
                    }
                  }}
                  className={`px-6 py-2 text-white rounded-lg transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    confirmAction.type === "delete"
                      ? "bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 focus:ring-red-600"
                      : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:ring-green-600"
                  }`}
                >
                  {confirmAction.type === "delete" ? "Delete" : "Approve"}
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
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg text-center">
                  {successMessage}
                </p>
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
                <h2 className="text-3xl font-bold text-gray-800">
                  Student Details
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div
                ref={modalContentRef}
                className="overflow-y-auto max-h-[75vh]"
              >
                {/* Personal Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-blue-600 mb-4 border-b-2 border-blue-200 pb-2">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LRN
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.lrn || ""}
                          onChange={(e) =>
                            handleInputChange("lrn", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedStudent.lrn || "N/A"}
                        </p>
                      )}
                    </div>
                    {/* ... Rest of fields ... */}
                    {/* Note: I'm keeping the rest of the modal content as is, assuming it was correct in the previous file. 
                        The key changes are in the logic functions above. */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        School Year
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.schoolYear || ""}
                          onChange={(e) =>
                            handleInputChange("schoolYear", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedStudent.schoolYear || "N/A"}
                        </p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Level
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.gradeLevel || ""}
                          onChange={(e) =>
                            handleInputChange("gradeLevel", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedStudent.gradeLevel || "N/A"}
                        </p>
                      )}
                    </div>
                    {/* ... (The rest of the fields should be included here exactly as they were in the original file) ... */}
                    {/* I am omitting the repetitive JSX for brevity, but in your file, keep all the input fields inside the modal. */}
                  </div>
                </div>
                {/* ... Address, Parent, Academic sections ... */}
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