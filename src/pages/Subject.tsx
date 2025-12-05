import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Download,
  Edit,
  Users,
  GraduationCap,
  Microscope,
  Calculator,
  Heart,
  Monitor,
} from "lucide-react";

const STRANDS = ["STEM", "ABM", "HUMSS", "TVL-ICT"];
const GRADES = ["11", "12"];

const STRAND_COLORS: Record<string, string> = {
  ABM: "bg-[#4BAA32] text-white",
  HUMSS: "bg-[#4B96D7] text-white",
  STEM: "bg-[#EFAA83] text-white",
  "TVL-ICT": "bg-[#FFBE00] text-white",
  GAS: "bg-[#a7d7a9] text-white",
};

const STRAND_FULL_NAMES: Record<string, string> = {
  ABM: "Accountancy, Business and Mathematics (ABM)",
  HUMSS: "Humanities and Social Sciences (HUMSS)",
  STEM: "Science, Technology, Engineering and Mathematics (STEM)",
  "TVL-ICT":
    "Technical-Vocational-Livelihood Information and Communications Technology (TVL-ICT)",
  GAS: "General Academic Strand (GAS)",
};

const STRAND_BANNER_COLORS: Record<string, string> = {
  ABM: "#4BAA32",
  HUMSS: "#4B96D7",
  STEM: "#EFAA83",
  "TVL-ICT": "#FFBE00",
  GAS: "#a7d7a9", // default
};

export default function Subject() {
  const [studentCategory, setStudentCategory] = useState("Regular");
  const [activeGrade, setActiveGrade] = useState("11");
  const [activeStrand, setActiveStrand] = useState("STEM");
  const [activeSemester, setActiveSemester] = useState("1st");
  const [subjects, setSubjects] = useState<
    { title: string; code: string; classification: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("subject_title, subject_code, classification")
          .eq("strand", activeStrand)
          .eq("grade_level", activeGrade)
          .eq("semester", activeSemester);

        if (error) {
          throw error;
        }

        // Map Supabase columns to the component's expected prop names
        const formattedSubjects = data.map((subject) => ({
          title: subject.subject_title,
          code: subject.subject_code,
          classification: subject.classification,
        }));

        setSubjects(formattedSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjects([]); // Clear subjects on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [activeStrand, activeGrade, activeSemester]);

  return (
    <div className="w-full bg-gray-50 h-full flex flex-col">
      <div className="bg-white p-4 shadow-sm flex-shrink-0 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-bold text-gray-800">Subject Records</h1>
          {/* Right Side: Buttons */}
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              <Download size={16} />
              <span>Export to PDF</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
              <Edit size={16} />
              <span>Edit</span>
            </button>
          </div>
        </div>
        {/* Filters: Category, Grade, Strand, Semester */}
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
                onClick={() => setActiveGrade(grade)}
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
                  onClick={() => setActiveStrand(strand)}
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

          {/* Semester Buttons */}
          <div className="flex space-x-2">
            {["1st", "2nd"].map((sem) => (
              <button
                key={sem}
                onClick={() => setActiveSemester(sem)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors h-10 flex items-center space-x-2 ${
                  activeSemester === sem
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {sem} Sem
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="bg-white shadow-lg rounded-xl p-6 h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-4">
              <img
                src="/assets/kvshs_logo.png"
                alt="KVSHS Logo"
                className="h-16 object-contain"
              />
              <div>
                <h1
                  className="text-2xl font-bold tracking-wide uppercase mb-2 text-gray-800"
                  style={{ fontFamily: "Poppins" }}
                >
                  KASIGLAHAN VILLAGE SENIOR HIGH SCHOOL
                </h1>
                <h2
                  className="text-xl font-semibold uppercase text-gray-800"
                  style={{ fontFamily: "Poppins" }}
                >
                  SENIOR HIGH SCHOOL CURRICULUM SUBJECT CHECKLIST
                </h2>
              </div>
              <img
                src="/assets/deped_logo.png"
                alt="DepEd Logo"
                className="h-16 object-contain"
              />
            </div>
          </div>

          {/* Strand Banner */}
          <div
            className="text-center py-4 mb-4"
            style={{
              backgroundColor: STRAND_BANNER_COLORS[activeStrand] + "66",
            }}
          >
            <h3 className="text-lg font-bold uppercase font-mono">
              {STRAND_FULL_NAMES[activeStrand] || activeStrand}
            </h3>
          </div>

          {/* Context Banner */}
          <div
            className="text-black text-center py-3 mb-6"
            style={{
              backgroundColor: STRAND_BANNER_COLORS[activeStrand] + "CC",
            }}
          >
            <h4 className="text-lg font-bold uppercase font-mono">
              GRADE {activeGrade} | {activeSemester} SEMESTER SUBJECT OFFERINGS
            </h4>
          </div>

          {/* Subject Table */}
          <div className="flex-1 overflow-auto">
            {(() => {
              return (
                <table className="w-full border-collapse font-mono text-sm">
                  <thead>
                    <tr className="bg-gray-300">
                      <th className="border border-gray-400 px-4 py-2 text-left font-bold">
                        NO.
                      </th>
                      <th className="border border-gray-400 px-4 py-2 text-left font-bold">
                        SUBJECT TITLE
                      </th>
                      <th className="border border-gray-400 px-4 py-2 text-left font-bold">
                        SUBJECT CODE
                      </th>
                      <th className="border border-gray-400 px-4 py-2 text-left font-bold">
                        CLASSIFICATION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-gray-400 px-4 py-8 text-center text-gray-500"
                        >
                          Loading subjects...
                        </td>
                      </tr>
                    ) : subjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-gray-400 px-4 py-8 text-center text-gray-500"
                        >
                          No subjects found for the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      subjects.map((subject, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="border border-gray-400 px-4 py-2">
                            {(index + 1).toString().padStart(2, "0")}.
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {subject.title}
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {subject.code}
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {subject.classification}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
