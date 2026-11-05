import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { Store, Tenant } from '../types';
import { Search, MapPin, Building2, Check, Clock, X, ChevronRight } from 'lucide-react';

interface SearchableStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchableStoreModal: React.FC<SearchableStoreModalProps> = ({ isOpen, onClose }) => {
  const {
    tenants,
    stores,
    selectedStoreId,
    setSelectedStoreId,
    setSelectedTenantId,
    orders,
  } = useStoreAlerts();

  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredStores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stores;
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.locationCode.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [stores, searchQuery]);

  // Group by tenant
  const groupedStores = useMemo(() => {
    const map = new Map<string, Store[]>();
    tenants.forEach((t) => map.set(t.id, []));
    filteredStores.forEach((s) => {
      const list = map.get(s.tenantId) || [];
      list.push(s);
      map.set(s.tenantId, list);
    });
    return map;
  }, [tenants, filteredStores]);

  if (!isOpen) return null;

  const handleSelectStore = (store: Store) => {
    setSelectedTenantId(store.tenantId);
    setSelectedStoreId(store.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header / Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                DL
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Store Location</h3>
                <p className="text-[11px] text-slate-500">Deliverect connected location & alert destination</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store name, code (e.g. DEL-8812) or street..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Store List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {tenants.map((tenant) => {
            const tenantStores = groupedStores.get(tenant.id) || [];
            if (tenantStores.length === 0) return null;

            return (
              <div key={tenant.id} className="space-y-1.5">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{tenant.name}</span>
                  <span>{tenantStores.length} locations</span>
                </div>

                <div className="space-y-1">
                  {tenantStores.map((store) => {
                    const isSelected = store.id === selectedStoreId;
                    const storeWaiting = orders.filter(
                      (o) => o.storeId === store.id && o.isWaitingToBePicked && o.status === 'NEW'
                    ).length;

                    return (
                      <button
                        key={store.id}
                        onClick={() => handleSelectStore(store)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 ring-1 ring-emerald-500'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {store.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {store.locationCode}
                            </span>
                            {store.capacityStatus !== 'open' && (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                {store.capacityStatus.replace('_', ' +')}m
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {storeWaiting > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                                storeWaiting >= 3
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {storeWaiting} waiting
                            </span>
                          )}

                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredStores.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No store found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
