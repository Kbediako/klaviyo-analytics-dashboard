import { db } from '../index';

describe('Database Connection', () => {
  afterAll(async () => {
    // Close the database connection after all tests
    await db.close();
  });

  it('should connect to the database and execute a query', async () => {
    // Simple query to test connection
    const result = await db.query('SELECT 1 as number');
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].number).toBe(1);
  });

  it('should handle transactions correctly', async () => {
    // Test transaction with commit
    const result = await db.transaction(async (client) => {
      const res = await client.query('SELECT 2 as number');
      return res.rows[0].number;
    });
    
    expect(result).toBe(2);
    
    // Test transaction with rollback
    try {
      await db.transaction(async (client) => {
        await client.query('SELECT 3 as number');
        throw new Error('Test rollback');
      });
      fail('Transaction should have been rolled back');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Test rollback');
    }
  });

  it('should handle client connections correctly', async () => {
    // Test withClient method
    const result = await db.withClient(async (client) => {
      const res = await client.query('SELECT 4 as number');
      return res.rows[0].number;
    });
    
    expect(result).toBe(4);
  });
});
