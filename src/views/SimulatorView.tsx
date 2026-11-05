import React, { useState } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { ChannelBadge } from '../services/channelLogos';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code,
  Copy,
  Radio,
  Headphones,
  Check,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const SimulatorView: React.FC = () => {
  const {
    selectedStore,
    currentMapping,
    currentStoreOrders,
    waitingOrdersCount,
    events,
    alerts,
    deliveryAttempts,
    customChannels,
    simulator,
  } = useStoreAlerts();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'deliveroo' | 'uber_eats' | 'just_eat'>('deliveroo');

  const latestEvent = events[0];
  const latestAlert = alerts[0];
  const latestAttempt = deliveryAttempts[0];

  const SIMULATION_STEPS = [
    {
      step: 1,
      title: 'Register & Activate Store Location',
      desc: 'Simulate Deliverect registration webhook connecting external location ID to internal store record.',
      action: () => {
        simulator.registerAndActivateStore();
        setActiveStep(2);
      },
      btnLabel: '1. Register Location',
      verified: currentMapping?.registrarStatus === 'registered',
      verifyText: `Registrar: ${currentMapping?.registrarStatus || 'Pending'}`,
    },
    {
      step: 2,
      title: 'Receive New Deliveroo Order',
      desc: 'Ingests order, normalizes payload, adds to Waiting Queue, creates alert and announces to VoCoVo headset.',
      action: () => {
        simulator.sendNewOrder('deliveroo', 3);
        setActiveStep(3);
      },
      btnLabel: '2. Inject Deliveroo Order',
      verified: currentStoreOrders.some((o) => o.sourceChannel === 'deliveroo'),
      verifyText: `${currentStoreOrders.filter((o) => o.sourceChannel === 'deliveroo').length} Deliveroo orders`,
    },
    {
      step: 3,
      title: 'Simulate Duplicate Webhook (Idempotency)',
      desc: 'Sends identical source event ID. Verified: discarded safely without creating duplicate ticket or re-alerting.',
      action: () => {
        simulator.sendDuplicateEvent();
        setActiveStep(4);
      },
      btnLabel: '3. Send Duplicate Webhook',
      verified: events.some((e) => e.processingResult === 'duplicate_ignored'),
      verifyText: events.some((e) => e.processingResult === 'duplicate_ignored')
        ? 'Duplicate blocked & logged'
        : 'Pending duplicate test',
    },
    {
      step: 4,
      title: 'Trigger "3 Orders Waiting" Threshold',
      desc: 'Rapidly fills waiting queue past 3 orders, triggering urgent VoCoVo team alert for queue backlog.',
      action: () => {
        simulator.triggerWaitingThreshold();
        setActiveStep(5);
      },
      btnLabel: '4. Trigger 3+ Threshold',
      verified: waitingOrdersCount >= 3,
      verifyText: `${waitingOrdersCount} waiting unpicked`,
    },
    {
      step: 5,
      title: 'Start Picking (Remove from Queue)',
      desc: 'Operator begins fulfillment. Order leaves waiting queue, moves to Picking, and cancels overdue reminder.',
      action: () => {
        const orderToPick = currentStoreOrders.find((o) => o.isWaitingToBePicked);
        if (orderToPick) {
          simulator.startPicking(orderToPick.id);
        } else {
          simulator.sendNewOrder('deliveroo', 2);
          setTimeout(() => {
            const next = currentStoreOrders.find((o) => o.isWaitingToBePicked);
            if (next) simulator.startPicking(next.id);
          }, 200);
        }
        setActiveStep(6);
      },
      btnLabel: '5. Start Picking Order',
      verified: currentStoreOrders.some((o) => o.status === 'PICKING'),
      verifyText: `${currentStoreOrders.filter((o) => o.status === 'PICKING').length} orders being picked`,
    },
    {
      step: 6,
      title: 'Courier Arrives at Store (Rider Update)',
      desc: 'Deliverect driver webhook informs kitchen that rider has arrived at the collection bay.',
      action: () => {
        const order = currentStoreOrders.find((o) => o.riderStatus !== 'ARRIVED') || currentStoreOrders[0];
        if (order) simulator.riderArrived(order.id);
        setActiveStep(7);
      },
      btnLabel: '6. Courier Arrived Alert',
      verified: currentStoreOrders.some((o) => o.riderStatus === 'ARRIVED'),
      verifyText: `${currentStoreOrders.filter((o) => o.riderStatus === 'ARRIVED').length} riders at store`,
    },
    {
      step: 7,
      title: 'Order Cancellation Webhook',
      desc: 'Customer cancels order. Order immediately flagged CANCELLED and headset alert announces "Stop picking".',
      action: () => {
        const orderToCancel = currentStoreOrders.find((o) => o.status !== 'CANCELLED') || currentStoreOrders[0];
        if (orderToCancel) simulator.cancelOrder(orderToCancel.id, 'Customer cancellation via Deliveroo app');
        setActiveStep(8);
      },
      btnLabel: '7. Cancel Order',
      verified: currentStoreOrders.some((o) => o.status === 'CANCELLED'),
      verifyText: `${currentStoreOrders.filter((o) => o.status === 'CANCELLED').length} cancelled`,
    },
    {
      step: 8,
      title: 'Simulate VoCoVo Provider Timeout & Retry',
      desc: 'Simulates adapter timeout/network glitch to demonstrate bounded retries without duplicate speech.',
      action: () => {
        simulator.simulateProviderFailure('dest_soho_vocovo');
      },
      btnLabel: '8. Simulate Delivery Failure',
      verified: deliveryAttempts.some((a) => a.status === 'failed'),
      verifyText: deliveryAttempts.some((a) => a.status === 'failed') ? 'Failure logged' : 'Not triggered',
    },
  ];

  const copyPayload = () => {
    if (latestEvent) {
      navigator.clipboard.writeText(JSON.stringify(latestEvent.payload, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Event Simulator & Contract Testbed</h2>
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase bg-amber-100 text-amber-800 rounded">
              Mock Repository Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate the full lifecycle: registration $\to$ order intake $\to$ deduplication $\to$ VoCoVo headset dispatch $\to$ live screen sync.
          </p>
        </div>

        <button
          onClick={simulator.resetDemoData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Simulation State</span>
        </button>
      </div>

      {/* Guided Step-by-Step Flow */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">End-to-End Operational Lifecycle Journey</h3>
            <p className="text-xs text-slate-500">Run each test scenario in sequence to verify system behaviour</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            Step {activeStep} of 8
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SIMULATION_STEPS.map((step) => {
            const isCurrent = activeStep === step.step;
            return (
              <div
                key={step.step}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                    : step.verified
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-400">Step 0{step.step}</span>
                    {step.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Pending</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100/80">
                  <button
                    onClick={step.action}
                    className={`w-full py-2 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                      isCurrent
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>{step.btnLabel}</span>
                  </button>
                  <div className="text-[10px] text-slate-500 mt-1.5 text-center truncate">
                    {step.verifyText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Quick Triggers + Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Direct Trigger Matrix */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Custom Event Injector</h3>
            <p className="text-xs text-slate-500">Inject individual webhooks directly into the middleware pipeline</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => simulator.sendNewOrder('deliveroo', 2)}
              className="p-3 rounded-lg border border-[#00CDBC]/30 bg-[#00CDBC]/10 hover:bg-[#00CDBC]/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">New Deliveroo Order</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00CDBC]" />
              </div>
              <p className="text-[11px] text-slate-600">Simulate standard 2-item Deliveroo order placement</p>
            </button>

            <button
              onClick={() => simulator.sendNewOrder('uber_eats', 3)}
              className="p-3 rounded-lg border border-[#06C167]/30 bg-[#06C167]/10 hover:bg-[#06C167]/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">New Uber Eats Order</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#06C167]" />
              </div>
              <p className="text-[11px] text-slate-600">Simulate 3-item Uber Eats order with courier</p>
            </button>

            <button
              onClick={() => simulator.sendNewOrder('just_eat', 1)}
              className="p-3 rounded-lg border border-[#FF8000]/30 bg-[#FF8000]/10 hover:bg-[#FF8000]/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">New Just Eat Order</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF8000]" />
              </div>
              <p className="text-[11px] text-slate-600">Single item quick pickup order</p>
            </button>

            <button
              onClick={() => simulator.sendDuplicateEvent()}
              className="p-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-900">Duplicate Webhook Test</span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] text-amber-800">Test idempotency cache against repeated payload</p>
            </button>
          </div>

          {/* Operational Policy Reminder */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified Invariant:
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              When duplicate webhook events arrive with identical <code>sourceEventId</code>, the normalizer writes a <code>duplicate_ignored</code> log and drops delivery dispatch. Staff headsets never chime twice for the same order.
            </p>
          </div>
        </div>

        {/* Right Column: Live Inbound Payload & Event Inspector */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between w-full min-w-0 max-w-full overflow-hidden">
          <div className="min-w-0 max-w-full">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Code className="w-4 h-4 text-cyan-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate">
                  Deliverect Webhook Payload Inspector
                </h3>
              </div>
              <button
                onClick={copyPayload}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            {latestEvent ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Event: {latestEvent.eventType}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-sans uppercase font-bold text-[10px] ${
                      latestEvent.processingResult === 'processed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : latestEvent.processingResult === 'duplicate_ignored'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {latestEvent.processingResult}
                  </span>
                </div>

                <pre className="font-mono text-[11px] text-cyan-300 bg-slate-950/80 p-3 rounded-lg overflow-x-auto border border-slate-800 max-h-56 leading-relaxed">
                  {JSON.stringify(latestEvent.payload, null, 2)}
                </pre>

                <div className="text-[11px] text-slate-400 pt-1">
                  Source Event ID: <span className="font-mono text-slate-200">{latestEvent.sourceEventId}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                No events recorded yet. Click a trigger above to inject a webhook.
              </div>
            )}
          </div>

          {/* Alert Output Outcome */}
          {latestAlert && (
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Latest VoCoVo Speech Template:</span>
                <span className="text-[10px] font-mono text-amber-400 uppercase">
                  {latestAlert.priority} priority
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700 text-white font-medium flex items-center gap-2">
                <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
                <span>"{latestAlert.message}"</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
