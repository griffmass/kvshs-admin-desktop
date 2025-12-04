import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Subject from "./pages/Subject";
// Import other pages you might have
// import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Layout component will contain your Sidebar and the main content area */}
        <Route path="/" element={<Layout />}>
          {/* Default route, e.g., a dashboard */}
          {/* <Route index element={<Dashboard />} /> */}

          {/* Add the route to your Subject page */}
          <Route path="subjects" element={<Subject />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
