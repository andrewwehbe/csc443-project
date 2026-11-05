import { NavLink, Outlet } from 'react-router';

const links = [
  { to: '/', label: 'Home' },
];

// The persistent shell: header and footer stay, the page inside <Outlet /> changes with the route.
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3" aria-label="Main">
          <span className="font-semibold">CSC443 Project</span>
          <ul className="flex gap-4 text-sm">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) => (isActive ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-900')}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
        CSC443 Web Programming · Fall 2026
      </footer>
    </div>
  );
}
