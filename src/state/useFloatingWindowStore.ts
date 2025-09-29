import { create } from 'zustand';

interface WindowState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isCollapsed: boolean;
  isVisible: boolean;
  isDocked: boolean;
  dockedPosition?: { side: 'left' | 'right'; order: number };
}

interface FloatingWindowStore {
  windows: Record<string, WindowState>;
  updateWindow: (id: string, state: WindowState) => void;
  toggleCollapse: (id: string) => void;
  toggleDocked: (id: string) => void;
  showWindow: (id: string) => void;
  hideWindow: (id: string) => void;
}

export const useFloatingWindowStore = create<FloatingWindowStore>((set, get) => ({
  windows: {},
  
  updateWindow: (id: string, state: WindowState) => {
    set(prev => ({
      windows: {
        ...prev.windows,
        [id]: state
      }
    }));
  },
  
  toggleCollapse: (id: string) => {
    const { windows } = get();
    const windowState = windows[id];
    if (!windowState) return;

    set(prev => ({
      windows: {
        ...prev.windows,
        [id]: {
          ...windowState,
          isCollapsed: !windowState.isCollapsed
        }
      }
    }));
  },

  toggleDocked: (id: string) => {
    const { windows } = get();
    const windowState = windows[id];
    if (!windowState) return;

    set(prev => ({
      windows: {
        ...prev.windows,
        [id]: {
          ...windowState,
          isDocked: !windowState.isDocked,
          isCollapsed: false // Expand when undocking
        }
      }
    }));
  },

  showWindow: (id: string) => {
    const { windows } = get();
    const windowState = windows[id];
    if (!windowState) return;

    set(prev => ({
      windows: {
        ...prev.windows,
        [id]: {
          ...windowState,
          isVisible: true
        }
      }
    }));
  },

  hideWindow: (id: string) => {
    const { windows } = get();
    const windowState = windows[id];
    if (!windowState) return;

    set(prev => ({
      windows: {
        ...prev.windows,
        [id]: {
          ...windowState,
          isVisible: false
        }
      }
    }));
  }
}));