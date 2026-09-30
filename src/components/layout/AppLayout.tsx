import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Collapsible / Responsive Industrial Sidebar */}
      <Sidebar />

      {/* Main Execution Column - automatically expands/contracts into available space */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-200">
        {/* Top Header */}
        <Header />

        {/* Industrial Engineering Workspace Viewport with subtle grid */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-engineering-grid p-3 sm:p-4 lg:p-6 min-w-0 w-full">
          <div className="w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Industrial Toast Alerts */}
      <ToastContainer />
    </div>
  );
};
