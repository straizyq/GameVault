import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize Database
try {
  db.prepare("SELECT steam_id FROM games LIMIT 1").get();
} catch (e) {
  db.exec("DROP TABLE IF EXISTS games");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    genre TEXT,
    category TEXT,
    platform TEXT,
    publisher TEXT,
    price REAL,
    discount_price REAL DEFAULT NULL,
    image_url TEXT,
    rating REAL DEFAULT 0,
    steam_id TEXT DEFAULT NULL,
    system_requirements TEXT,
    is_best_seller INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_price REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    game_id INTEGER,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(game_id) REFERENCES games(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    game_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(game_id) REFERENCES games(id)
  );
`);

// Seed initial data if empty
const gameCount = db.prepare("SELECT COUNT(*) as count FROM games").get() as { count: number };
if (gameCount.count === 0) {
  const insertGame = db.prepare(`
    INSERT INTO games (title, description, genre, publisher, price, image_url, rating, system_requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialGames = [
    ["Elden Ring", "The Golden Order has been broken. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.", "Action RPG", "Open World, Souls-like", "Steam, Epic Games", "FromSoftware", 59.99, 44.99, "https://picsum.photos/seed/elden/800/450", 4.9, "1245620", "OS: Windows 10, Processor: INTEL CORE I5-8400, Memory: 12 GB RAM, Graphics: NVIDIA GEFORCE GTX 1060 3 GB", 1],
    ["Cyberpunk 2077", "Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary wrapped in a do-or-die fight for survival.", "RPG", "Sci-fi, Cyberpunk", "Steam, GOG", "CD Projekt Red", 49.99, null, "https://picsum.photos/seed/cyber/800/450", 4.5, "1091500", "OS: Windows 10, Processor: Core i7-6700, Memory: 12 GB RAM, Graphics: GeForce GTX 1060 6GB", 1],
    ["The Witcher 3: Wild Hunt", "You are Geralt of Rivia, mercenary monster slayer. Before you stands a war-torn, monster-infested continent you can explore at will.", "RPG", "Fantasy, Story Rich", "Steam, GOG, Epic Games", "CD Projekt Red", 29.99, 9.99, "https://picsum.photos/seed/witcher/800/450", 4.9, "292030", "OS: Windows 7/8/10, Processor: Intel CPU Core i5-2500K 3.3GHz, Memory: 6 GB RAM, Graphics: Nvidia GPU GeForce GTX 660", 0],
    ["God of War", "His vengeance against the Gods of Olympus years behind him, Kratos now lives as a man in the realm of Norse Gods and monsters.", "Action", "Adventure, Mythology", "Steam, Epic Games", "PlayStation PC", 39.99, null, "https://picsum.photos/seed/gow/800/450", 4.8, "1593500", "OS: Windows 10 64-bit, Processor: Intel i5-2500k, Memory: 8 GB RAM, Graphics: NVIDIA GTX 960", 1],
    ["Red Dead Redemption 2", "Winner of over 175 Game of the Year Awards and recipient of over 250 perfect scores, RDR2 is the epic tale of outlaw Arthur Morgan and the infamous Van der Linde gang.", "Action", "Western, Open World", "Steam, Rockstar", "Rockstar Games", 59.99, 29.99, "https://picsum.photos/seed/rdr2/800/450", 4.9, "1174180", "OS: Windows 10, Processor: Intel Core i7-4770K, Memory: 12 GB RAM, Graphics: Nvidia GeForce GTX 1060 6GB", 1],
    ["Hades", "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion and Transistor.", "Roguelike", "Indie, Action", "Steam, Epic Games", "Supergiant Games", 24.99, null, "https://picsum.photos/seed/hades/800/450", 4.8, "1145360", "OS: Windows 7 SP1, Processor: Dual Core 2.4 GHz, Memory: 4 GB RAM, Graphics: 1GB VRAM", 0]
  ];

  for (const game of initialGames) {
    db.prepare(`
      INSERT INTO games (title, description, genre, category, platform, publisher, price, discount_price, image_url, rating, steam_id, system_requirements, is_best_seller)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(...game);
  }

  // Seed admin user
  db.prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)").run("admin", "admin@gamevault.com", "admin123", "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/games", (req, res) => {
    const games = db.prepare("SELECT * FROM games").all();
    res.json(games);
  });

  app.get("/api/games/:id", (req, res) => {
    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    res.json(game);
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { username, email, password } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run(username, email, password);
      res.json({ id: info.lastInsertRowid, username, email, role: 'user' });
    } catch (e) {
      res.status(400).json({ error: "Username or email already exists" });
    }
  });

  app.get("/api/orders/:userId", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, GROUP_CONCAT(g.title) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN games g ON oi.game_id = g.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all(req.params.userId);
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const { userId, items, totalPrice } = req.body;
    const transaction = db.transaction(() => {
      const orderInfo = db.prepare("INSERT INTO orders (user_id, total_price) VALUES (?, ?)").run(userId, totalPrice);
      const orderId = orderInfo.lastInsertRowid;
      const insertItem = db.prepare("INSERT INTO order_items (order_id, game_id, price) VALUES (?, ?, ?)");
      for (const item of items) {
        insertItem.run(orderId, item.id, item.price);
      }
      return orderId;
    });
    const orderId = transaction();
    res.json({ success: true, orderId });
  });

  // Admin Routes
  app.get("/api/admin/stats", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total_price) as total FROM orders").get() as any;
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get() as any;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const popularGames = db.prepare(`
      SELECT g.title, COUNT(oi.id) as sales
      FROM games g
      JOIN order_items oi ON g.id = oi.game_id
      GROUP BY g.id
      ORDER BY sales DESC
      LIMIT 5
    `).all();
    res.json({
      totalSales: totalSales.total || 0,
      totalOrders: totalOrders.count,
      totalUsers: totalUsers.count,
      popularGames
    });
  });

  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, username, email, role FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/games", (req, res) => {
    const { title, description, genre, category, platform, publisher, price, discount_price, image_url, steam_id, system_requirements, is_best_seller } = req.body;
    const info = db.prepare(`
      INSERT INTO games (title, description, genre, category, platform, publisher, price, discount_price, image_url, steam_id, system_requirements, is_best_seller)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, genre, category, platform, publisher, price, discount_price, image_url, steam_id, system_requirements, is_best_seller ? 1 : 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/admin/games/:id", (req, res) => {
    const { title, description, genre, category, platform, publisher, price, discount_price, image_url, steam_id, system_requirements, is_best_seller } = req.body;
    db.prepare(`
      UPDATE games 
      SET title = ?, description = ?, genre = ?, category = ?, platform = ?, publisher = ?, price = ?, discount_price = ?, image_url = ?, steam_id = ?, system_requirements = ?, is_best_seller = ?
      WHERE id = ?
    `).run(title, description, genre, category, platform, publisher, price, discount_price, image_url, steam_id, system_requirements, is_best_seller ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  // Steam Proxy
  app.get("/api/steam/reviews/:steamId", async (req, res) => {
    try {
      const response = await fetch(`https://store.steampowered.com/appreviews/${req.params.steamId}?json=1&language=russian&num_per_page=10`);
      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch Steam reviews" });
    }
  });

  app.delete("/api/admin/games/:id", (req, res) => {
    db.prepare("DELETE FROM games WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Reviews
  app.get("/api/reviews/:gameId", (req, res) => {
    const reviews = db.prepare(`
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.game_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.gameId);
    res.json(reviews);
  });

  app.post("/api/reviews", (req, res) => {
    const { userId, gameId, rating, comment } = req.body;
    db.prepare("INSERT INTO reviews (user_id, game_id, rating, comment) VALUES (?, ?, ?, ?)").run(userId, gameId, rating, comment);
    res.json({ success: true });
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
