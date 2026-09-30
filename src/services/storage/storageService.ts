import { TestRecord } from '../../types/test';
import { TestRecipe } from '../../types/recipe';
import { SystemSettings, Operator } from '../../types/system';
import { createSeededTests } from '../../data/mockTests';
import { MOCK_RECIPES } from '../../data/mockRecipes';
import { DEFAULT_SYSTEM_SETTINGS } from '../../constants/defaultSettings';
import { MOCK_OPERATORS } from '../../data/mockOperators';

const STORAGE_KEYS = {
  TESTS: 'mcb_test_records_v1',
  RECIPES: 'mcb_test_recipes_v1',
  SETTINGS: 'mcb_system_settings_v1',
  CURRENT_USER: 'mcb_current_operator_v1',
};

class StorageService {
  // Test Records
  getTests(): TestRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TESTS);
      if (!data) {
        const seeded = createSeededTests();
        this.saveTests(seeded);
        return seeded;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load tests from storage:', e);
      return createSeededTests();
    }
  }

  saveTests(tests: TestRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
    } catch (e) {
      console.error('Failed to save tests to storage:', e);
    }
  }

  saveTest(test: TestRecord): void {
    const tests = this.getTests();
    const existingIndex = tests.findIndex(t => t.id === test.id);
    if (existingIndex >= 0) {
      tests[existingIndex] = test;
    } else {
      tests.unshift(test); // prepend newest
    }
    this.saveTests(tests);
  }

  deleteTest(testId: string): boolean {
    const tests = this.getTests();
    const filtered = tests.filter(t => t.id !== testId);
    if (filtered.length !== tests.length) {
      this.saveTests(filtered);
      return true;
    }
    return false;
  }

  getTestById(testId: string): TestRecord | null {
    const tests = this.getTests();
    return tests.find(t => t.id === testId) || null;
  }

  // Recipes
  getRecipes(): TestRecipe[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (!data) {
        this.saveRecipes(MOCK_RECIPES);
        return MOCK_RECIPES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load recipes from storage:', e);
      return MOCK_RECIPES;
    }
  }

  saveRecipes(recipes: TestRecipe[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch (e) {
      console.error('Failed to save recipes to storage:', e);
    }
  }

  saveRecipe(recipe: TestRecipe): void {
    const recipes = this.getRecipes();
    const existingIndex = recipes.findIndex(r => r.id === recipe.id);
    if (existingIndex >= 0) {
      recipes[existingIndex] = recipe;
    } else {
      recipes.unshift(recipe);
    }
    this.saveRecipes(recipes);
  }

  deleteRecipe(recipeId: string): boolean {
    const recipes = this.getRecipes();
    const filtered = recipes.filter(r => r.id !== recipeId);
    if (filtered.length !== recipes.length) {
      this.saveRecipes(filtered);
      return true;
    }
    return false;
  }

  // Settings
  getSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SYSTEM_SETTINGS);
        return DEFAULT_SYSTEM_SETTINGS;
      }
      return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return DEFAULT_SYSTEM_SETTINGS;
    }
  }

  saveSettings(settings: SystemSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  resetSettingsToDefault(): SystemSettings {
    this.saveSettings(DEFAULT_SYSTEM_SETTINGS);
    return DEFAULT_SYSTEM_SETTINGS;
  }

  // Current User / Operator
  getCurrentOperator(): Operator | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) {
        // Default to Dr. Marcus Vance for immediate usability
        const defaultOp = MOCK_OPERATORS[0];
        this.setCurrentOperator(defaultOp);
        return defaultOp;
      }
      return JSON.parse(data);
    } catch {
      return MOCK_OPERATORS[0];
    }
  }

  setCurrentOperator(op: Operator | null): void {
    try {
      if (op) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(op));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to set operator in storage:', e);
    }
  }
}

export const storageService = new StorageService();
