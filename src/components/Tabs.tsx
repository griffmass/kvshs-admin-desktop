import React, { useState, ReactNode } from 'react';

interface TabProps {
  eventKey: string;
  title: string;
  children: ReactNode;
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  defaultActiveKey?: string;
}

export default function Tabs({ children, defaultActiveKey }: TabsProps) {
  const [activeKey, setActiveKey] = useState<string>(
    defaultActiveKey || (children.length > 0 ? children[0].props.eventKey : '')
  );

  const handleTabClick = (key: string) => {
    setActiveKey(key);
  };

  const activeTab = children.find(child => child.props.eventKey === activeKey);

  return (
    <div>
      <ul className="flex flex-wrap list-none border-b border-gray-200">
        {children.map((child) => (
          <li key={child.props.eventKey} className="-mb-px">
            <button
              onClick={() => handleTabClick(child.props.eventKey)}
              className={`block py-2 px-4 cursor-pointer rounded-t-lg border border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${
                child.props.eventKey === activeKey
                  ? 'bg-gray-300 border-black border-b-black text-gray-700'
                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:text-blue-600'
              }`}
            >
              {child.props.title}
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg">
        {activeTab?.props.children}
      </div>
    </div>
  );
}