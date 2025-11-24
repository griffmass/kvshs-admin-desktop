import React from 'react';
import Tabs, { Tab } from '../components/Tabs';
import RegularStudent from './RegularStudent';
import NewStudent from './NewStudent';
import ALSStudent from './ALSStudent';
import ALSNewEnrollees from './ALSNewEnrollees';

export default function StudentsPage() {
  return (
    <div className="p-4 pl-32 pt-12">
      <h1 className="text-2xl font-bold mb-6 text-white">Students</h1>
      <Tabs defaultActiveKey="regular">
        <Tab eventKey="regular" title="Regular Students">
          <Tabs defaultActiveKey="enrolled">
            <Tab eventKey="enrolled" title="Enrolled Students">
              <RegularStudent />
            </Tab>
            <Tab eventKey="new-enrollees" title="New Enrollees">
              <NewStudent />
            </Tab>
          </Tabs>
        </Tab>
        <Tab eventKey="als" title="ALS Students">
          <Tabs defaultActiveKey="enrolled">
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
  );
}