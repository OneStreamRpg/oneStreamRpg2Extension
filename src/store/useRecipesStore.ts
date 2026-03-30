import { create } from "zustand";
import { CraftRecipe } from "../types/npcInteraction";

type RecipesState = {
  recipes: CraftRecipe[] | null;
  isLoading: boolean;
};

type RecipesActions = {
  setRecipes: (recipes: CraftRecipe[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

export const useRecipesStore = create<RecipesState & RecipesActions>((set) => ({
  recipes: null,
  isLoading: false,

  setRecipes: (recipes) => set({ recipes, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ recipes: null, isLoading: false }),
}));
