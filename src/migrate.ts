import Connection from "./database/connection";

(async () => {
  const connection = new Connection();
  
  try {
    console.log('Migrating database...')
    await connection.initialize();
    console.log('Database migrated successfully');
  } catch (error) {
    console.error('Failed to migrate database:', error);
  } finally {
    await connection.close();
  }
})();