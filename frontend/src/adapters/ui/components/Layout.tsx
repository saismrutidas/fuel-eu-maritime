import { useState } from 'react';
import { ToastContainer } from './Toast';
import RoutesPage from '../pages/RoutesPage';
import ComparePage from '../pages/ComparePage';
import BankingPage from '../pages/BankingPage';
import PoolingPage from '../pages/PoolingPage';

type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'routes',  label: 'Routes',  icon: '🚢' },
  { id: 'compare', label: 'Compare', icon: '📊' },
  { id: 'banking', label: 'Banking', icon: '🏦' },
  { id: 'pooling', label: 'Pooling', icon: '🔗' },
];

function TabContent({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'routes':  return <RoutesPage />;
    case 'compare': return <ComparePage />;
    case 'banking': return <BankingPage />;
    case 'pooling': return <PoolingPage />;
  }
}

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo / Header */}
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚓</span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Fuel EU</p>
              <p className="text-slate-400 text-xs">Compliance Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              ].join(' ')}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Footer badge */}
        <div className="px-6 py-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs">FuelEU Maritime Reg.</p>
          <p className="text-slate-600 text-xs">Target: 89.3368 gCO₂e/MJ</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              FuelEU Maritime Compliance · Regulation (EU) 2023/1805
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              2025 Target Active
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <TabContent tab={activeTab} />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
