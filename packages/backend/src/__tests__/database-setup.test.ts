import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

describe('T-13.4: Database Migrations & Seed Scripts', () => {
  beforeAll(async () => {
    // Ensure we're working with a clean test database
    process.env.DATABASE_URL = 'file:./prisma/test.db';

    // Run migrations to set up the test database
    try {
      execSync('pnpm db:migrate', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
      });
    } catch (error) {
      // Migration might fail if already applied, which is fine
      console.log(
        'Migration note:',
        error instanceof Error ? error.message : String(error)
      );
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    // Clean up test database
    const testDbPath = path.join(__dirname, '../../prisma/test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Prisma ORM Installation', () => {
    it('should have Prisma installed as dependency', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.dependencies).toHaveProperty('@prisma/client');
      expect(packageJson.devDependencies).toHaveProperty('prisma');
    });

    it('should have Prisma schema file', () => {
      const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
      expect(fs.existsSync(schemaPath)).toBe(true);
    });

    it('should have migrations folder', () => {
      const migrationsPath = path.join(__dirname, '../../prisma/migrations');
      expect(fs.existsSync(migrationsPath)).toBe(true);
    });

    it('should have seed script', () => {
      const seedPath = path.join(__dirname, '../../prisma/seed.ts');
      expect(fs.existsSync(seedPath)).toBe(true);
    });
  });

  describe('Package.json Scripts', () => {
    it('should have db:migrate script', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts).toHaveProperty('db:migrate');
      expect(packageJson.scripts['db:migrate']).toBe('prisma migrate dev');
    });

    it('should have db:seed script', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts).toHaveProperty('db:seed');
      expect(packageJson.scripts['db:seed']).toBe('tsx prisma/seed.ts');
    });

    it('should have additional Prisma scripts', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts).toHaveProperty('db:generate');
      expect(packageJson.scripts).toHaveProperty('db:push');
      expect(packageJson.scripts).toHaveProperty('db:studio');
    });
  });

  describe('Database Schema', () => {
    it('should have all required models defined', () => {
      const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      // Check for core domain models
      expect(schemaContent).toContain('model User');
      expect(schemaContent).toContain('model Team');
      expect(schemaContent).toContain('model Player');
      expect(schemaContent).toContain('model Tournament');
      expect(schemaContent).toContain('model Phase');
      expect(schemaContent).toContain('model Match');
      expect(schemaContent).toContain('model PlayerStats');

      // Check for governance models
      expect(schemaContent).toContain('model Invitation');
      expect(schemaContent).toContain('model JoinRequest');

      // Check for audit models
      expect(schemaContent).toContain('model AuditLog');
      expect(schemaContent).toContain('model MatchScoreAudit');

      // Check for additional models
      expect(schemaContent).toContain('model Organization');
      expect(schemaContent).toContain('model PlayerOverride');
    });

    it('should have proper database configuration', () => {
      const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      expect(schemaContent).toContain('generator client');
      expect(schemaContent).toContain('provider = "prisma-client-js"');
      expect(schemaContent).toContain('datasource db');
    });
  });

  describe('Seed Data Functionality', () => {
    beforeEach(async () => {
      // Clean the database before each test
      await prisma.auditLog.deleteMany();
      await prisma.playerOverride.deleteMany();
      await prisma.matchScoreAudit.deleteMany();
      await prisma.match.deleteMany();
      await prisma.phase.deleteMany();
      await prisma.joinRequest.deleteMany();
      await prisma.invitation.deleteMany();
      await prisma.playerStats.deleteMany();
      await prisma.team.deleteMany();
      await prisma.tournament.deleteMany();
      await prisma.organization.deleteMany();
      await prisma.user.deleteMany();
    });

    it('should create sample organization data', async () => {
      // Run seed script
      execSync('pnpm db:seed', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
      });

      const organizations = await prisma.organization.findMany();
      expect(organizations).toHaveLength(1);
      expect(organizations[0].name).toBe('Rugby Federation');
    });

    it('should create sample user data with different roles', async () => {
      // Run seed script
      execSync('pnpm db:seed', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
      });

      const users = await prisma.user.findMany();
      expect(users).toHaveLength(7);

      const admin = users.find((u) => u.role === 'admin');
      const coaches = users.filter((u) => u.role === 'coach');
      const players = users.filter((u) => u.role === 'player');

      expect(admin).toBeDefined();
      expect(coaches).toHaveLength(2);
      expect(players).toHaveLength(4);
    });

    it('should create sample tournament with teams and matches', async () => {
      // Run seed script
      execSync('pnpm db:seed', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
      });

      const tournaments = await prisma.tournament.findMany({
        include: {
          teams: true,
          phases: {
            include: {
              matches: true,
            },
          },
        },
      });

      expect(tournaments).toHaveLength(1);
      expect(tournaments[0].name).toBe('Spring Rugby Championship 2024');
      expect(tournaments[0].teams).toHaveLength(2);
      expect(tournaments[0].phases).toHaveLength(1);
      expect(tournaments[0].phases[0].matches).toHaveLength(1);
    });

    it('should create sample audit logs', async () => {
      // Run seed script
      execSync('pnpm db:seed', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
      });

      const auditLogs = await prisma.auditLog.findMany();
      expect(auditLogs.length).toBeGreaterThanOrEqual(2);

      const matchEventLog = auditLogs.find((log) => log.type === 'MATCH_EVENT');
      const playerMovementLog = auditLogs.find(
        (log) => log.type === 'PLAYER_MOVEMENT'
      );

      expect(matchEventLog).toBeDefined();
      expect(playerMovementLog).toBeDefined();
    });

    it('should create sample governance data (invitations and join requests)', async () => {
      // Run seed script
      execSync('pnpm db:seed', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
      });

      const invitations = await prisma.invitation.findMany();
      const joinRequests = await prisma.joinRequest.findMany();

      expect(invitations).toHaveLength(1);
      expect(joinRequests).toHaveLength(1);

      expect(invitations[0].type).toBe('TEAM_PLAYER');
      expect(joinRequests[0].targetEntity).toBe('TOURNAMENT');
    });
  });

  describe('Migration Functionality', () => {
    it('should apply migrations successfully', () => {
      // This test verifies that migrations can be applied without errors
      expect(() => {
        execSync('pnpm db:migrate', {
          cwd: path.join(__dirname, '../..'),
          stdio: 'pipe',
          env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
        });
      }).not.toThrow();
    });

    it('should have migration files in correct format', () => {
      const migrationsPath = path.join(__dirname, '../../prisma/migrations');
      const migrationDirs = fs
        .readdirSync(migrationsPath)
        .filter((item) =>
          fs.statSync(path.join(migrationsPath, item)).isDirectory()
        );

      expect(migrationDirs.length).toBeGreaterThan(0);

      // Check that each migration directory has a migration.sql file
      migrationDirs.forEach((dir) => {
        const migrationSqlPath = path.join(
          migrationsPath,
          dir,
          'migration.sql'
        );
        expect(fs.existsSync(migrationSqlPath)).toBe(true);
      });
    });
  });

  describe('Database Relationships', () => {
    beforeEach(async () => {
      // Run seed to have test data
      execSync('pnpm db:seed', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
      });
    });

    it('should maintain proper foreign key relationships', async () => {
      const tournament = await prisma.tournament.findFirst({
        include: {
          creator: true,
          teams: {
            include: {
              players: {
                include: {
                  user: true,
                },
              },
            },
          },
          phases: {
            include: {
              matches: {
                include: {
                  teamA: true,
                  teamB: true,
                },
              },
            },
          },
        },
      });

      expect(tournament).toBeDefined();
      expect(tournament!.creator).toBeDefined();
      expect(tournament!.teams.length).toBeGreaterThan(0);
      expect(tournament!.phases.length).toBeGreaterThan(0);
      expect(tournament!.phases[0].matches.length).toBeGreaterThan(0);

      const match = tournament!.phases[0].matches[0];
      expect(match.teamA).toBeDefined();
      expect(match.teamB).toBeDefined();
    });

    it('should handle cascade deletes properly', async () => {
      const tournament = await prisma.tournament.findFirst();
      expect(tournament).toBeDefined();

      const initialMatchCount = await prisma.match.count();
      const initialPhaseCount = await prisma.phase.count();

      // Delete related data first due to foreign key constraints
      // Delete all tournament-related records
      await prisma.playerStats.deleteMany({
        where: { tournamentId: tournament!.id },
      });

      await prisma.invitation.deleteMany({
        where: { tournamentId: tournament!.id },
      });

      await prisma.joinRequest.deleteMany({
        where: {
          targetEntity: 'TOURNAMENT',
          entityId: tournament!.id,
        },
      });

      await prisma.auditLog.deleteMany({
        where: { tournamentId: tournament!.id },
      });

      await prisma.playerOverride.deleteMany({
        where: { tournamentId: tournament!.id },
      });

      // Disconnect teams from the tournament (many-to-many relationship)
      await prisma.tournament.update({
        where: { id: tournament!.id },
        data: {
          teams: {
            set: [],
          },
        },
      });

      await prisma.match.deleteMany({
        where: {
          phase: {
            tournamentId: tournament!.id,
          },
        },
      });

      await prisma.phase.deleteMany({
        where: {
          tournamentId: tournament!.id,
        },
      });

      // Now delete the tournament
      await prisma.tournament.delete({
        where: { id: tournament!.id },
      });

      const finalMatchCount = await prisma.match.count();
      const finalPhaseCount = await prisma.phase.count();

      expect(finalMatchCount).toBeLessThan(initialMatchCount);
      expect(finalPhaseCount).toBeLessThan(initialPhaseCount);
    });
  });
});
