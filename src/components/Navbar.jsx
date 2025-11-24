import { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/onlyf", label: "Models" },
  ];

  return (
    <header className="bg-darknav text-white sticky top-0 z-40 shadow-md">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">FreeOF</span>
          <span className="text-xs uppercase tracking-widest text-gray-400">
            beta
          </span>
        </a>

        {/* Links desktop */}
        <ul className="hidden sm:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-gray-200 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Botão CTA + menu mobile */}
        <div className="flex items-center gap-3">
          
          {/* Botão hamburguer (mobile) */}
          <button
            type="button"
            className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-700 hover:bg-gray-800 focus:outline-none"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Open menu</span>
            <div className="space-y-1.5">
              <span className="block w-5 h-0.5 bg-gray-200"></span>
              <span className="block w-5 h-0.5 bg-gray-200"></span>
              <span className="block w-5 h-0.5 bg-gray-200"></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Menu lateral mobile */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-darknav shadow-xl transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform z-50 sm:hidden`}
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
          <span className="font-semibold">FreeOF</span>
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-800"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          >
            <span className="sr-only">Close menu</span>
            <span className="block w-4 h-0.5 bg-gray-200 rotate-45 translate-y-0.5"></span>
            <span className="block w-4 h-0.5 bg-gray-200 -rotate-45 -translate-y-0.5"></span>
          </button>
        </div>

        <nav className="px-4 py-4">
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block py-2 text-gray-200 hover:text-white hover:bg-gray-800 rounded-md px-2"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          
        </nav>
      </aside>

      {/* Overlay escuro atrás do menu mobile */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}
    </header>
  );
};

export default Navbar;
