import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DesignParams, MergeSpec, ThicknessMap, DerivedDimensions, DoorHardwarePosition, DoorHardwareType } from '../geometry/types';
import { DEFAULT_DESIGN, RECOMMENDED_MATERIALS } from '../geometry/constants';
import type { DesignAnalysis } from '../geometry/estimate';
import { analyzeDesign } from '../geometry/estimate';
import { calculateAllDimensions } from '../geometry/measurements';

interface DesignStore {
  // Core design parameters
  params: DesignParams;
  
  // Derived data (computed from params)
  analysis: DesignAnalysis;
  dimensions: DerivedDimensions;
  
  // UI state
  selectedPartId: string | null;
  hoveredPartId: string | null;
  _hasHydrated: boolean;
  
  // Actions
  updateParams: (updates: Partial<DesignParams>) => void;
  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setInteriorClearance: (inches: number) => void;
  setDepth: (inches: number) => void;
  setHasBack: (hasBack: boolean) => void;
  setHasDoors: (hasDoors: boolean) => void;
  setDoorMode: (type: 'inset' | 'overlay') => void;
  setDoorReveal: (inches: number) => void;
  setDoorOverlay: (inches: number) => void;
  setDoorHardwarePosition: (position: DoorHardwarePosition) => void;
  setDoorHardwareType: (type: DoorHardwareType) => void;
  setDoorHardwareInset: (inches: number) => void;

  // Material thickness actions
  setFrameThickness: (thickness: ThicknessMap) => void;
  setBackThickness: (thickness: ThicknessMap) => void;
  setDoorThickness: (thickness: ThicknessMap) => void;
  useRecommendedMaterials: () => void;
  
  // Merge actions
  addMerge: (merge: MergeSpec) => void;
  removeMerge: (index: number) => void;
  clearMerges: () => void;
  toggleCellMerge: (row: number, col: number) => void;
  
  // UI actions
  setSelectedPartId: (id: string | null) => void;
  setHoveredPartId: (id: string | null) => void;

  // Visual actions
  setColorScheme: (scheme: 'greys' | 'browns' | 'blues' | 'random') => void;
  setOpacity: (opacity: number) => void;

  // Utility actions
  reset: () => void;
  exportDesign: () => string;
  importDesign: (data: string) => void;
}

// Helper to recompute derived data
function computeDerivedData(params: DesignParams) {
  const analysis = analyzeDesign(params);
  const dimensions = calculateAllDimensions(params);
  return { analysis, dimensions };
}

export const useDesignStore = create<DesignStore>()(
  persist(
    (set, get) => ({
      // Initial state
      params: DEFAULT_DESIGN,
      ...computeDerivedData(DEFAULT_DESIGN),
      selectedPartId: null,
      hoveredPartId: null,
      _hasHydrated: false,
      
      // Core parameter updates
      updateParams: (updates) => {
        set((state) => {
          const newParams = { ...state.params, ...updates };
          const derived = computeDerivedData(newParams);
          return {
            params: newParams,
            ...derived,
          };
        });
      },
      
      setRows: (rows) => {
        get().updateParams({ rows: Math.max(1, Math.min(10, rows)) });
      },
      
      setCols: (cols) => {
        get().updateParams({ cols: Math.max(1, Math.min(10, cols)) });
      },
      
      setInteriorClearance: (inches) => {
        get().updateParams({ interiorClearanceInches: Math.max(1, inches) });
      },
      
      setDepth: (inches) => {
        get().updateParams({ depthInches: Math.max(1, inches) });
      },
      
      setHasBack: (hasBack) => {
        const updates: Partial<DesignParams> = { hasBack };
        if (hasBack && !get().params.materials.back) {
          updates.materials = {
            ...get().params.materials,
            back: RECOMMENDED_MATERIALS.back,
          };
        }
        get().updateParams(updates);
      },
      
      setHasDoors: (hasDoors) => {
        const updates: Partial<DesignParams> = { hasDoors };
        if (hasDoors && !get().params.materials.door) {
          updates.materials = {
            ...get().params.materials,
            door: RECOMMENDED_MATERIALS.door,
          };
        }
        if (hasDoors && !get().params.doorHardware) {
          updates.doorHardware = {
            position: 'top-center',
            type: 'pull-hole',
            insetInches: 1,
          };
        }
        get().updateParams(updates);
      },
      
      setDoorMode: (type) => {
        get().updateParams({
          doorMode: { ...get().params.doorMode, type },
        });
      },
      
      setDoorReveal: (inches) => {
        get().updateParams({
          doorMode: { ...get().params.doorMode, revealInches: inches },
        });
      },
      
      setDoorOverlay: (inches) => {
        get().updateParams({
          doorMode: { ...get().params.doorMode, overlayInches: inches },
        });
      },

      setDoorHardwarePosition: (position) => {
        const currentHardware = get().params.doorHardware || {
          position: 'top-center',
          type: 'pull-hole',
          insetInches: 1,
        };
        get().updateParams({
          doorHardware: { ...currentHardware, position },
        });
      },

      setDoorHardwareType: (type) => {
        const currentHardware = get().params.doorHardware || {
          position: 'top-center',
          type: 'pull-hole',
          insetInches: 1,
        };
        get().updateParams({
          doorHardware: { ...currentHardware, type },
        });
      },

      setDoorHardwareInset: (inches) => {
        const currentHardware = get().params.doorHardware || {
          position: 'top-center',
          type: 'pull-hole',
          insetInches: 1,
        };
        get().updateParams({
          doorHardware: { ...currentHardware, insetInches: inches },
        });
      },

      // Material thickness actions
      setFrameThickness: (thickness) => {
        get().updateParams({
          materials: {
            ...get().params.materials,
            frame: thickness,
          },
        });
      },
      
      setBackThickness: (thickness) => {
        get().updateParams({
          materials: {
            ...get().params.materials,
            back: thickness,
          },
        });
      },
      
      setDoorThickness: (thickness) => {
        get().updateParams({
          materials: {
            ...get().params.materials,
            door: thickness,
          },
        });
      },
      
      useRecommendedMaterials: () => {
        get().updateParams({
          materials: {
            frame: RECOMMENDED_MATERIALS.frame,
            back: RECOMMENDED_MATERIALS.back,
            door: RECOMMENDED_MATERIALS.door,
          },
        });
      },
      
      // Merge actions
      addMerge: (merge) => {
        const { params } = get();
        const newMerges = [...params.merges];
        
        // Remove any overlapping merges
        const filteredMerges = newMerges.filter(existing => 
          !(merge.r0 <= existing.r1 && merge.r1 >= existing.r0 &&
            merge.c0 <= existing.c1 && merge.c1 >= existing.c0)
        );
        
        filteredMerges.push(merge);
        get().updateParams({ merges: filteredMerges });
      },
      
      removeMerge: (index) => {
        const { params } = get();
        const newMerges = params.merges.filter((_, i) => i !== index);
        get().updateParams({ merges: newMerges });
      },
      
      clearMerges: () => {
        get().updateParams({ merges: [] });
      },
      
      toggleCellMerge: (row, col) => {
        const { params } = get();
        const existingMergeIndex = params.merges.findIndex(merge =>
          row >= merge.r0 && row <= merge.r1 && col >= merge.c0 && col <= merge.c1
        );
        
        if (existingMergeIndex >= 0) {
          // Remove existing merge
          get().removeMerge(existingMergeIndex);
        } else {
          // Create new single-cell merge (will be extended by drag operations)
          get().addMerge({ r0: row, c0: col, r1: row, c1: col });
        }
      },
      
      // UI actions
      setSelectedPartId: (id) => set({ selectedPartId: id }),
      setHoveredPartId: (id) => set({ hoveredPartId: id }),

      // Visual actions
      setColorScheme: (scheme) => {
        get().updateParams({ colorScheme: scheme });
      },
      setOpacity: (opacity) => {
        get().updateParams({ opacity: Math.max(0, Math.min(1, opacity)) });
      },

      // Utility actions
      reset: () => {
        const derived = computeDerivedData(DEFAULT_DESIGN);
        set({
          params: DEFAULT_DESIGN,
          ...derived,
          selectedPartId: null,
          hoveredPartId: null,
        });
        // Update local input state in ControlsPanel
        const event = new CustomEvent('design-reset');
        window.dispatchEvent(event);
      },
      
      exportDesign: () => {
        return JSON.stringify(get().params);
      },
      
      importDesign: (data) => {
        try {
          const params = JSON.parse(data) as DesignParams;
          const derived = computeDerivedData(params);
          set({
            params,
            ...derived,
            selectedPartId: null,
            hoveredPartId: null,
          });
        } catch (error) {
          console.error('Failed to import design:', error);
        }
      },
    }),
    {
      name: 'kallax-design-storage',
      partialize: (state) => ({ params: state.params }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Failed to rehydrate store:', error);
            // Still set as hydrated even on error to prevent infinite loading
            if (state) state._hasHydrated = true;
            return;
          }
          
          if (state) {
            // Recompute derived data after rehydration
            const derived = computeDerivedData(state.params);
            state.analysis = derived.analysis;
            state.dimensions = derived.dimensions;
            
            // Reset UI state
            state.selectedPartId = null;
            state.hoveredPartId = null;
            state._hasHydrated = true;
          }
        };
      },
      // Handle the case where there's no persisted data (new users)
      skipHydration: false,
    }
  )
);