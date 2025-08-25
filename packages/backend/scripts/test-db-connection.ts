import { PrismaClient } from '@prisma/client';

// Declare process global for TypeScript
declare const process: {
  exit: (code?: number) => never;
};

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase database connection...');

  try {
    // Test basic connection
    console.log('1. Testing basic connectivity...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database');

    // Test query execution
    console.log('2. Testing query execution...');
    const result =
      await prisma.$queryRaw`SELECT version() as version, current_database() as database`;
    console.log('✅ Query executed successfully:', result);

    // Test table access (check if migrations are applied)
    console.log('3. Testing table access...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible. Current count: ${userCount}`);

    // Test connection pool info
    console.log('4. Testing connection pool info...');
    const poolInfo = (await prisma.$queryRaw`
      SELECT 
        count(*) as active_connections,
        current_setting('max_connections') as max_connections
      FROM pg_stat_activity 
      WHERE state = 'active'
    `) as Array<{ active_connections: bigint; max_connections: string }>;

    console.log('✅ Connection pool info:', {
      activeConnections: Number(poolInfo[0]?.active_connections || 0),
      maxConnections: poolInfo[0]?.max_connections,
    });

    console.log('🎉 All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testDatabaseConnection().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
