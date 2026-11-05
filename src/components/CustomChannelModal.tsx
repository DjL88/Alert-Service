import React, { useState } from 'react';
import { ChannelConfig } from '../types';
import { useStoreAlerts } from '../context/StoreContext';
import { X, Upload, Palette, Plus, Check } from 'lucide-react';

interface CustomChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomChannelModal: React.FC<CustomChannelModalProps> = ({ isOpen, onClose }) => {
  const { addCustomChannel } = useStoreAlerts();
  const [name, setName] = useState('');
  const [brandColor, setBrandColor] = useState('#EC4899');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [previewError, setPreviewError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPreviewError('Please upload an image file (PNG, SVG, or JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoDataUrl(reader.result);
        setPreviewError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const channelId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newChannel: ChannelConfig = {
      id: channelId,
      name: name.trim(),
      brandColor,
      textColor: '#FFFFFF',
      badgeBg: `${brandColor}15`,
      badgeBorder: `${brandColor}40`,
      isCustom: true,
      logoSvg: logoDataUrl || undefined,
    };

    addCustomChannel(newChannel);
    setName('');
    setLogoDataUrl('');
    onClose();
  };

  const PRESET_COLORS = [
    '#EC4899', // Pink (Foodora / Foodpanda)
    '#009EE0', // Sky Blue (Wolt)
    '#FFC244', // Yellow (Glovo)
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#10B981', // Mint
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Import Delivery Channel</h3>
            <p className="text-xs text-slate-500 mt-0.5">Add a new delivery platform with custom branding and logos</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Channel Platform Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wolt, Glovo, Foodora"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className="w-7 h-7 rounded-md border border-slate-300 relative transition-transform hover:scale-105"
                    style={{ backgroundColor: c }}
                  >
                    {brandColor.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Logo Icon (SVG, PNG, or JPG)
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0 overflow-hidden bg-slate-50"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                {logoDataUrl ? (
                  <img src={logoDataUrl} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold" style={{ color: brandColor }}>
                    {name ? name.slice(0, 2).toUpperCase() : 'LG'}
                  </span>
                )}
              </div>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors border border-slate-300">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Upload Logo File</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            {previewError && <p className="text-xs text-rose-500 mt-1">{previewError}</p>}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Save Channel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
