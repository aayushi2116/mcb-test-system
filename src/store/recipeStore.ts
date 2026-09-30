import { create } from 'zustand';
import { TestRecipe } from '../types/recipe';
import { storageService } from '../services/storage/storageService';
import { useTestStore } from './testStore';

interface RecipeState {
  recipes: TestRecipe[];
  selectedRecipeId: string | null;
  loadRecipes: () => void;
  selectRecipeAndApply: (recipeId: string) => boolean;
  addRecipe: (recipe: Omit<TestRecipe, 'id' | 'createdAt' | 'updatedAt'>) => TestRecipe;
  updateRecipe: (id: string, updates: Partial<TestRecipe>) => void;
  duplicateRecipe: (id: string) => TestRecipe | null;
  deleteRecipe: (id: string) => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: storageService.getRecipes(),
  selectedRecipeId: null,

  loadRecipes: () => {
    set({ recipes: storageService.getRecipes() });
  },

  selectRecipeAndApply: (recipeId: string) => {
    const recipe = get().recipes.find(r => r.id === recipeId);
    if (!recipe) return false;

    // Apply to active test store
    const testStore = useTestStore.getState();
    testStore.setConfiguration(recipe.testConfig);
    if (recipe.mcbTemplate) {
      testStore.setMCB(recipe.mcbTemplate);
    }
    set({ selectedRecipeId: recipeId });
    return true;
  },

  addRecipe: (data) => {
    const newRecipe: TestRecipe = {
      ...data,
      id: `RECIPE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storageService.saveRecipe(newRecipe);
    set({ recipes: storageService.getRecipes() });
    return newRecipe;
  },

  updateRecipe: (id, updates) => {
    const existing = get().recipes.find(r => r.id === id);
    if (!existing) return;
    const updated: TestRecipe = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storageService.saveRecipe(updated);
    set({ recipes: storageService.getRecipes() });
  },

  duplicateRecipe: (id) => {
    const existing = get().recipes.find(r => r.id === id);
    if (!existing) return null;
    const duplicated: TestRecipe = {
      ...existing,
      id: `RECIPE-${Date.now()}`,
      name: `${existing.name} (Copy)`,
      code: `${existing.code}-CPY`,
      isSystemDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storageService.saveRecipe(duplicated);
    set({ recipes: storageService.getRecipes() });
    return duplicated;
  },

  deleteRecipe: (id) => {
    storageService.deleteRecipe(id);
    set({ recipes: storageService.getRecipes() });
  },
}));
