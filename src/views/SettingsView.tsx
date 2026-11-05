import React, { useState, useEffect } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { audioService, AudioSettings, ChimeStyle, AnnouncerStyle } from '../services/audioService';
import { ChannelLogo, ChannelBadge, DEFAULT_CHANNELS } from '../services/channelLogos';
import { ChannelConfig } from '../types';
import {
  Settings,
  Volume2,
  Headphones,
  Palette,
  Upload,
  Play,
  RotateCcw,
  Check,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
  Tablet,
  CheckCircle2,
} from 'lucide-react';

export const SettingsView: React.FC<{ onOpenCustomModal: () => void }> = ({ onOpenCustomModal }) => {
  const { channels, updateChannelConfig, customChannels, audioQueueState } = useStoreAlerts();

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => audioService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeTab, setActiveTab] = useState<'channels' | 'voice' | 'deliverect_api'>('channels');

  // Load available speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const v = audioService.getAvailableVoices();
      setAvailableVoices(v);
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleAudioSettingChange = (updates: Partial<AudioSettings>) => {
    setAudioSettings((prev) => {
      const next = { ...prev, ...updates };
      audioService.updateSettings(next);
      return next;
    });
  };

  const playTestAnnouncement = () => {
    audioService.speak(
      'Bing bong. Attention team: New Deliveroo order 304 is waiting in the bakery queue. Pickup in 10 minutes.',
      'normal'
    );
  };

  const allChannelKeys = Object.keys(channels);

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Platform & Middleware Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage channel branding logos, railway voice synthesizer, and Deliverect Quest tandem integration.
          </p>
        </div>

        {/* Setting Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'channels'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivery Channels & Colors
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'voice'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Railway Voice Announcer
          </button>
          <button
            onClick={() => setActiveTab('deliverect_api')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'deliverect_api'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deliverect Picking API & Quest
          </button>
        </div>
      </div>

      {/* TAB 1: Channels & Brand Colors */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delivery Channel Color Schemes & Logos
                </h3>
                <p className="text-xs text-slate-500">
                  Customize incoming delivery aggregator brand colors, badge backgrounds, and custom uploaded marks.
                </p>
              </div>
              <button
                onClick={onOpenCustomModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors self-start sm:self-auto shrink-0"
              >
                <span>+ Import Custom Channel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allChannelKeys.map((key) => {
                const chan = channels[key];
                if (!chan) return null;

                return (
                  <div
                    key={chan.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChannelLogo channelId={chan.id} customChannels={customChannels} size="md" />
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{chan.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {chan.id}</span>
                        </div>
                      </div>
                      <ChannelBadge channelId={chan.id} customChannels={customChannels} />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] font-medium">Brand Color:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={chan.brandColor}
                            onChange={(e) => updateChannelConfig(chan.id, { brandColor: e.target.value })}
                            className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                          <span className="font-mono text-xs text-slate-700">{chan.brandColor}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] font-medium">Badge Background:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={chan.badgeBg.slice(0, 7)}
                            onChange={(e) => updateChannelConfig(chan.id, { badgeBg: e.target.value })}
                            className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                          <span className="font-mono text-xs text-slate-700">{chan.badgeBg.slice(0, 7)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Voice & Audible Alert Queue */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Announcer Settings */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-600" />
                    <span>Polite British Railway Announcer Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configured for clear, unhurried operational broadcasts to VoCoVo smart headsets.
                  </p>
                </div>
                <button
                  onClick={playTestAnnouncement}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Voice Announcement</span>
                </button>
              </div>

              {/* Chime Style Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wider block">
                  Announcement Pre-Roll Chime
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleAudioSettingChange({ chimeStyle: 'railway_3tone' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      audioSettings.chimeStyle === 'railway_3tone'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block">
                      British Rail 3-Tone Chime
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      F4 $\to$ A4 $\to$ C5 polite bell tones
                    </span>
                  </button>

                  <button
                    onClick={() => handleAudioSettingChange({ chimeStyle: 'station_bell' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      audioSettings.chimeStyle === 'station_bell'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block">Station Dual Bell</span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Two-tone melodic ping
                    </span>
                  </button>

                  <button
                    onClick={() => handleAudioSettingChange({ chimeStyle: 'subtle_ping' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      audioSettings.chimeStyle === 'subtle_ping'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block">Subtle Single Bell</span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Minimal high chime
                    </span>
                  </button>
                </div>
              </div>

              {/* Voice Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wider block">
                  Speech Synthesis Voice (Prioritizes UK British Railway Accents)
                </label>
                <select
                  value={audioSettings.voiceURI}
                  onChange={(e) => handleAudioSettingChange({ voiceURI: e.target.value })}
                  className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Default British Railway Voice (Auto-selected en-GB)</option>
                  {availableVoices.map((v) => {
                    const isUK =
                      v.lang === 'en-GB' ||
                      v.name.includes('United Kingdom') ||
                      v.name.includes('British') ||
                      v.name.includes('English (UK)');
                    return (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {isUK ? '🇬🇧 ' : ''}
                        {v.name} ({v.lang})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Cadence Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">Polite Cadence (Rate):</span>
                    <span className="font-mono font-bold text-slate-900">{audioSettings.rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.02"
                    value={audioSettings.rate}
                    onChange={(e) => handleAudioSettingChange({ rate: Number(e.target.value) })}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">
                    Recommended 0.94x for polite railway announcer pacing
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">Voice Pitch (Tone):</span>
                    <span className="font-mono font-bold text-slate-900">{audioSettings.pitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.02"
                    value={audioSettings.pitch}
                    onChange={(e) => handleAudioSettingChange({ pitch: Number(e.target.value) })}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">
                    Recommended 0.98 for calm, authoritative inflection
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Sequential Queue Monitor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sequential Audio Queue Monitor</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Guarantees that each audible announcement finishes speaking before the next begins.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Pending in Queue:</span>
                  <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                    {audioQueueState.queueLength} alerts
                  </span>
                </div>

                <div className="border-t border-slate-200/80 pt-2">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    Currently Playing:
                  </span>
                  {audioQueueState.currentMessage ? (
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 font-medium text-[11px] animate-pulse flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>"{audioQueueState.currentMessage}"</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No audio actively speaking</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => audioService.clearQueue()}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Clear Speech Queue & Cancel
              </button>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Anti-Stomping Guarantee
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  When 3 orders arrive at the same second, they enter a strict FIFO queue. Alert 1 chimes and announces; when finished, Alert 2 commences after a 350ms breather.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Deliverect Picking API vs Quest Tandem Architecture */}
      {activeTab === 'deliverect_api' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            {/* Architectural Question & Answer Header */}
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Integration Architecture Analysis
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-2">
                Deliverect Picking API vs Quest App: Can they work in tandem?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Evaluating the relationship between Deliverect's white-label handheld picker client (Quest App), the Deliverect Picking API, and Store Alerts middleware.
              </p>
            </div>

            {/* Answer Summary Card */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  Yes: Store Alerts and Quest Run In Seamless Tandem
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Using Deliverect's Picking API does not stop Quest from working.</strong> Quest is Deliverect's Android client running on rugged Zebra handheld scanners (as shown in the Quest Guide). When orders flow through Deliverect, both Quest and Store Alerts receive status webhooks simultaneously. Store Alerts provides the <em>ambient audio headset alerts (VoCoVo) and wall monitor board</em>, while Quest provides the <em>barcode scanning, substitution, and weighing workflow</em>.
                </p>
              </div>
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Tablet className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase text-slate-800">
                    Deliverect Quest Handheld App (Zebra Scanner)
                  </h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                  <li>In-aisle picking by staff scanning barcodes using camera / scanner.</li>
                  <li>1-tap substitutions with customer live feedback (Uber Eats / Deliveroo).</li>
                  <li>Weighed items capture (e.g. lemons, produce by weight).</li>
                  <li>Requires staff to physically carry and look down at a handheld device.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase text-slate-800">
                    Store Alerts (Deliverect × VoCoVo Middle Handler)
                  </h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                  <li>Immediate audible headset chime before staff even notice a new ticket.</li>
                  <li>Wall-mounted KDS live screen viewable across the whole kitchen.</li>
                  <li>Automatic backlog alerts ("3 orders waiting to be picked!").</li>
                  <li>Rider arrival bay alerts ("Deliveroo courier has arrived").</li>
                </ul>
              </div>
            </div>

            {/* Quest Guide Compatibility Table (Reference Page 29) */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Deliverect Retail Feature Compatibility (from Quest Guide p. 29)
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Feature</th>
                      <th className="p-3 text-center text-[#00CDBC]">Deliveroo</th>
                      <th className="p-3 text-center text-[#06C167]">Uber Eats</th>
                      <th className="p-3 text-center text-[#FF8000]">Just Eat</th>
                      <th className="p-3 text-center text-[#FF3008]">DoorDash</th>
                      <th className="p-3 text-center text-[#009DE0]">Wolt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr>
                      <td className="p-3 font-semibold">Live Webhook Alerts into Headsets</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3">Item Amendments & Substitutions</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3">Live Customer Feedback on Subs</td>
                      <td className="p-3 text-center text-slate-300">—</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ (RT&A)</td>
                      <td className="p-3 text-center text-slate-300">—</td>
                      <td className="p-3 text-center text-slate-300">—</td>
                      <td className="p-3 text-center text-slate-300">—</td>
                    </tr>
                    <tr>
                      <td className="p-3">Courier Arrival Webhooks</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3">Store Busy (+10m/+20m) Time Injection</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                      <td className="p-3 text-center text-emerald-600">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
