import Tabs, { Tab } from "../components/Tabs";
import RegularStudent from "./RegularStudent";
import NewStudent from "./NewStudent";
import ALSStudent from "./ALSStudent";
import ALSNewEnrollees from "./ALSNewEnrollees";

interface StudentsPageProps {
  currentPage: string;
}

export default function StudentsPage({ currentPage }: StudentsPageProps) {
  const defaultInnerKey =
    currentPage === "enrollment" ? "new-enrollees" : "enrolled";

  return (
    <div className="relative w-full min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-[450px] bg-gradient-to-br from-blue-500 to-blue-50"></div>
        <div className="w-full h-full bg-gray-100 -mt-[2px]"></div>
      </div>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-white">Students</h1>
        <Tabs defaultActiveKey="regular">
          <Tab eventKey="regular" title="Regular Students">
            <Tabs defaultActiveKey={defaultInnerKey}>
              <Tab eventKey="enrolled" title="Enrolled Students">
                <RegularStudent />
              </Tab>
              <Tab eventKey="new-enrollees" title="New Enrollees">
                <NewStudent />
              </Tab>
            </Tabs>
          </Tab>
          <Tab eventKey="als" title="ALS Students">
            <Tabs defaultActiveKey={defaultInnerKey}>
              <Tab eventKey="enrolled" title="Enrolled ALS Students">
                <ALSStudent />
              </Tab>
              <Tab eventKey="new-enrollees" title="New ALS Enrollees">
                <ALSNewEnrollees />
              </Tab>
            </Tabs>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
