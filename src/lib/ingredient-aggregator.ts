import type { Dish, Ingredient } from './types';

/**
 * Aggregates all kitchen requirements (equipment and ingredients) for a set of selected dishes.
 * 
 * @param selectedDishes - An array of dishes where each dish has a 'qty' property representing selected portions.
 * @returns An object containing deduplicated equipment and ingredients grouped by category.
 */
export function aggregateRequirements(selectedDishes: (Dish & { qty: number })[]) {
  const equipmentSet = new Set<string>();
  const ingredientsByCategory: Record<string, { name: string, quantity: number, unit: string, isKeyIngredient: boolean }[]> = {};

  selectedDishes.forEach(dish => {
    // 1. Process Equipment: Flatten and deduplicate
    if (dish.equipmentNeeded && Array.isArray(dish.equipmentNeeded)) {
      dish.equipmentNeeded.forEach(item => {
        const cleanedItem = item.trim();
        if (cleanedItem) {
          equipmentSet.add(cleanedItem);
        }
      });
    }

    // 2. Process Ingredients: Group, scale by portions, and merge duplicates
    if (dish.ingredients && Array.isArray(dish.ingredients)) {
      dish.ingredients.forEach(ingredient => {
        const category = ingredient.category || 'Other';
        const totalQty = (ingredient.quantity || 0) * dish.qty;

        if (!ingredientsByCategory[category]) {
          ingredientsByCategory[category] = [];
        }

        // Check if an identical ingredient (same name and unit) already exists in this category
        const existing = ingredientsByCategory[category].find(
          item => item.name.trim().toLowerCase() === ingredient.name.trim().toLowerCase() && 
                  item.unit.trim().toLowerCase() === ingredient.unit.trim().toLowerCase()
        );

        if (existing) {
          // Add quantity to existing entry
          existing.quantity += totalQty;
        } else {
          // Add as a new entry in this category
          ingredientsByCategory[category].push({
            name: ingredient.name,
            quantity: totalQty,
            unit: ingredient.unit,
            isKeyIngredient: ingredient.isKeyIngredient
          });
        }
      });
    }
  });

  return {
    equipment: Array.from(equipmentSet).sort(),
    ingredientsByCategory
  };
}
