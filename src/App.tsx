import React from 'react';
import {IntegrationConsole} from './views/IntegrationConsole';

export default function App() {
  return (
    <div className="min-h-screen bg-[#f7f8f8] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#063d30] text-white font-semibold">S</span>
          <span className="font-semibold tracking-tight text-lg">Store Alerts</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <IntegrationConsole />
      </main>
    </div>
  );
}
