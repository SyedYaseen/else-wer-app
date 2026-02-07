import { getDb, initDb, setDbNull } from "./initdb";

export async function resetDb() {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS progress;
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS audiobooks;
  `);
  setDbNull()
  await initDb();
  console.log("Db init after reset complete")
}
