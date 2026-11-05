import React, { useState } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { Store, RegistrationMapping } from '../types';
import {
  Building2,
  MapPin,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';

export const StoresView: React.FC = () => {
  const {
    tenants,
    stores,
    registrationMappings,
    selectedTenantId,
    selectedStoreId,
    setSelectedTenantId,
    setSelectedStoreId,
    updateRegistrationMapping,
    destinations,
    events,
  } = useStoreAlerts();

  const [activeTabTenant, setActiveTabTenant] = useState<string>(selectedTenantId);

  const tenantStores = stores.filter((s) => s.tenantId === activeTabTenant);
  const currentTenantObj = tenants.find((t) => t.id === activeTabTenant) || tenants[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stores & Registration Mappings</h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect Deliverect locations to internal store records, configured headsets, and live screens.
          </p>
        </div>

        {/* Tenant Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTabTenant(t.id);
                setSelectedTenantId(t.id);
                const firstStore = stores.find((s) => s.tenantId === t.id);
                if (firstStore) setSelectedStoreId(firstStore.id);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTabTenant === t.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Architecture Principle Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
            Deliverect Channel Link Separation Architecture
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            The proposed Deliverect channel acts strictly as a <strong>location registrar</strong>. Registration connects the Deliverect location ID and registrar channel-link ID to our internal store. <strong>Registration does not itself grant cross-channel order access</strong>; the originating channel links (Deliveroo, Uber Eats, Just Eat) and order feed provisioning are tracked separately.
          </p>
        </div>
      </div>

      {/* Stores List for Current Tenant */}
      <div className="grid grid-cols-1 gap-6">
        {tenantStores.map((store) => {
          const mapping = registrationMappings.find((m) => m.storeId === store.id);
          const storeDestinations = destinations.filter((d) => d.storeId === store.id);
          const storeEvents = events.filter((e) => e.internalStoreId === store.id);
          const isSelected = store.id === selectedStoreId;

          return (
            <div
              key={store.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all shadow-xs ${
                isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Store Header Row */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-slate-800">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{store.name}</h3>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                        {store.locationCode}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                          Active Console Context
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{store.address}</span>
                      <span>·</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{store.timezone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <button
                      onClick={() => {
                        setSelectedTenantId(store.tenantId);
                        setSelectedStoreId(store.id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Switch Active Store
                    </button>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      store.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="capitalize">{store.status}</span>
                  </span>
                </div>
              </div>

              {/* Grid of Registration & Mapping Details */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* 1. Deliverect Registrar Mapping */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Deliverect Registrar Binding</span>
                  </h4>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deliverect Location ID:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {mapping?.deliverectLocationId || 'Not linked'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registrar Channel Link:</span>
                      <span className="font-mono text-slate-700">
                        {mapping?.deliverectChannelLinkId || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registrar Status:</span>
                      <span
                        className={`font-bold capitalize ${
                          mapping?.registrarStatus === 'registered' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {mapping?.registrarStatus || 'Unregistered'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order Feed Provisioning:</span>
                      <span
                        className={`font-bold ${
                          mapping?.orderFeedProvisioned ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {mapping?.orderFeedProvisioned ? '✓ Granted' : 'Pending agreement'}
                      </span>
                    </div>
                  </div>

                  {mapping && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Last synced: {new Date(mapping.lastSyncAt).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() =>
                          updateRegistrationMapping(mapping.id, {
                            registrarStatus: mapping.registrarStatus === 'registered' ? 'pending' : 'registered',
                            orderFeedProvisioned: !mapping.orderFeedProvisioned,
                          })
                        }
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Toggle Status
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Originating Channels */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Originating Channel Links</span>
                  </h4>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Aggregator feeds connected via Deliverect order injection:
                    </p>
                    {mapping && mapping.originatingChannelLinkIds.length > 0 ? (
                      <div className="space-y-1">
                        {mapping.originatingChannelLinkIds.map((linkId) => (
                          <div
                            key={linkId}
                            className="font-mono text-[11px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-700 flex items-center justify-between"
                          >
                            <span>{linkId}</span>
                            <span className="text-[10px] text-emerald-600 font-sans font-semibold">Active</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic py-2">
                        No originating aggregator channel links configured for this location.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Output Destinations & Health */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assigned Destinations</span>
                  </h4>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                    {storeDestinations.length === 0 ? (
                      <p className="text-slate-400 italic">No output destinations mapped.</p>
                    ) : (
                      storeDestinations.map((dest) => (
                        <div
                          key={dest.id}
                          className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{dest.name}</span>
                            <span className="block text-[10px] text-slate-400 uppercase font-mono">
                              Type: {dest.type}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              dest.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : dest.status === 'simulated'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {dest.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Inbound events logged:</span>
                    <span className="font-bold text-slate-800 tabular-nums">{storeEvents.length}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
