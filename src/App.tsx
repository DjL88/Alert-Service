import React, { useState } from 'react';
import { StoreProvider, useStoreAlerts } from './context/StoreContext';
import { OverviewView } from './views/OverviewView';
import { TenantCompanyView } from './views/TenantCompanyView';
import { StoresView } from './views/StoresView';
import { LiveScreenView } from './views/LiveScreenView';
import { SimulatorView } from './views/SimulatorView';
import { TimelineView } from './views/TimelineView';
import { DestinationsView } from './views/DestinationsView';
import { RulesView } from './views/RulesView';
import { SettingsView } from './views/SettingsView';
import { CustomChannelModal } from './components/CustomChannelModal';
import { SearchableStoreModal } from './components/SearchableStoreModal';
import {
  Volume2,
  VolumeX,
  Search,
  ChevronDown,
  Menu,
  X,
  MapPin,
  Settings,
  Sparkles,
} from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    selectedStore,
    selectedTenant,
    waitingOrdersCount,
    isAudioMuted,
    toggleAudioMute,
    audioQueueState,
  } = useStoreAlerts();

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview' },
    { id: 'tenant_map', label: 'Company & Map' },
    { id: 'stores', label: 'Stores & Mappings' },
    { id: 'live_screen', label: 'Live KDS Screen', badge: waitingOrdersCount > 0 ? waitingOrdersCount : undefined },
    { id: 'simulator', label: 'Event Simulator' },
    { id: 'timeline', label: 'Event Timeline' },
    { id: 'destinations', label: 'Destinations' },
    { id: 'rules', label: 'Alert Rules' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Bar (Deliverect Retail Styling with strict mobile safety) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 shadow-2xs w-full max-w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Zone 1: Deliverect Retail Brand Lockup */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 text-left focus:outline-hidden group"
            >
              {/* Deliverect Tilted Tag Logo Mark */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#052F24] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-[#00D084]">
                  <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 whitespace-nowrap">
                    deliverect
                  </span>
                  <span className="text-xs sm:text-sm font-light text-slate-500 whitespace-nowrap">
                    retail
                  </span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#00A86B] hidden sm:block">
                  VoCoVo Headset Alert Bridge
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 min-w-0 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
                        isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Searchable Store Button + Audio Toggle + Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Searchable Store Selector Button (Saves space on mobile & allows search!) */}
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-left max-w-[130px] sm:max-w-[210px] truncate"
              title="Click to search and switch store location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {selectedStore.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono text-slate-500 truncate block sm:inline">
                  {selectedStore.locationCode}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 hidden sm:block" />
            </button>

            {/* Audio Synth Toggle */}
            <button
              onClick={toggleAudioMute}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 shrink-0 ${
                isAudioMuted
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title={isAudioMuted ? 'Unmute British Railway voice announcement' : 'Mute voice audio'}
            >
              {isAudioMuted ? (
                <VolumeX className="w-4 h-4 text-rose-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
              )}
              <span className="hidden md:inline">
                {isAudioMuted ? 'Muted' : 'Railway Voice'}
              </span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden pt-3 pb-2 border-t border-slate-100 mt-2 space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Company: {selectedTenant.name}
            </div>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between ${
                  activeTab === item.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area (With min-w-0 max-w-full overflow-hidden to prevent mobile blowout) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 min-w-0 max-w-full">
        {activeTab === 'overview' && <OverviewView onNavigate={(page) => setActiveTab(page)} />}
        {activeTab === 'tenant_map' && <TenantCompanyView onNavigate={(page) => setActiveTab(page)} />}
        {activeTab === 'stores' && <StoresView />}
        {activeTab === 'live_screen' && <LiveScreenView />}
        {activeTab === 'simulator' && <SimulatorView />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'destinations' && <DestinationsView />}
        {activeTab === 'rules' && <RulesView />}
        {activeTab === 'settings' && (
          <SettingsView onOpenCustomModal={() => setIsChannelModalOpen(true)} />
        )}
      </main>

      {/* Footer / Architecture Status */}
      <footer className="bg-white border-t border-slate-200 py-3 sm:py-4 px-4 sm:px-6 text-xs text-slate-500 w-full max-w-full">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Deliverect Retail</span>
            <span>·</span>
            <span>Store Alerts & VoCoVo Middle Handler</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Font: Proxima Nova</span>
            <span>·</span>
            <span className="text-emerald-700 font-bold">Sequential Audio Queue Active</span>
          </div>
        </div>
      </footer>

      {/* Searchable Store Modal */}
      <SearchableStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />

      {/* Custom Channel Modal */}
      <CustomChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
