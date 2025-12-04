import { NavLink } from "react-router-dom";
import { LayoutDashboard, Book } from "lucide-react"; // Example icons

const navLinks = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/subjects", // This path must match the path in App.tsx
    label: "Subject",
    icon: Book,
  },
  // Add other links here
];

export default function Sidebar() {
  const activeLinkClass = "bg-blue-100 text-blue-600";
  const inactiveLinkClass = "text-gray-600 hover:bg-gray-100";

  return (
    <aside className="w-64 bg-white border-r h-screen p-4">
      <div className="text-2xl font-bold mb-8">KVSHS</div>
      <nav>
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <NavLink
                to={link.href}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg my-1 transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`
                }
              >
                <link.icon size={20} />
                <span className="ml-3">{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
