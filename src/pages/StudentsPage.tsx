import { useState } from "react";
import RegularStudent from "./RegularStudent";
import Section from "./Section";
import Subject from "./Subject";
import NewStudent from "./NewStudent";
import ALSStudent from "./ALSStudent";
import ALSNewEnrollees from "./ALSNewEnrollees";

interface StudentsPageProps {
  currentPage: string;
}

export default function StudentsPage({ currentPage }: StudentsPageProps) {
  const [activeStudentType, setActiveStudentType] = useState("regular");
  const [activeStatus, setActiveStatus] = useState(
    currentPage === "enrollment" ? "new-enrollees" : "enrolled"
  );

  const renderContent = () => {
    if (activeStudentType === "regular") {
      if (activeStatus === "enrolled") {
        return <RegularStudent />;
      } else if (activeStatus === "new-enrollees") {
        return <NewStudent />;
      }
    } else if (activeStudentType === "als") {
      if (activeStatus === "enrolled") {
        return <ALSStudent />;
      } else if (activeStatus === "new-enrollees") {
        return <ALSNewEnrollees />;
      }
    }
    return null;
  };

  if (currentPage === "student-records" || currentPage === "subjects") {
    return currentPage === "student-records" ? <Section /> : <Subject />;
  }

  return (
    <div className="w-full bg-gray-50 h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Enrollment</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="bg-white shadow-lg rounded-xl p-4 h-full flex flex-col">
          {/* Combined Button Row */}
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            {/* Student Type Tabs (Left Side) */}
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveStudentType("regular")}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  activeStudentType === "regular"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Regular Students
              </button>
              <button
                onClick={() => setActiveStudentType("als")}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  activeStudentType === "als"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ALS Students
              </button>
            </div>

            {/* Enrollment Status Buttons (Right Side) */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveStatus("enrolled")}
                className={`flex items-center px-3 h-8 rounded font-medium text-xs transition-colors ${
                  activeStatus === "enrolled"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Enrolled
              </button>
              <button
                onClick={() => setActiveStatus("new-enrollees")}
                className={`flex items-center px-3 h-8 rounded font-medium text-xs transition-colors ${
                  activeStatus === "new-enrollees"
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
