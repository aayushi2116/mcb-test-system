import { create } from 'zustand';
import { Operator } from '../types/system';
import { storageService } from '../services/storage/storageService';
import { MOCK_OPERATORS } from '../data/mockOperators';

interface AuthState {
  currentOperator: Operator | null;
  isAuthenticated: boolean;
  setOperator: (op: Operator) => void;
  login: (operatorId: string, pin?: string) => boolean;
  loginAsDemo: (operatorIndex?: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = storageService.getCurrentOperator();

  return {
    currentOperator: initialUser,
    isAuthenticated: !!initialUser,

    setOperator: (op: Operator) => {
      storageService.setCurrentOperator(op);
      set({ currentOperator: op, isAuthenticated: true });
    },

    login: (operatorId: string) => {
      const found = MOCK_OPERATORS.find(op => op.id.toLowerCase() === operatorId.toLowerCase());
      if (found) {
        storageService.setCurrentOperator(found);
        set({ currentOperator: found, isAuthenticated: true });
        return true;
      }
      // Allow custom ID login
      const customOp: Operator = {
        id: operatorId.toUpperCase(),
        name: `Operator ${operatorId}`,
        badgeNumber: `STN4-${operatorId.toUpperCase()}`,
        role: 'OPERATOR',
        labStation: 'Station 4 (High-Current Test Cell)',
        lastLogin: new Date().toISOString(),
      };
      storageService.setCurrentOperator(customOp);
      set({ currentOperator: customOp, isAuthenticated: true });
      return true;
    },

    loginAsDemo: (index = 0) => {
      const demoOp = MOCK_OPERATORS[index % MOCK_OPERATORS.length];
      storageService.setCurrentOperator(demoOp);
      set({ currentOperator: demoOp, isAuthenticated: true });
    },

    logout: () => {
      storageService.setCurrentOperator(null);
      set({ currentOperator: null, isAuthenticated: false });
    },
  };
});
