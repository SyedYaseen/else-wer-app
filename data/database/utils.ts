import { getDb, initDb, setDbNull } from "./initdb";

export async function resetDb() {
    console.log("Resetting db")
    const db = await getDb();
    console.log(db)
    await db.execAsync(`
    DROP TABLE IF EXISTS progress;
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS audiobooks;
  `);
    console.log("Db reset")
    setDbNull()
    await initDb();
    console.log("Db init after reset complete")
}
