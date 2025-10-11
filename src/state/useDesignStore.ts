import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DesignParams, MergeSpec, Material, DerivedDimensions, DoorHardwarePosition, DoorHardwareType, UnitSystem } from '../geometry/types';
import { DEFAULT_DESIGN, DEFAULT_DESIGN_IMPERIAL, DEFAULT_DESIGN_METRIC, RECOMMENDED_MATERIALS_IMPERIAL, RECOMMENDED_MATERIALS_METRIC } from '../geometry/constants';
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
  setInteriorClearance: (value: number) => void;
  setDepth: (value: number) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setHasBack: (hasBack: boolean) => void;
  setHasDoors: (hasDoors: boolean) => void;
  setDoorMode: (type: 'inset' | 'overlay') => void;
  setDoorReveal: (value: number) => void;
  setDoorOverlay: (value: number) => void;
  setDoorHardwarePosition: (position: DoorHardwarePosition) => void;
  setDoorHardwareType: (type: DoorHardwareType) => void;
  setDoorHardwareInset: (value: number) => void;

  // Material thickness actions
  setFrameThickness: (thickness: Material) => void;
  setBackThickness: (thickness: Material) => void;
  setDoorThickness: (thickness: Material) => void;
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
      
      setInteriorClearance: (value) => {
        get().updateParams({ interiorClearance: Math.max(1, value) });
      },

      setDepth: (value) => {
        get().updateParams({ depth: Math.max(1, value) });
      },

      setUnitSystem: (unitSystem) => {
        const currentParams = get().params;

        // If switching to the same unit system, do nothing
        if (currentParams.unitSystem === unitSystem) {
          return;
        }

        // Convert values when switching unit systems
        const MM_TO_INCHES = 1 / 25.4;
        const INCHES_TO_MM = 25.4;

        const newInteriorClearance = unitSystem === 'metric'
          ? Math.round(currentParams.interiorClearance * INCHES_TO_MM)
          : Math.round(currentParams.interiorClearance * MM_TO_INCHES * 16) / 16; // Round to nearest 1/16"

        const newDepth = unitSystem === 'metric'
          ? Math.round(currentParams.depth * INCHES_TO_MM)
          : Math.round(currentParams.depth * MM_TO_INCHES * 16) / 16;

        const newReveal = unitSystem === 'metric'
          ? Math.round(currentParams.doorMode.reveal * INCHES_TO_MM)
          : Math.round(currentParams.doorMode.reveal * MM_TO_INCHES * 16) / 16;

        const newOverlay = unitSystem === 'metric'
          ? Math.round(currentParams.doorMode.overlay * INCHES_TO_MM)
          : Math.round(currentParams.doorMode.overlay * MM_TO_INCHES * 16) / 16;

        const newHardwareInset = currentParams.doorHardware
          ? (unitSystem === 'metric'
              ? Math.round(currentParams.doorHardware.inset * INCHES_TO_MM)
              : Math.round(currentParams.doorHardware.inset * MM_TO_INCHES * 16) / 16)
          : undefined;

        // Use recommended materials for the new unit system
        const newMaterials = unitSystem === 'metric'
          ? RECOMMENDED_MATERIALS_METRIC
          : RECOMMENDED_MATERIALS_IMPERIAL;

        get().updateParams({
          unitSystem,
          interiorClearance: newInteriorClearance,
          depth: newDepth,
          doorMode: {
            ...currentParams.doorMode,
            reveal: newReveal,
            overlay: newOverlay,
          },
          doorHardware: currentParams.doorHardware ? {
            ...currentParams.doorHardware,
            inset: newHardwareInset!,
          } : undefined,
          materials: {
            frame: newMaterials.frame,
            back: currentParams.hasBack ? newMaterials.back : undefined,
            door: currentParams.hasDoors ? newMaterials.door : undefined,
          },
        });
      },

      setHasBack: (hasBack) => {
        const updates: Partial<DesignParams> = { hasBack };
        if (hasBack && !get().params.materials.back) {
          const recommendedMaterials = get().params.unitSystem === 'metric'
            ? RECOMMENDED_MATERIALS_METRIC
            : RECOMMENDED_MATERIALS_IMPERIAL;
          updates.materials = {
            ...get().params.materials,
            back: recommendedMaterials.back,
          };
        }
        get().updateParams(updates);
      },
      
      setHasDoors: (hasDoors) => {
        const updates: Partial<DesignParams> = { hasDoors };
        if (hasDoors && !get().params.materials.door) {
          const recommendedMaterials = get().params.unitSystem === 'metric'
            ? RECOMMENDED_MATERIALS_METRIC
            : RECOMMENDED_MATERIALS_IMPERIAL;
          updates.materials = {
            ...get().params.materials,
            door: recommendedMaterials.door,
          };
        }
        if (hasDoors && !get().params.doorHardware) {
          const defaultInset = get().params.unitSystem === 'metric' ? 25 : 1;
          updates.doorHardware = {
            position: 'top-center',
            type: 'pull-hole',
            inset: defaultInset,
          };
        }
        get().updateParams(updates);
      },
      
      setDoorMode: (type) => {
        get().updateParams({
          doorMode: { ...get().params.doorMode, type },
        });
      },
      
      setDoorReveal: (value) => {
        get().updateParams({
          doorMode: { ...get().params.doorMode, reveal: value },
        });
      },

      setDoorOverlay: (value) => {
        get().updateParams({
          doorMode: { ...get().params.doorMode, overlay: value },
        });
      },

      setDoorHardwarePosition: (position) => {
        const defaultInset = get().params.unitSystem === 'metric' ? 25 : 1;
        const currentHardware = get().params.doorHardware || {
          position: 'top-center',
          type: 'pull-hole',
          inset: defaultInset,
        };
        get().updateParams({
          doorHardware: { ...currentHardware, position },
        });
      },

      setDoorHardwareType: (type) => {
        const defaultInset = get().params.unitSystem === 'metric' ? 25 : 1;
        const currentHardware = get().params.doorHardware || {
          position: 'top-center',
          type: 'pull-hole',
          inset: defaultInset,
        };
        get().updateParams({
          doorHardware: { ...currentHardware, type },
        });
      },

      setDoorHardwareInset: (value) => {
        const defaultInset = get().params.unitSystem === 'metric' ? 25 : 1;
        const currentHardware = get().params.doorHardware || {
          position: 'top-center',
          type: 'pull-hole',
          inset: defaultInset,
        };
        get().updateParams({
          doorHardware: { ...currentHardware, inset: value },
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
        const recommendedMaterials = get().params.unitSystem === 'metric'
          ? RECOMMENDED_MATERIALS_METRIC
          : RECOMMENDED_MATERIALS_IMPERIAL;
        get().updateParams({
          materials: {
            frame: recommendedMaterials.frame,
            back: recommendedMaterials.back,
            door: recommendedMaterials.door,
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
        // Use the appropriate default based on current unit system
        const currentUnitSystem = get().params.unitSystem;
        const defaultDesign = currentUnitSystem === 'metric'
          ? DEFAULT_DESIGN_METRIC
          : DEFAULT_DESIGN_IMPERIAL;

        const derived = computeDerivedData(defaultDesign);
        set({
          params: defaultDesign,
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
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // If stored version doesn't match current, clear storage
        if (version !== 2) {
          console.log('Clearing outdated localStorage due to version mismatch');
          return undefined;
        }
        return persistedState;
      },
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