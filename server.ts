import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite Database
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cuisine TEXT,
    prepTime INTEGER,
    cookTime INTEGER,
    difficulty TEXT,
    calories INTEGER,
    protein INTEGER,
    carbs INTEGER,
    fats INTEGER,
    ingredients TEXT,
    instructions TEXT,
    matchReason TEXT,
    knowledgeGraph TEXT,
    authorUid TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT,
    allergens TEXT
  );
`);

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get recipes matching preferences
app.post("/api/recipes/search", (req, res) => {
  try {
    const prefs = req.body;
    // Simple search logic based on SQLite:
    // We'll fetch all and filter in memory for simplicity, or do a basic SQL query.
    // For a real app, we'd build a complex SQL query.
    const stmt = db.prepare('SELECT * FROM recipes ORDER BY createdAt DESC LIMIT 50');
    const rows = stmt.all();
    
    // Parse JSON fields
    const recipes = rows.map((row: any) => ({
      ...row,
      ingredients: JSON.parse(row.ingredients || '[]'),
      instructions: JSON.parse(row.instructions || '[]'),
      knowledgeGraph: JSON.parse(row.knowledgeGraph || '{"nodes":[],"links":[]}'),
      tags: JSON.parse(row.tags || '[]'),
      allergens: JSON.parse(row.allergens || '[]')
    }));

    // Filter based on preferences (similar to what we did in Firestore)
    const filtered = recipes.filter(recipe => {
      // Exclude allergens
      if (prefs.allergies && prefs.allergies.length > 0) {
        const hasAllergen = recipe.allergens?.some((a: string) => prefs.allergies.includes(a));
        if (hasAllergen) return false;
      }
      // Exclude disliked foods
      if (prefs.dislikedFoods && prefs.dislikedFoods.length > 0) {
        const hasDisliked = recipe.ingredients?.some((ing: any) => 
          prefs.dislikedFoods.some((d: string) => ing.name.includes(d))
        );
        if (hasDisliked) return false;
      }
      return true;
    });

    res.json(filtered.slice(0, 3)); // Return top 3
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Save a new recipe
app.post("/api/recipes", (req, res) => {
  try {
    const recipe = req.body;
    const id = recipe.id || crypto.randomUUID();
    
    const stmt = db.prepare(`
      INSERT INTO recipes (
        id, title, description, cuisine, prepTime, cookTime, difficulty, 
        calories, protein, carbs, fats, ingredients, instructions, 
        matchReason, knowledgeGraph, authorUid, tags, allergens
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      recipe.title,
      recipe.description,
      recipe.cuisine,
      recipe.prepTime,
      recipe.cookTime,
      recipe.difficulty,
      recipe.calories,
      recipe.protein,
      recipe.carbs,
      recipe.fats,
      JSON.stringify(recipe.ingredients || []),
      JSON.stringify(recipe.instructions || []),
      recipe.matchReason,
      JSON.stringify(recipe.knowledgeGraph || {nodes:[], links:[]}),
      recipe.authorUid || null,
      JSON.stringify(recipe.tags || []),
      JSON.stringify(recipe.allergens || [])
    );

    res.json({ id, success: true });
  } catch (error) {
    console.error("Error saving recipe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
