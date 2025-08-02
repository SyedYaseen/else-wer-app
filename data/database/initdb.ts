import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function initDb() {
  if (db !== null) return db;

  db = await SQLite.openDatabaseAsync("audiobooks_app.db");
  await db.execAsync("PRAGMA journal_mode = WAL;");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS audiobooks (
      id INTEGER PRIMARY KEY,
      author TEXT NOT NULL,
      series TEXT,
      title TEXT NOT NULL,
      cover_art TEXT,
      local_path TEXT,
      metadata TEXT,
      downloaded INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY,
      book_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      local_path TEXT,
      duration INTEGER,
      channels INTEGER,
      sample_rate INTEGER,
      bitrate INTEGER,
      FOREIGN KEY (book_id) REFERENCES audiobooks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      complete BOOLEAN NOT NULL DEFAULT FALSE,
      progress_ms INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES files (book_id) ON DELETE CASCADE,
      UNIQUE (file_id, book_id)
    );
  `)

  return db
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) return await initDb()
  return db
}

export function setDbNull() {
  db = null
}