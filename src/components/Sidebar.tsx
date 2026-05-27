"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function getSidebarState() {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('sidebarOpen');
  return stored === null ? true : stored === 'true';
}

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // On mount, sync state from localStorage
  useEffect(() => {
    setSidebarOpen(getSidebarState());
  }, []);

  // On change, persist to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen ? 'true' : 'false');
  }, [sidebarOpen]);

  return (
    <aside className={`bg-gradient-to-b from-emerald-700 to-teal-700 text-white flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-56' : 'w-16'} shadow-lg h-screen sticky top-0 z-20`}>
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-2xl leading-none">🌿</span>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="text-white/70 hover:text-white p-1.5 rounded-lg transition"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            {sidebarOpen ? (
              <path fillRule="evenodd" d="M13.78 15.28a.75.75 0 0 1-1.06 0l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 1 1 1.04 1.08L9.832 10l3.948 3.71a.75.75 0 0 1 0 1.08Z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M6.22 4.72a.75.75 0 0 1 1.06 0l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 1 1-1.04-1.08L10.168 10 6.22 6.29a.75.75 0 0 1 0-1.08Z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-2">
        <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium hover:bg-white/10 ${sidebarOpen ? '' : 'justify-center'}`}> 
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3 3.75A.75.75 0 0 1 3.75 3h12.5a.75.75 0 0 1 0 1.5H15v10h1.25a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1 0-1.5H5v-6.25A1.25 1.25 0 0 1 6.25 7h1.5A1.25 1.25 0 0 1 9 8.25v6.25h2V5.25A1.25 1.25 0 0 1 12.25 4h1.5A1.25 1.25 0 0 1 15 5.25v9.25h1.25A.75.75 0 0 1 17 15.25v.5a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 15.75v-.5a.75.75 0 0 1 .75-.75H5V8.25A1.25 1.25 0 0 1 6.25 7h1.5A1.25 1.25 0 0 1 9 8.25v6.25h2V5.25A1.25 1.25 0 0 1 12.25 4h1.5A1.25 1.25 0 0 1 15 5.25v9.25H5V4.5H3.75A.75.75 0 0 1 3 3.75Z" /></svg>
          {sidebarOpen && <span>Dashboard</span>}
        </Link>
        <Link
  href="/"
  className={`flex items-center ${
  sidebarOpen
    ? 'gap-3 px-3 justify-start'
    : 'justify-center px-2'
} py-2 rounded-lg transition-all duration-300 font-medium hover:bg-white/10`}
>

  <div className="w-5 h-5 flex items-center justify-center shrink-0">
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M9.69 2.293a1 1 0 0 1 1.02 0l7 4A1 1 0 0 1 18 7.118V16a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-4H8v4a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V7.118a1 1 0 0 1 .29-.825l7-4ZM4 7.699V16h2v-4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4h2V7.699l-6-3.429-6 3.43Z"
        clipRule="evenodd"
      />
    </svg>
  </div>

  {sidebarOpen && <span>Home</span>}
</Link>
        <Link href="/transactions" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium hover:bg-white/10 ${sidebarOpen ? '' : 'justify-center'}`}> 
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm0 6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4Zm-1 7a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" /></svg>
          {sidebarOpen && <span>Transactions</span>}
        </Link>
        <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium hover:bg-white/10 ${sidebarOpen ? '' : 'justify-center'}`}> 
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.422.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.45.443.925.587 1.422l1.473.294a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.422l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.422.587l-.294 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.422-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.422L1.804 11.32A1 1 0 0 1 1 10.34V8.98a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.422l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 2.684l1.25.834a6.957 6.957 0 0 1 1.422-.587l.289-1.127ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
          {sidebarOpen && <span>Settings</span>}
        </Link>
      </nav>
    </aside>
  );
}
