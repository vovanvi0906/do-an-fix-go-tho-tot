import React, { useState } from 'react';
import CustomerPortalHome from '../components/CustomerPortalHome';
import HomeMobileView from './HomeMobileView';
import { Smartphone, Monitor } from 'lucide-react';

/**
 * HomeOverviewView Component
 * Hỗ trợ chuyển đổi giữa chế độ Mobile Web App View (theo yêu cầu đề bài) và Desktop Portal View
 *
 * @param {Object} props
 * @param {Function} [props.onOrderCreated]
 * @param {Function} [props.setActiveTab]
 */
export default function HomeOverviewView({ onOrderCreated, setActiveTab }) {
  const [viewMode, setViewMode] = useState('mobile');

  return (
    <div className="space-y-4">
      {/* View Switcher Controls for Pair Programming & Testing */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 max-w-md mx-auto shadow-sm">
        <div className="text-xs font-semibold text-slate-300">
          Chế độ xem: <span className="text-sky-400 font-bold">{viewMode === 'mobile' ? 'Mobile App (max-w-md)' : 'Desktop Dashboard'}</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'mobile'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'desktop'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {viewMode === 'mobile' ? (
        <HomeMobileView
          onOrderCreated={onOrderCreated}
          setActiveTab={setActiveTab}
        />
      ) : (
        <CustomerPortalHome
          onOrderCreated={onOrderCreated}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
}
