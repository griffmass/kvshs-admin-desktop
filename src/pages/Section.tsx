import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Download,
  Edit,
  X,
  Pencil,
  CheckCircle,
  Users,
  GraduationCap,
  Microscope,
  Calculator,
  Heart,
  Monitor,
  GripVertical,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import type { DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSwappingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { useSortable } from "@dnd-kit/sortable";

interface Student {
  lrn: string;
  lname: string;
  fname: string;
  mname: string;
  sex: string;
  strand: string;
  gradeLevel: string;
  section: string;
}

interface Section {
  id: string;
  strand: string;
  year_level: number;
  section_name: string;
  max_capacity: number;
}

const STRANDS = ["STEM", "ABM", "HUMSS", "TVL-ICT"];
const GRADES = ["11", "12"];
const SECTION_CAPACITY = 45;

const STRAND_COLORS: Record<string, string> = {
  ABM: "bg-[#4BAA32] text-white",
  HUMSS: "bg-[#4B96D7] text-white",
  STEM: "bg-[#EFAA83] text-white",
  "TVL-ICT": "bg-[#FFBE00] text-white",
  GAS: "bg-[#a7d7a9] text-white",
};

const SECTION_TITLE_COLORS: Record<string, string> = {
  STEM: "text-[#EFAA83]",
  ABM: "text-[#4BAA32]",
  HUMSS: "text-[#4B96D7]",
  GAS: "text-[#a7d7a9]",
  "TVL-ICT": "text-[#FFBE00]",
  ALS: "text-[#A79B55]",
};

const TIME_SLOTS = [
  { time: "8:00 - 8:50", type: "class" },
  { time: "8:50 - 9:40", type: "class" },
  { time: "9:40 - 10:30", type: "class" },
  { time: "10:30 - 10:45", type: "break", title: "Break Time" },
  { time: "10:45 - 11:35", type: "class" },
  { time: "11:35 - 12:25", type: "class" },
  { time: "12:25 - 1:15", type: "break", title: "Lunch Break" },
  { time: "1:15 - 2:05", type: "class" },
  { time: "2:05 - 2:55", type: "class" },
  { time: "2:55 - 3:45", type: "class" },
];

type Schedule = Record<string, { time: string; subject: string | null }[]>;

type ScheduleItem = {
  id: string;
  day: string;
  timeSlot: string;
  subject: string;
  timeIndex: number;
};

type DraggableCellProps = {
  item: ScheduleItem;
  isDragging: boolean;
  isEditMode: boolean;
};

const DraggableCell: React.FC<DraggableCellProps> = ({
  item,
  isDragging,
  isEditMode,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    cursor: isEditMode && item.subject !== "---" ? "grab" : "default",
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`py-2 px-3 text-gray-700 ${item.subject === "---" ? "text-gray-400 italic" : "font-medium"} font-['Poppins'] text-sm transition-all duration-200 border border-gray-200`}
      {...attributes}
      data-id={`${item.day}::${item.timeSlot}`}
    >
      <div className="flex items-center gap-1">
        {isEditMode && item.subject !== "---" && (
          <button {...listeners} className="touch-none">
            <GripVertical size={12} className="text-gray-400" />
          </button>
        )}
        <span className="transition-colors duration-200 font-['Poppins'] text-sm">
          {item.subject}
        </span>
      </div>
    </div>
  );
};

export default function Section() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentCategory, setStudentCategory] = useState("Regular");
  const [activeGrade, setActiveGrade] = useState("11");
  const [activeStrand, setActiveStrand] = useState("STEM");
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // DnD Setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduce activation distance for quicker response
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const handleDragStart = (event: DragStartEvent) => {
    if (!isGlobalEditMode) return;
    if (!isGlobalEditMode) return;

    const { active } = event;
    const item = active.data.current as ScheduleItem | undefined;
    if (!item) return;
    setActiveItem(item);

    // Add visual feedback for the dragged item
    const draggedElement = document.querySelector(`[data-id="${active.id}"]`);
    if (draggedElement) {
      draggedElement.classList.add(
        "opacity-50",
        "bg-blue-100",
        "border-2",
        "border-blue-500"
      );
      // Add vertical drag indicator
      (draggedElement as HTMLElement).style.transform = "scale(1.02)";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isGlobalEditMode || !activeItem) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id.toString(); // Ensure string
    const overId = over.id.toString(); // Ensure string

    // CHANGE: Split by '::' instead of '-'
    const [activeDay, activeTimeSlot] = activeId.split("::");
    const [overDay, overTimeSlot] = overId.split("::");

    // Find the time indices
    const activeTimeIndex = TIME_SLOTS.findIndex(
      (slot) => slot.time === activeTimeSlot
    );
    const overTimeIndex = TIME_SLOTS.findIndex(
      (slot) => slot.time === overTimeSlot
    );

    // Debugging: Check if indices are found
    if (activeTimeIndex === -1 || overTimeIndex === -1) {
      console.error("Could not find time indices", {
        activeTimeSlot,
        overTimeSlot,
      });
      return;
    }

    // Create new schedule state
    const newSchedule = { ...schedule };

    // Initialize arrays if they don't exist (safety check)
    if (!newSchedule[activeDay]) newSchedule[activeDay] = [];
    if (!newSchedule[overDay]) newSchedule[overDay] = [];

    // Swap the subjects between the two cells
    const tempSubject = newSchedule[activeDay]?.[activeTimeIndex]?.subject;

    // Update Active Cell
    newSchedule[activeDay][activeTimeIndex] = {
      ...newSchedule[activeDay][activeTimeIndex],
      subject: newSchedule[overDay]?.[overTimeIndex]?.subject || "---",
      time: TIME_SLOTS[activeTimeIndex].time, // Ensure time is preserved
    };

    // Update Over Cell
    newSchedule[overDay][overTimeIndex] = {
      ...newSchedule[overDay][overTimeIndex],
      subject: tempSubject || "---",
      time: TIME_SLOTS[overTimeIndex].time, // Ensure time is preserved
    };

    setSchedule(newSchedule);
    setActiveItem(null);

    // Remove visual feedback
    const draggedElement = document.querySelector(`[data-id="${active.id}"]`);
    if (draggedElement) {
      draggedElement.classList.remove(
        "opacity-50",
        "bg-blue-100",
        "border-2",
        "border-blue-500"
      );
      (draggedElement as HTMLElement).style.transform = "";

      // Add success feedback for vertical drag
      if (activeDay === overDay) {
        // Same day = vertical drag
        draggedElement.classList.add("bg-green-100");
        setTimeout(() => {
          draggedElement.classList.remove("bg-green-100");
        }, 500);
      }
    }

    // Update in Supabase
    updateScheduleInSupabase(
      activeDay,
      activeTimeIndex,
      overDay,
      overTimeIndex
    );
  };

  const updateScheduleInSupabase = async (
    activeDay: string,
    activeTimeIndex: number,
    overDay: string,
    overTimeIndex: number
  ) => {
    if (!currentSection) return;

    try {
      const semester = activeSectionIdx % 2 === 0 ? "1st" : "2nd";

      // Get the current schedule data for these specific cells
      const { data: currentSchedules, error: fetchError } = await supabase
        .from("schedules")
        .select("*")
        .eq("section", currentSection.id)
        .eq("semester", semester)
        .in("day", [activeDay, overDay]);

      if (fetchError) throw fetchError;

      // Find the specific schedule entries
      const activeSchedule = currentSchedules.find(
        (s) =>
          s.day === activeDay &&
          s.time_slot === TIME_SLOTS[activeTimeIndex].time
      );
      const overSchedule = currentSchedules.find(
        (s) =>
          s.day === overDay && s.time_slot === TIME_SLOTS[overTimeIndex].time
      );

      if (activeSchedule && overSchedule) {
        // Swap the subject_ids
        const tempSubjectId = activeSchedule.subject_id;

        // Update both records
        const { error: updateError } = await supabase
          .from("schedules")
          .update({ subject_id: overSchedule.subject_id })
          .eq("id", activeSchedule.id);

        if (updateError) throw updateError;

        const { error: updateError2 } = await supabase
          .from("schedules")
          .update({ subject_id: tempSubjectId })
          .eq("id", overSchedule.id);

        if (updateError2) throw updateError2;

        console.log("Successfully updated schedule in Supabase");
      }
    } catch (error) {
      console.error("Error updating schedule in Supabase:", error);
      // Revert the local state if Supabase update fails
      // In a production app, you might want to show an error message to the user
    }
  };

  const getDraggableItems = () => {
    const items: ScheduleItem[] = [];

    activeDays.forEach((day) => {
      TIME_SLOTS.forEach((slot, timeIndex) => {
        if (schedule[day]?.[timeIndex]) {
          items.push({
            id: `${day}::${slot.time}`,
            day,
            timeSlot: slot.time,
            subject: schedule[day][timeIndex].subject || "---",
            timeIndex,
          });
        }
      });
    });

    return items;
  };

  const getBase64FromUrl = async (url: string): Promise<string> => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        resolve(base64data as string);
      };
    });
  };

  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sections")
        .select("id, strand, year_level, section_name, max_capacity")
        .eq("strand", activeStrand)
        .eq("year_level", parseInt(activeGrade));

      if (error) throw error;

      let sectionData = data || [];

      // If no sections exist for this strand/grade, create them automatically
      if (!sectionData || sectionData.length === 0) {
        const newSections = [];
        const sectionNames = ["A", "B", "C", "D"]; // Create up to 4 sections initially

        for (const sectionName of sectionNames) {
          const { data: insertedSection, error: insertError } = await supabase
            .from("sections")
            .insert({
              strand: activeStrand,
              year_level: parseInt(activeGrade),
              section_name: sectionName,
              max_capacity: SECTION_CAPACITY,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating section:", insertError);
          } else if (insertedSection) {
            newSections.push(insertedSection);
          }
        }

        sectionData = newSections;
      }

      setSections(sectionData);
      if (sectionData.length > 0 && activeSectionIdx >= sectionData.length) {
        setActiveSectionIdx(0);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
    }
  }, [activeStrand, activeGrade, activeSectionIdx]);

  const currentSection = sections[activeSectionIdx];

  // Function to clean up existing schedules with more than 4 days
  const cleanupSchedulesWith5Days = useCallback(
    async (sectionId: string, semester: string) => {
      try {
        // First, check if there are any schedules with 5 days for this section
        const { data: existingSchedules, error: fetchError } = await supabase
          .from("schedules")
          .select("day")
          .eq("section", sectionId)
          .eq("semester", semester);

        if (fetchError) throw fetchError;

        // Get unique days for this section
        const uniqueDays = existingSchedules
          ? [...new Set(existingSchedules.map((item) => item.day))]
          : [];

        // If we have exactly 4 days, no cleanup needed
        if (uniqueDays.length === 4) {
          return false; // No cleanup needed
        }

        // If we have 5 days, we need to clean up
        if (uniqueDays.length === 5) {
          console.log(
            `Found schedule with 5 days for section ${sectionId}, cleaning up...`
          );

          // Delete all existing schedules for this section/semester
          const { error: deleteError } = await supabase
            .from("schedules")
            .delete()
            .eq("section", sectionId)
            .eq("semester", semester);

          if (deleteError) throw deleteError;

          return true; // Cleanup performed
        }

        return false;
      } catch (error) {
        console.error("Error cleaning up schedules:", error);
        return false;
      }
    },
    []
  );

  const generateScheduleForSection = useCallback(
    async (sectionId: string, semester: string) => {
      try {
        // Note: Cleanup is handled by the caller, so we don't need to call it here
        // to avoid double cleanup and potential issues

        // Fetch subjects for this section's strand and grade
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;

        const { data: subjects, error } = await supabase
          .from("subjects")
          .select("id, subject_code, classification")
          .eq("strand", section.strand)
          .eq("grade_level", section.year_level.toString())
          .eq("semester", semester);

        if (error) throw error;

        // Create subject pool based on classification
        const subjectPool: string[] = [];
        subjects.forEach((subject) => {
          let count = 0;
          if (subject.classification?.includes("Specialized")) {
            count = 8;
          } else if (
            subject.classification?.includes("Core") ||
            subject.classification?.includes("Applied")
          ) {
            count = 4;
          }
          for (let i = 0; i < count; i++) {
            subjectPool.push(subject.id);
          }
        });

        // Shuffle the subject pool
        for (let i = subjectPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [subjectPool[i], subjectPool[j]] = [subjectPool[j], subjectPool[i]];
        }

        // Select one of the 4 possible day combinations (strictly 4 days only)
        const dayCombinations = [
          ["Tuesday", "Wednesday", "Thursday", "Friday"], // Tue, Wed, Thu, Fri (4 days)
          ["Monday", "Wednesday", "Thursday", "Friday"], // Mon, Wed, Thu, Fri (4 days)
          ["Monday", "Tuesday", "Thursday", "Friday"], // Mon, Tue, Thu, Fri (4 days)
          ["Monday", "Tuesday", "Wednesday", "Thursday"], // Mon, Tue, Wed, Thu (4 days)
        ];

        // Ensure we always select exactly 4 days
        let selectedDays =
          dayCombinations[Math.floor(Math.random() * dayCombinations.length)];

        // Validate that we have exactly 4 days - this should never fail but we check anyway
        if (selectedDays.length !== 4) {
          console.error(
            "CRITICAL: Invalid day combination: expected 4 days, got",
            selectedDays.length,
            "Falling back to default combination"
          );
          // Fallback to default 4-day combination
          selectedDays = ["Monday", "Tuesday", "Wednesday", "Thursday"];
        }

        // Double-check that we have exactly 4 unique days
        const uniqueSelectedDays = [...new Set(selectedDays)];
        if (uniqueSelectedDays.length !== 4) {
          console.error(
            "CRITICAL: Duplicate days found in selection, falling back to default"
          );
          selectedDays = ["Monday", "Tuesday", "Wednesday", "Thursday"];
        }

        console.log(
          `Generating schedule with ${selectedDays.length} days: ${selectedDays.join(", ")}`
        );

        // Create schedule entries
        const scheduleEntries: {
          section: string;
          subject_id: string;
          day: string;
          time_slot: string;
          semester: string;
        }[] = [];
        let subjectIndex = 0;

        selectedDays.forEach((day) => {
          TIME_SLOTS.forEach((slot) => {
            if (slot.type === "class" && subjectIndex < subjectPool.length) {
              scheduleEntries.push({
                section: sectionId,
                subject_id: subjectPool[subjectIndex],
                day,
                time_slot: slot.time,
                semester,
              });
              subjectIndex++;
            }
          });
        });

        // Insert into schedules table
        const { error: insertError } = await supabase
          .from("schedules")
          .insert(scheduleEntries);

        if (insertError) throw insertError;

        // Final verification: check that we actually created schedules with exactly 4 unique days
        const generatedDays = [
          ...new Set(scheduleEntries.map((entry) => entry.day)),
        ];
        if (generatedDays.length !== 4) {
          console.error(
            `CRITICAL: Generated schedules have ${generatedDays.length} days instead of 4:`,
            generatedDays
          );
          // This should never happen, but if it does, we need to handle it
          throw new Error(
            `Schedule generation failed: expected 4 days, got ${generatedDays.length}`
          );
        }

        console.log(
          `Successfully generated schedule with 4 days: ${generatedDays.join(", ")}`
        );

        // Return the generated data for immediate use
        return scheduleEntries;
      } catch (error) {
        console.error("Error generating schedule:", error);
      }
    },
    [sections]
  );

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    if (studentCategory === "ALS" && activeStrand === "STEM") {
      setActiveStrand("ABM");
    }
  }, [studentCategory, activeStrand]);

  // Comprehensive cleanup effect that runs once when component mounts
  useEffect(() => {
    const runComprehensiveCleanup = async () => {
      try {
        console.log(
          "Running comprehensive schedule cleanup on component mount..."
        );

        // Get all sections that might have problematic schedules
        const { data: allSections, error: sectionsError } = await supabase
          .from("sections")
          .select("id, strand, year_level, section_name");

        if (sectionsError) throw sectionsError;

        // Check each section for both semesters
        for (const section of allSections || []) {
          const sectionIdentifier = `G${section.year_level} ${section.strand} => ${section.section_name}`;
          console.log(
            `Checking section: ${sectionIdentifier} (ID: ${section.id})`
          );

          for (const semester of ["1st", "2nd"]) {
            const { data: schedules, error: fetchError } = await supabase
              .from("schedules")
              .select("day")
              .eq("section", section.id)
              .eq("semester", semester);

            if (fetchError) {
              console.warn(
                `Failed to fetch schedules for ${sectionIdentifier} ${semester}:`,
                fetchError
              );
              continue;
            }

            const uniqueDays = schedules
              ? [...new Set(schedules.map((item) => item.day))]
              : [];

            console.log(
              `Section ${sectionIdentifier} ${semester}: ${uniqueDays.length} unique days - ${uniqueDays.join(", ")}`
            );

            if (uniqueDays.length === 5) {
              console.log(
                `Found section ${sectionIdentifier} with 5 days for ${semester}: ${uniqueDays.join(", ")} - CLEANING UP`
              );
              await cleanupSchedulesWith5Days(section.id, semester);
              await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay between cleanups

              // Verify cleanup was successful
              const { data: verifiedSchedules } = await supabase
                .from("schedules")
                .select("day")
                .eq("section", section.id)
                .eq("semester", semester);

              const verifiedDays = verifiedSchedules
                ? [...new Set(verifiedSchedules.map((item) => item.day))]
                : [];

              console.log(
                `After cleanup - ${sectionIdentifier} ${semester}: ${verifiedDays.length} days - ${verifiedDays.join(", ")}`
              );
            }
          }
        }

        console.log("Comprehensive cleanup completed");
      } catch (error) {
        console.error("Error during comprehensive cleanup:", error);
      }
    };

    // Run cleanup when component mounts
    runComprehensiveCleanup();
  }, [cleanupSchedulesWith5Days]); // Add cleanupSchedulesWith5Days to dependencies

  // Function to manually trigger cleanup for specific sections
  const triggerManualCleanup = useCallback(async () => {
    try {
      console.log("Triggering manual cleanup for problematic sections...");

      // Get all sections to find the problematic ones
      const { data: allSections, error: sectionsError } = await supabase
        .from("sections")
        .select("id, strand, year_level, section_name");

      if (sectionsError) throw sectionsError;

      // Look for the specific problematic section: G12 TVL-ICT => C
      const problematicSection = allSections.find(
        (section) =>
          section.year_level === 12 &&
          section.strand === "TVL-ICT" &&
          section.section_name === "C"
      );

      if (problematicSection) {
        console.log(
          `Found problematic section: G${problematicSection.year_level} ${problematicSection.strand} => ${problematicSection.section_name}`
        );

        // Check and clean both semesters
        for (const semester of ["1st", "2nd"]) {
          console.log(`Checking ${semester} semester for cleanup...`);

          // First check if it has 5 days
          const { data: schedules, error: fetchError } = await supabase
            .from("schedules")
            .select("day")
            .eq("section", problematicSection.id)
            .eq("semester", semester);

          if (fetchError) {
            console.warn(`Failed to fetch schedules for cleanup:`, fetchError);
            continue;
          }

          const uniqueDays = schedules
            ? [...new Set(schedules.map((item) => item.day))]
            : [];

          console.log(
            `Current state: ${uniqueDays.length} days - ${uniqueDays.join(", ")}`
          );

          if (uniqueDays.length === 5) {
            console.log(
              `Cleaning up 5-day schedule for ${semester} semester...`
            );
            await cleanupSchedulesWith5Days(problematicSection.id, semester);

            // Verify cleanup
            const { data: verifiedSchedules } = await supabase
              .from("schedules")
              .select("day")
              .eq("section", problematicSection.id)
              .eq("semester", semester);

            const verifiedDays = verifiedSchedules
              ? [...new Set(verifiedSchedules.map((item) => item.day))]
              : [];

            console.log(
              `After cleanup: ${verifiedDays.length} days - ${verifiedDays.join(", ")}`
            );

            if (verifiedDays.length !== 4) {
              console.error(
                `Cleanup failed for ${semester} semester - still has ${verifiedDays.length} days`
              );
            } else {
              console.log(
                `Successfully cleaned ${semester} semester - now has 4 days`
              );
            }
          } else {
            console.log(
              `No cleanup needed for ${semester} semester - already has ${uniqueDays.length} days`
            );
          }
        }
      } else {
        console.log("Problematic section G12 TVL-ICT => C not found");
      }

      // Also trigger a schedule regeneration for the current section if it's the problematic one
      if (
        currentSection &&
        currentSection.year_level === 12 &&
        currentSection.strand === "TVL-ICT" &&
        currentSection.section_name === "C"
      ) {
        console.log("Regenerating schedule for current problematic section...");
        const semester = activeSectionIdx % 2 === 0 ? "1st" : "2nd";
        await generateScheduleForSection(currentSection.id, semester);
      }
    } catch (error) {
      console.error("Error during manual cleanup:", error);
    }
  }, [cleanupSchedulesWith5Days, currentSection, activeSectionIdx, generateScheduleForSection]);

  // Auto-trigger manual cleanup on component mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      triggerManualCleanup();
    }, 5000); // Wait 5 seconds after component mount to ensure everything is loaded

    return () => clearTimeout(timeoutId);
  }, [triggerManualCleanup]);

  // Effect for fetching schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!currentSection) {
        setSchedule({});
        setScheduleLoading(false);
        return;
      }

      setScheduleLoading(true);
      try {
        const semester = activeSectionIdx % 2 === 0 ? "1st" : "2nd";

        // Step 1: Fetch existing schedule data
        const { data: initialScheduleData, error: fetchError } = await supabase
          .from("schedules")
          .select(
            `
            day,
            time_slot,
            subjects (subject_code)
          `
          )
          .eq("section", currentSection.id)
          .eq("semester", semester);

        if (fetchError) throw fetchError;

        // Ensure scheduleData is an array
        let scheduleData = initialScheduleData || [];

        const existingDays = [...new Set(scheduleData.map((item) => item.day))];

        // Step 2: Check if cleanup (5 days) or generation (0 days) is needed
        if (existingDays.length === 5 || existingDays.length === 0) {
          if (existingDays.length === 5) {
            console.log(
              `Found schedule with 5 days for section ${currentSection.id}. Cleaning and regenerating.`
            );
          } else {
            console.log(
              `No schedule found for section ${currentSection.id}. Generating new one.`
            );
          }

          // Perform cleanup if necessary
          await cleanupSchedulesWith5Days(currentSection.id, semester);

          // Generate a new schedule
          await generateScheduleForSection(currentSection.id, semester);

          // Re-fetch the data after generation
          const { data: newData, error: newError } = await supabase
            .from("schedules")
            .select(
              `
              day,
              time_slot,
              subjects (subject_code)
            `
            )
            .eq("section", currentSection.id)
            .eq("semester", semester);

          if (newError) throw newError;
          scheduleData = newData || []; // Update scheduleData with the newly fetched data
        }

        // Get active days for this section with proper null/undefined checks
        const sectionActiveDays = [
          ...new Set(scheduleData.map((item) => item.day)),
        ];
        setActiveDays(sectionActiveDays);

        // Transform data into schedule format
        const transformedSchedule: Schedule = {};
        sectionActiveDays.forEach((day) => (transformedSchedule[day] = []));

        scheduleData.forEach((item) => {
          const timeIndex = TIME_SLOTS.findIndex(
            (slot) => slot.time === item.time_slot
          );
          if (timeIndex !== -1 && item.subjects) {
            // Add check for item.subjects
            transformedSchedule[item.day][timeIndex] = {
              time: item.time_slot,
              subject: Array.isArray(item.subjects) && item.subjects.length > 0 ? item.subjects[0].subject_code : "---",
            };
          }
        });

        // Fill empty slots with breaks or ---
        sectionActiveDays.forEach((day) => {
          TIME_SLOTS.forEach((slot, index) => {
            if (!transformedSchedule[day][index]) {
              transformedSchedule[day][index] = {
                time: slot.time,
                subject: slot.type === "break" ? slot.title || "Break" : "---",
              };
            }
          });
        });

        setSchedule(transformedSchedule);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setSchedule({});
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedules();
  }, [activeStrand, activeGrade, activeSectionIdx, currentSection, generateScheduleForSection, cleanupSchedulesWith5Days]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("NewStudents")
        .select("lrn, lname, fname, mname, sex, strand, gradeLevel, section")
        .eq("enrollment_status", "Enrolled")
        .order("lname", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentSectionStudents = currentSection
    ? students.filter(
        (s) =>
          s.gradeLevel === activeGrade &&
          s.strand === activeStrand &&
          s.section === currentSection.section_name
      )
    : [];
  const males = currentSectionStudents.filter(
    (student) => student.sex === "Male"
  );
  const females = currentSectionStudents.filter(
    (student) => student.sex === "Female"
  );

  const handleGradeChange = (grade: string) => {
    setActiveGrade(grade);
    setActiveSectionIdx(0);
  };

  const handleStrandChange = (strand: string) => {
    setActiveStrand(strand);
    setActiveSectionIdx(0);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent({ ...student });
    setOriginalStudent({ ...student });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const { error } = await supabase
        .from("NewStudents")
        .update({
          lname: editingStudent.lname,
          fname: editingStudent.fname,
          mname: editingStudent.mname,
          sex: editingStudent.sex,
        })
        .eq("lrn", editingStudent.lrn);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) => (s.lrn === editingStudent.lrn ? editingStudent : s))
      );
      setShowEditModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student");
    }
  };

  const handleGeneratePDF = async () => {
    const element = printRef.current;
    if (!element) {
      console.error("Print element not found");
      return;
    }

    // Create Gradient Helper
    const gradientCanvas = document.createElement("canvas");
    gradientCanvas.width = 595; // Approx A4 width in px at 72dpi
    gradientCanvas.height = 842; // Approx A4 height
    const ctx = gradientCanvas.getContext("2d");
    if (ctx) {
      // Create Linear Gradient (Light Blue #E0F2FE to White #FFFFFF)
      const gradient = ctx.createLinearGradient(0, 0, 0, gradientCanvas.height);
      gradient.addColorStop(0, "#E0F2FE");
      gradient.addColorStop(1, "#FFFFFF");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
    }
    const gradientData = gradientCanvas.toDataURL("image/jpeg");

    // 1. Expand Scrollable Areas to capture full list
    const scrollableContainers = element.querySelectorAll(".overflow-y-auto");
    const originalStyles = Array.from(scrollableContainers).map(
      (container) => ({
        height: (container as HTMLElement).style.height,
        overflow: (container as HTMLElement).style.overflow,
      })
    );

    scrollableContainers.forEach((container) => {
      (container as HTMLElement).style.height = "auto";
      (container as HTMLElement).style.overflow = "visible";
    });

    // Override backgrounds for print
    const maleContainer = document.getElementById("male-container");
    const femaleContainer = document.getElementById("female-container");

    let originalMaleBg = "";
    let originalFemaleBg = "";

    if (maleContainer) {
      originalMaleBg = maleContainer.style.backgroundColor;
      maleContainer.style.backgroundColor = "#DBEAFF";
    }
    if (femaleContainer) {
      originalFemaleBg = femaleContainer.style.backgroundColor;
      femaleContainer.style.backgroundColor = "rgba(187, 92, 192, 0.4)";
    }

    // Handle bg-white conflict
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = "transparent";

    try {
      // 2. Load Header Image
      // Note: Ensure header.png is in your public/assets folder
      const headerUrl = "/assets/header.png";
      let headerBase64: string | null = null;

      try {
        headerBase64 = await getBase64FromUrl(headerUrl);
      } catch (error) {
        console.warn("Could not load header image:", error);
      }

      // 3. Capture Content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const contentData = canvas.toDataURL("image/png");

      // 4. PDF Setup
      const pdfWidth = 200; // A4 width in mm
      const pdfHeight = 280; // Increased height to prevent content cutting
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });
      const sideMargin = 12.7; // 0.5 inch
      const contentWidth = pdfWidth - sideMargin * 2;

      // Add the gradient image first (so it sits at the very back)
      pdf.addImage(gradientData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      let currentY = 0;

      // 5. Add Header (Full Width, No Margin)
      if (headerBase64) {
        const imgProps = pdf.getImageProperties(headerBase64);
        const headerHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(headerBase64, "PNG", 0, 0, pdfWidth, headerHeight);
        currentY = headerHeight + 15; // Add space below header
      } else {
        currentY = sideMargin; // Fallback if no header
      }

      // 6. Add Content (With Margins)
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      // Optional: Reduce height scaling by 35% if explicitly requested,
      // though maintaining aspect ratio is usually preferred.
      // To strictly fit aspect ratio:
      pdf.addImage(
        contentData,
        "PNG",
        sideMargin,
        currentY,
        contentWidth,
        contentHeight
      );

      const formattedStrand =
        activeStrand.charAt(0).toUpperCase() +
        activeStrand.slice(1).toLowerCase();
      const sectionName = currentSection
        ? currentSection.section_name
        : String.fromCharCode(65 + activeSectionIdx);
      pdf.save(
        `Masterlist_${activeGrade}-${formattedStrand}_${sectionName}.pdf`
      );
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF");
    } finally {
      // 7. Restore Styles
      scrollableContainers.forEach((container, index) => {
        (container as HTMLElement).style.height = originalStyles[index].height;
        (container as HTMLElement).style.overflow =
          originalStyles[index].overflow;
      });
      // Restore backgrounds
      if (maleContainer) maleContainer.style.backgroundColor = originalMaleBg;
      if (femaleContainer)
        femaleContainer.style.backgroundColor = originalFemaleBg;
      // Restore background color
      element.style.backgroundColor = originalBg;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex-shrink-0 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-bold text-gray-800">Student Records</h1>
          {/* Right Side: Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleGeneratePDF}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span>Export to PDF</span>
            </button>
            <button
              onClick={async () => {
                if (currentSection) {
                  setShowRegenerateConfirm(true);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              <Pencil size={16} />
              <span>Regenerate Schedule</span>
            </button>
            <button
              onClick={() => setIsGlobalEditMode(!isGlobalEditMode)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              {isGlobalEditMode ? <X size={16} /> : <Edit size={16} />}
              <span>{isGlobalEditMode ? "Cancel" : "Edit"}</span>
            </button>
          </div>
        </div>
        {/* Left Side: Category Tabs, Grade Tabs, Strand Pills, Section Buttons */}
        <div className="flex items-center space-x-4">
          {/* Category Tabs */}
          <div className="flex space-x-2">
            {["Regular", "ALS"].map((category) => {
              const Icon = category === "Regular" ? Users : GraduationCap;
              return (
                <button
                  key={category}
                  onClick={() => setStudentCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors h-10 flex items-center space-x-2 ${
                    studentCategory === category
                      ? category === "Regular"
                        ? "bg-blue-500 text-white"
                        : "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <Icon size={16} />
                  <span>{category}</span>
                </button>
              );
            })}
          </div>

          {/* Grade Tabs */}
          <div className="flex space-x-8">
            {GRADES.map((grade) => (
              <button
                key={grade}
                onClick={() => handleGradeChange(grade)}
                className={`px-4 py-2 font-medium transition-colors relative flex items-center space-x-2 ${
                  activeGrade === grade
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <GraduationCap size={16} />
                <span>Grade {grade}</span>
              </button>
            ))}
          </div>

          {/* Strand Pills */}
          <div className="flex space-x-2">
            {STRANDS.filter(
              (strand) => studentCategory === "Regular" || strand !== "STEM"
            ).map((strand) => {
              const iconMap: Record<string, typeof Users> = {
                STEM: Microscope,
                ABM: Calculator,
                HUMSS: Heart,
                "TVL-ICT": Monitor,
              };
              const Icon = iconMap[strand] || Users;
              return (
                <button
                  key={strand}
                  onClick={() => handleStrandChange(strand)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors h-10 flex items-center space-x-2 ${
                    activeStrand === strand
                      ? STRAND_COLORS[strand] || "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <Icon size={16} />
                  <span>{strand}</span>
                </button>
              );
            })}
          </div>

          {/* Section Buttons */}
          <div className="flex space-x-2">
            {sections.map((section, i) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionIdx(i)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeSectionIdx === i
                    ? STRAND_COLORS[activeStrand] || "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {section.section_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area - Grows to fill remaining height */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="bg-white shadow-lg rounded-xl p-4 h-full flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Student List - 2 columns (Left Side) */}
            <div
              ref={printRef}
              className="lg:col-span-2 flex flex-col h-full bg-white"
            >
              <h2
                className={`text-xl font-bold mb-10 flex-shrink-0 text-center ${
                  SECTION_TITLE_COLORS[activeStrand] || "text-gray-800"
                }`}
              >
                {currentSection
                  ? `${activeGrade}-${activeStrand} ${currentSection.section_name}`
                  : "No Section"}
              </h2>

              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                {" "}
                {/* min-h-0 is crucial for nested flex scrolling */}
                {/* Males */}
                <div className="flex flex-col h-full overflow-hidden">
                  <h3 className="text-lg font-bold mb-6 text-blue-700 flex-shrink-0 text-center">
                    MALE
                  </h3>
                  <div
                    id="male-container"
                    className="h-90 overflow-y-auto border rounded-lg p-4 bg-[#F9FAFC]"
                  >
                    {males.length === 0 ? (
                      <p className="text-gray-500">No male students</p>
                    ) : (
                      males.map((student, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center mb-1 hover:bg-blue-100"
                        >
                          <span className="text-sm text-gray-700">
                            <span className="font-semibold mr-2 text-gray-700">
                              {index + 1}.
                            </span>
                            {student.lname}, {student.fname}, {student.mname}
                          </span>
                          {isGlobalEditMode && (
                            <button
                              onClick={() => handleEditClick(student)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Pencil size={12} className="text-green-600" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Females */}
                <div className="flex flex-col h-full overflow-hidden">
                  <h3 className="text-lg font-bold mb-6 text-pink-600 flex-shrink-0 text-center">
                    FEMALE
                  </h3>{" "}
                  {/* Changed to pink for distinction based on common UI patterns */}
                  <div
                    id="female-container"
                    className="h-90 overflow-y-auto border rounded-lg p-4 bg-[#F9FAFC]"
                  >
                    {females.length === 0 ? (
                      <p className="text-gray-500">No female students</p>
                    ) : (
                      females.map((student, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center mb-1 hover:bg-purple-100"
                        >
                          <span className="text-sm text-gray-700">
                            <span className="font-semibold mr-2 text-gray-700">
                              {index + 1}.
                            </span>
                            {student.lname}, {student.fname}, {student.mname}
                          </span>
                          {isGlobalEditMode && (
                            <button
                              onClick={() => handleEditClick(student)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Pencil size={12} className="text-green-600" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & Schedule - 3 columns (Right Side) */}
            <div className="lg:col-span-3 flex flex-col space-y-2 overflow-y-auto">
              {" "}
              {/* Allow right side to scroll if content is tall */}
              {/* Statistics */}
              <div className="border-l-2 border-gray-200 pl-4">
                <h3 className="text-lg font-bold mb-2">Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">MALE:</span>
                    <span>{males.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">FEMALE:</span>
                    <span>{females.length}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">TOTAL:</span>
                    <span>
                      {currentSectionStudents.length} / {SECTION_CAPACITY}
                    </span>
                  </div>
                </div>
              </div>
              {/* Class Schedule */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-3 text-gray-800">
                  Class Schedule
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToParentElement]}
                  >
                    <SortableContext
                      items={getDraggableItems()}
                      strategy={rectSwappingStrategy}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `auto repeat(${Math.max(1, activeDays.length)}, 1fr)`,
                        }}
                        className="auto-rows-auto border-collapse"
                      >
                        {/* Time Column Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 py-3 px-3 font-semibold text-gray-700 rounded-tl-xl font-['Poppins'] text-sm">
                          Time
                        </div>

                        {/* Day Headers */}
                        {activeDays.map((day, index) => (
                          <div
                            key={day}
                            className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 py-3 px-3 font-semibold text-gray-700 font-['Poppins'] text-sm ${
                              index === activeDays.length - 1
                                ? "rounded-tr-xl"
                                : ""
                            }`}
                          >
                            {day.slice(0, 3)}
                          </div>
                        ))}

                        {/* Schedule Content - Flattened Grid Structure */}
                        {scheduleLoading ? (
                          <div className="col-span-full text-center py-8 text-gray-500 rounded-b-xl">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                              <span>Generating schedule...</span>
                            </div>
                          </div>
                        ) : (
                          TIME_SLOTS.map((slot, timeIndex) => [
                            // Time Column Cell
                            <div
                              key={`${slot.time}-time`}
                              className={`border-b border-gray-100 last:border-0 py-2 px-3 font-medium text-gray-800 whitespace-nowrap font-['Poppins'] text-sm ${
                                slot.type === "break"
                                  ? "bg-gradient-to-r from-orange-50 to-yellow-50"
                                  : timeIndex % 2 === 0
                                    ? "bg-white"
                                    : "bg-gray-25"
                              }`}
                            >
                              {slot.time}
                            </div>,

                            // Subject Cells for each day
                            ...activeDays.map((day) => {
                              const itemId = `${day}::${slot.time}`;
                              const subject =
                                schedule[day]?.[timeIndex]?.subject || "---";

                              if (subject === "---" || slot.type === "break") {
                                return (
                                  <div
                                    key={itemId}
                                    className={`py-2 px-3 text-gray-700 border border-gray-200 ${
                                      subject === "---"
                                        ? "text-gray-400 italic"
                                        : "font-medium"
                                    } ${
                                      slot.type === "break"
                                        ? "bg-gradient-to-r from-orange-50 to-yellow-50"
                                        : timeIndex % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-25"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 font-['Poppins'] text-sm">
                                      {subject}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <DraggableCell
                                  key={itemId}
                                  item={{
                                    id: `${day}::${slot.time}`,
                                    day,
                                    timeSlot: slot.time,
                                    subject,
                                    timeIndex,
                                  }}
                                  isDragging={activeItem?.id === itemId}
                                  isEditMode={isGlobalEditMode}
                                />
                              );
                            }),
                          ])
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Student</h2>
            {(() => {
              const hasChanges =
                JSON.stringify(editingStudent) !==
                JSON.stringify(originalStudent);
              return (
                <form onSubmit={handleUpdateStudent}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      LRN
                    </label>
                    <input
                      type="text"
                      value={editingStudent.lrn}
                      disabled
                      className="w-full px-3 py-2 border rounded bg-gray-100"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.lname}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          lname: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.fname}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          fname: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.mname}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          mname: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Sex
                    </label>
                    <select
                      value={editingStudent.sex}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          sex: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded"
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!hasChanges}
                      className={`px-4 py-2 text-white rounded transition-colors ${
                        hasChanges
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col items-center text-center shadow-xl transform transition-all scale-100">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Pencil className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Regenerate Schedule?
            </h2>
            <p className="text-gray-600 mb-6">
              This will randomly reroll the class schedules while maintaining
              the 4 sessions/week for both Applied and Core subjects, and 8
              sessions/week for specialized subjects.
            </p>
            <div className="flex space-x-2 w-full">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowRegenerateConfirm(false);
                  if (currentSection) {
                    const semester = activeSectionIdx % 2 === 0 ? "1st" : "2nd";
                    console.log(
                      `Regenerating schedule for ${activeGrade}-${activeStrand} ${currentSection.section_name} (${semester})`
                    );
                    await cleanupSchedulesWith5Days(
                      currentSection.id,
                      semester
                    );
                    await generateScheduleForSection(
                      currentSection.id,
                      semester
                    );
                    // Refresh the schedule
                    const fetchSchedules = async () => {
                      setScheduleLoading(true);
                      try {
                        const { data: newData, error: newError } =
                          await supabase
                            .from("schedules")
                            .select(
                              `
                            day,
                            time_slot,
                            subjects (subject_code)
                          `
                            )
                            .eq("section", currentSection.id)
                            .eq("semester", semester);

                        if (newError) throw newError;

                        const sectionActiveDays = [
                          ...new Set(newData.map((item) => item.day)),
                        ];
                        setActiveDays(sectionActiveDays);

                        const transformedSchedule: Schedule = {};
                        sectionActiveDays.forEach(
                          (day) => (transformedSchedule[day] = [])
                        );

                        newData.forEach((item) => {
                          const timeIndex = TIME_SLOTS.findIndex(
                            (slot) => slot.time === item.time_slot
                          );
                          if (timeIndex !== -1 && item.subjects) {
                            transformedSchedule[item.day][timeIndex] = {
                              time: item.time_slot,
                              subject: Array.isArray(item.subjects) && item.subjects.length > 0 ? item.subjects[0].subject_code : "---",
                            };
                          }
                        });

                        sectionActiveDays.forEach((day) => {
                          TIME_SLOTS.forEach((slot, index) => {
                            if (!transformedSchedule[day][index]) {
                              transformedSchedule[day][index] = {
                                time: slot.time,
                                subject:
                                  slot.type === "break"
                                    ? slot.title || "Break"
                                    : "---",
                              };
                            }
                          });
                        });

                        setSchedule(transformedSchedule);
                      } catch (error) {
                        console.error("Error refreshing schedules:", error);
                      } finally {
                        setScheduleLoading(false);
                      }
                    };

                    fetchSchedules();
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col items-center text-center shadow-xl transform transition-all scale-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
            <p className="text-gray-600 mb-6">
              Student information has been updated successfully.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 shadow-md"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
