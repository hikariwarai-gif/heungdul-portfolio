import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const db = new Database("portfolio.db");

if (supabase) {
  console.log("Using Supabase for permanent storage.");
} else {
  console.log("Using local SQLite (Ephemeral storage). Please set SUPABASE_URL and SUPABASE_KEY for permanent storage.");
}

// Initialize local database (fallback)
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_url_2 TEXT,
    image_url_3 TEXT,
    image_url_4 TEXT,
    image_url_5 TEXT,
    thumbnail_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(portfolio_items)").all() as any[];
const columns = ['thumbnail_url', 'image_url_2', 'image_url_3', 'image_url_4', 'image_url_5'];
columns.forEach(col => {
  if (!tableInfo.some(c => c.name === col)) {
    db.exec(`ALTER TABLE portfolio_items ADD COLUMN ${col} TEXT`);
  }
});

// Clear sample data if it matches the seed pattern
db.prepare("DELETE FROM portfolio_items WHERE title LIKE '서현희 작품 %'").run();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/portfolio", async (req, res) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json(error);
      return res.json(data);
    }
    const items = db.prepare("SELECT * FROM portfolio_items ORDER BY created_at DESC").all();
    res.json(items);
  });

  app.post("/api/portfolio", async (req, res) => {
    const { title, description, image_url, image_url_2, image_url_3, image_url_4, image_url_5, thumbnail_url } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ error: "Title and main image are required" });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('portfolio_items')
        .insert([{ title, description, image_url, image_url_2, image_url_3, image_url_4, image_url_5, thumbnail_url: thumbnail_url || image_url }])
        .select();
      if (error) return res.status(500).json(error);
      return res.json({ id: data[0].id });
    }

    const result = db.prepare(`
      INSERT INTO portfolio_items 
      (title, description, image_url, image_url_2, image_url_3, image_url_4, image_url_5, thumbnail_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || "", image_url, image_url_2, image_url_3, image_url_4, image_url_5, thumbnail_url || image_url);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/portfolio/:id", async (req, res) => {
    const { title, description, image_url, image_url_2, image_url_3, image_url_4, image_url_5, thumbnail_url } = req.body;
    
    if (supabase) {
      const { error } = await supabase
        .from('portfolio_items')
        .update({ title, description, image_url, image_url_2, image_url_3, image_url_4, image_url_5, thumbnail_url })
        .eq('id', req.params.id);
      if (error) return res.status(500).json(error);
      return res.json({ success: true });
    }

    try {
      const result = db.prepare(`
        UPDATE portfolio_items 
        SET title = ?, description = ?, image_url = ?, image_url_2 = ?, image_url_3 = ?, image_url_4 = ?, image_url_5 = ?, thumbnail_url = ? 
        WHERE id = ?
      `).run(title, description, image_url, image_url_2, image_url_3, image_url_4, image_url_5, thumbnail_url, req.params.id);
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/portfolio/:id", async (req, res) => {
    if (supabase) {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', req.params.id);
      if (error) return res.status(500).json(error);
      return res.json({ success: true });
    }

    try {
      const result = db.prepare("DELETE FROM portfolio_items WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
