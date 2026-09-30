import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Zap, Lock, ArrowRight, UserCheck, Cpu, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { MOCK_OPERATORS } from '../../data/mockOperators';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDemo } = useAuthStore();
  const toast = useToastStore();

  const [operatorId, setOperatorId] = useState('OP-4829');
  const [pin, setPin] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId.trim()) {
      toast.warning('Operator ID Required', 'Please enter your badge or operator ID.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(operatorId, pin);
      setIsLoading(false);
      toast.success('Access Granted', 'Welcome to the MCB Short-Circuit Test Bench.');
      navigate('/dashboard');
    }, 350);
  };

  const handleQuickDemo = (index: number) => {
    loginAsDemo(index);
    const op = MOCK_OPERATORS[index];
    toast.success('Demo Operator Assigned', `Logged in as ${op.name} (${op.role}).`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-engineering-grid flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Branding mark */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Zap className="w-6 h-6 fill-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-mono uppercase">
          AUTOMATED MCB TEST SYSTEM
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-mono">
          IEC 60898-1:2015 Short-Circuit Breaking Capacity Bench • Rig #04
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-6 px-6 shadow-xs rounded-md border border-slate-200">
          <div className="mb-5 pb-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Operator Terminal Login
              </span>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200 font-bold">
              STATION-04
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Operator / Badge ID
              </label>
              <input
                type="text"
                placeholder="e.g. OP-4829"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Security PIN / Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2 font-mono"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Test Station
            </Button>
          </form>

          {/* Quick Demo Operator Profiles */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-2">
              QUICK SWITCH DEMO PROFILES:
            </p>
            <div className="space-y-1.5">
              {MOCK_OPERATORS.slice(0, 3).map((op, idx) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => handleQuickDemo(idx)}
                  className="w-full text-left p-2 rounded border border-slate-200 hover:border-teal-500 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {op.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {op.role} • {op.badgeNumber}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-teal-700 font-bold">
                    Select →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hardware Abstraction Note */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <p className="flex items-center justify-center gap-1.5 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            Hardware Abstraction Layer (HAL) Active • Simulation Prototype
          </p>
        </div>
      </div>
    </div>
  );
};
