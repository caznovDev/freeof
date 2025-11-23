import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkBase =
    "text-sm px-2 py-1 rounded-full hover:text-blue-400 transition";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={\`fixed top-0 left-0 h-full w-64 bg-darknav shadow-xl transform \${open ? "translate-x-0" : "-translate-x-full"} transition-transform z-50 sm:hidden\`}
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
          <span className="text-lg font-semibold text-white">
            free<span className="text-blue-500">OF</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="px-4 py-3 space-y-3 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "block text-blue-400 font-medium"
                : "block text-gray-300 hover:text-blue-400"
            }
          >
            Porn Videos
          </NavLink>
          <NavLink
            to="/onlyf"
            className={({ isActive }) =>
              isActive
                ? "block text-blue-400 font-medium"
                : "block text-gray-300 hover:text-blue-400"
            }
          >
            Models
          </NavLink>
        </nav>
      </aside>

      <nav className="bg-darknav border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between fixed top-0 w-full z-30">
        <div className="flex items-center space-x-3">
          <button
            className="text-gray-300 hover:text-white sm:hidden"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-7 h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
              />
            </svg>
          </button>
          <Link
            to="/"
            className="text-xl font-semibold text-white"
            data-no-dual="1"
          >
            free<span className="text-blue-500">OF</span>
          </Link>
          <ul className="hidden sm:flex space-x-5 text-sm ml-4">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  \`\${linkBase} \${isActive ? "text-blue-400" : "text-gray-300"}\`
                }
              >
                Porn Videos
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/onlyf"
                className={({ isActive }) =>
                  \`\${linkBase} \${isActive ? "text-blue-400" : "text-gray-300"}\`
                }
              >
                Models
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
