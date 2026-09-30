import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useSystemStore } from '../../store/systemStore';
import { useTestStore } from '../../store/testStore';
import { useToastStore } from '../../store/toastStore';
import {
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  Layers,
  Lock,
} from 'lucide-react';
import { clsx } from 'clsx';

export const HardwareHealthCard: React.FC = () => {
  const { hardwareStatus, setPneumaticClamp } = useSystemStore();
  const { cvuVerification, runCVUVerification } = useTestStore();
  const toast = useToastStore();

  const handleClampToggle = async () => {
    const newState = !hardwareStatus.clampEngaged;
    await setPneumaticClamp(newState);
    toast.info(
      newState ? 'MCB Clamped' : 'MCB Unclamped',
      newState ? 'Pneumatic 6.0 bar clamping pressure locked.' : 'Jaws released for specimen exchange.'
    );
  };

  const handleScanCVU = async () => {
    toast.info('Starting CVU Diagnostic Scan', 'Querying ESP32 ADC channels...');
    const ok = await runCVUVerification();
    if (ok) toast.success('CVU Scan Verified', 'All 6 conditioning channels within 0.2% tolerance.');
  };

  const hardwareNodes = [
    {
      name: 'PLC Controller (Siemens S7-1500)',
      status: hardwareStatus.plcConnected ? 'ONLINE' : 'OFFLINE',
      isOk: hardwareStatus.plcConnected,
      icon: Cpu,
      meta: 'Cycle: 4ms | Modbus TCP / Safety Ring',
    },
    {
      name: 'High-Speed DAQ (NI PXIe / Rogowski)',
      status: hardwareStatus.daqConnected ? 'ARMED' : 'DISCONNECTED',
      isOk: hardwareStatus.daqConnected,
      icon: Activity,
      meta: 'Sample: 100 kS/s | 16-bit ISO ADC',
    },
    {
      name: 'ESP32 CVU Conditioning Unit',
      status: cvuVerification.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING SCAN',
      isOk: cvuVerification.status === 'VERIFIED',
      icon: CheckCircle2,
      meta: `Port: ${cvuVerification.port} | Ping: ${cvuVerification.diagnosticPingMs}ms`,
      action: (
        <Button size="sm" variant="outline" onClick={handleScanCVU}>
          <RefreshCw className="w-3 h-3 mr-1" /> Re-scan
        </Button>
      ),
    },
    {
      name: 'Switched R-L Matrix Bank',
      status: 'READY',
      isOk: true,
      icon: Layers,
      meta: '5 Resistor Banks + 5 Inductor Taps Ready',
    },
    {
      name: 'Safety Interlocks & Pneumatic Clamp',
      status: hardwareStatus.interlockClosed && hardwareStatus.clampEngaged ? 'SECURED' : 'ATTENTION',
      isOk: hardwareStatus.interlockClosed && hardwareStatus.clampEngaged,
      icon: Shield,
      meta: `Door: ${hardwareStatus.interlockClosed ? 'LOCKED' : 'OPEN'} | Clamp: ${hardwareStatus.clampEngaged ? '6.0 bar' : 'RELEASED'}`,
      action: (
        <Button size="sm" variant="secondary" onClick={handleClampToggle}>
          <Lock className="w-3 h-3 mr-1" /> {hardwareStatus.clampEngaged ? 'Release Clamp' : 'Engage Clamp'}
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Hardware Station Readiness"
      subtitle="Subsystem controllers & physical test-bay sensors"
      badge={
        hardwareStatus.simulationMode ? (
          <Badge variant="teal" size="sm">
            Simulation Abstraction Active
          </Badge>
        ) : undefined
      }
    >
      <div className="divide-y divide-slate-100">
        {hardwareNodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div key={index} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    node.isOk ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {node.name}
                    </span>
                    <Badge variant={node.isOk ? 'success' : 'warning'} size="sm">
                      {node.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{node.meta}</p>
                </div>
              </div>
              {node.action && <div className="flex-shrink-0">{node.action}</div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
