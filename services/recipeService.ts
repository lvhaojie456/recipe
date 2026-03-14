import { Recipe, UserPreferences } from '../types';
import { generateRecipes as aiGenerateRecipes } from './geminiService';

// Calculate Target Calories per meal (assuming 3 meals a day)
const calculateTargetCalories = (prefs: UserPreferences): number => {
    // 1. Calculate BMR (Mifflin-St Jeor)
    let bmr = 10 * prefs.weight + 6.25 * prefs.height - 5 * prefs.age;
    bmr += (prefs.gender === '男') ? 5 : -161;

    // 2. Activity Multiplier
    const activityMultipliers: Record<string, number> = {
        '久坐': 1.2,
        '轻度活动': 1.375,
        '中度活动': 1.55,
        '重度活动': 1.725,
        '极重度活动': 1.9
    };
    const tdee = bmr * (activityMultipliers[prefs.activityLevel] || 1.2);

    // 3. Goal Adjustment
    let targetDailyCalories = tdee;
    switch (prefs.healthGoal) {
        case '减脂': targetDailyCalories -= 500; break;
        case '增肌': targetDailyCalories += 300; break;
        case '备孕': targetDailyCalories += 300; break;
        case '术后恢复': targetDailyCalories += 200; break;
        case '控制三高': targetDailyCalories -= 200; break;
        case '维持现状':
        default: break;
    }

    // Ensure minimum safe calories (1200 for women, 1500 for men)
    const minCals = prefs.gender === '男' ? 1500 : 1200;
    targetDailyCalories = Math.max(targetDailyCalories, minCals);

    // Assuming 3 meals a day, return per-meal target
    return Math.round(targetDailyCalories / 3);
};

export const getRecipesFromDB = async (prefs: UserPreferences): Promise<Recipe[]> => {
  try {
    const response = await fetch('/api/recipes/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefs)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const recipes: Recipe[] = await response.json();
    return recipes;
  } catch (error) {
    console.error("Error fetching recipes from SQLite:", error);
    return [];
  }
};

export const saveRecipeToDB = async (recipe: Recipe): Promise<string | null> => {
    try {
        const response = await fetch('/api/recipes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(recipe)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Error saving recipe to SQLite:", error);
        return null;
    }
}

export const generateAndSaveRecipes = async (prefs: UserPreferences): Promise<Recipe[]> => {
    // 1. Try to get from DB first
    let dbRecipes: Recipe[] = [];
    try {
        dbRecipes = await getRecipesFromDB(prefs);
    } catch (e) {
        console.warn("Failed to fetch from DB, proceeding to generate with AI:", e);
    }
    
    // If we found enough recipes in the DB, return them
    if (dbRecipes.length >= 3) {
        console.log("Found recipes in DB!");
        return dbRecipes;
    }

    // 2. If not enough, generate using AI
    console.log("Not enough recipes in DB, generating with AI...");
    const targetCalories = calculateTargetCalories(prefs);
    
    // Pass the target calories to the AI service
    const generatedRecipes = await aiGenerateRecipes(prefs, targetCalories);

    // 3. Save the newly generated recipes to the DB for future use
    const savedRecipes = await Promise.all(generatedRecipes.map(async (recipe) => {
        // Ensure tags exist
        if (!recipe.tags) recipe.tags = [];
        if (prefs.healthGoal) recipe.tags.push(prefs.healthGoal);
        if (prefs.dietType !== '无特殊') recipe.tags.push(prefs.dietType);
        
        let id = undefined;
        try {
            const savedId = await saveRecipeToDB(recipe);
            if (savedId) id = savedId;
        } catch (e) {
            console.warn("Failed to save recipe to DB, skipping save.", e);
        }
        return { ...recipe, id };
    }));

    return savedRecipes;
};
