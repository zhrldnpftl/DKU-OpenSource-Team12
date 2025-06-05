import { create } from 'zustand';

export const useFridgeStore = create(set => ({
  ingredients: [],
  addIngredient: (item) =>
    set(state => ({ ingredients: [...state.ingredients, item] })),
  removeIngredient: (item) =>
    set(state => ({ ingredients: state.ingredients.filter(i => i !== item) })),
  clearFridge: () => set({ ingredients: [] }),
}));
