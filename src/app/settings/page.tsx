"use client";

import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 border border-slate-100">
          <h1 className="text-2xl font-bold mb-2 text-slate-800">Settings</h1>
          <p className="text-slate-500">Settings page coming soon.</p>
        </div>
      </div>
    </div>
  );
}
