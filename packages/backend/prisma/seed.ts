import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
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

  console.log('🧹 Cleaned existing data');

  // Create Organizations
  const _org1 = await prisma.organization.create({
    data: {
      name: 'Rugby Federation',
      description: 'Official rugby tournament organization',
      settings: JSON.stringify({
        allowPublicTournaments: true,
        defaultSportPlugins: ['rugby'],
        maxTeamsPerTournament: 32,
      }),
    },
  });

  console.log('🏢 Created organizations');

  // Create Users
  const _hashedPassword = await hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ump.dev',
      name: 'Tournament Admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      role: 'admin',
      clerkId: 'clerk_admin_123',
    },
  });

  const coach1 = await prisma.user.create({
    data: {
      email: 'coach1@team.dev',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      role: 'coach',
      clerkId: 'clerk_coach1_123',
    },
  });

  const coach2 = await prisma.user.create({
    data: {
      email: 'coach2@team.dev',
      name: 'Mike Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      role: 'coach',
      clerkId: 'clerk_coach2_123',
    },
  });

  const players = await Promise.all([
    prisma.user.create({
      data: {
        email: 'player1@team.dev',
        name: 'Alex Thompson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        role: 'player',
        clerkId: 'clerk_player1_123',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player2@team.dev',
        name: 'Jordan Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
        role: 'player',
        clerkId: 'clerk_player2_123',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player3@team.dev',
        name: 'Casey Williams',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=casey',
        role: 'player',
        clerkId: 'clerk_player3_123',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player4@team.dev',
        name: 'Taylor Brown',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taylor',
        role: 'player',
        clerkId: 'clerk_player4_123',
      },
    }),
  ]);

  console.log('👥 Created users');

  // Create Players
  const player1 = await prisma.player.create({
    data: {
      userId: players[0].id,
      sports: 'rugby',
    },
  });

  const player2 = await prisma.player.create({
    data: {
      userId: players[1].id,
      sports: 'rugby',
    },
  });

  const player3 = await prisma.player.create({
    data: {
      userId: players[2].id,
      sports: 'rugby',
    },
  });

  const player4 = await prisma.player.create({
    data: {
      userId: players[3].id,
      sports: 'rugby',
    },
  });

  console.log('🏃 Created players');

  // Create Tournament
  const tournament = await prisma.tournament.create({
    data: {
      pluginId: 'single-elimination',
      name: 'Spring Rugby Championship 2024',
      description:
        'Annual spring rugby tournament featuring top regional teams',
      sport: 'rugby',
      status: 'NOT_STARTED',
      config: JSON.stringify({
        maxTeams: 8,
        matchDuration: 80,
        extraTime: true,
        seedingMethod: 'manual',
        advancementRules: {
          winnerAdvances: true,
          loserEliminated: true,
        },
      }),
      metadata: JSON.stringify({
        venue: 'Central Sports Complex',
        entryFee: 500,
        prizePool: 10000,
        contactEmail: 'tournament@rugby.dev',
      }),
      isLocked: false,
      startDate: new Date('2024-04-15T09:00:00Z'),
      endDate: new Date('2024-04-17T18:00:00Z'),
      creator: {
        connect: { id: admin.id },
      },
    },
  });

  console.log('🏆 Created tournament');

  // Create Teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Thunder Bolts',
      sportIds: 'rugby',
      seed: 1,
      metadata: JSON.stringify({
        founded: '2018',
        homeVenue: 'Thunder Stadium',
        colors: ['blue', 'white'],
      }),
      tournaments: {
        connect: [{ id: tournament.id }],
      },
      managers: {
        connect: [{ id: coach1.id }],
      },
      players: {
        connect: [{ id: player1.id }, { id: player2.id }],
      },
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Fire Hawks',
      sportIds: 'rugby',
      seed: 2,
      metadata: JSON.stringify({
        founded: '2020',
        homeVenue: 'Hawks Arena',
        colors: ['red', 'black'],
      }),
      tournaments: {
        connect: [{ id: tournament.id }],
      },
      managers: {
        connect: [{ id: coach2.id }],
      },
      players: {
        connect: [{ id: player3.id }, { id: player4.id }],
      },
    },
  });

  console.log('🏈 Created teams');

  // Create Player Stats
  await Promise.all([
    prisma.playerStats.create({
      data: {
        playerId: player1.id,
        sport: 'rugby',
        tournamentId: tournament.id,
        stats: JSON.stringify({
          gamesPlayed: 0,
          tries: 0,
          conversions: 0,
          penalties: 0,
          yellowCards: 0,
          redCards: 0,
        }),
      },
    }),
    prisma.playerStats.create({
      data: {
        playerId: player2.id,
        sport: 'rugby',
        tournamentId: tournament.id,
        stats: JSON.stringify({
          gamesPlayed: 0,
          tries: 0,
          conversions: 0,
          penalties: 0,
          yellowCards: 0,
          redCards: 0,
        }),
      },
    }),
  ]);

  console.log('📊 Created player stats');

  // Create Phase
  const phase = await prisma.phase.create({
    data: {
      pluginId: 'single-elimination',
      phaseName: 'Knockout Stage',
      settings: JSON.stringify({
        bracketType: 'single-elimination',
        seedingEnabled: true,
        thirdPlacePlayoff: true,
      }),
      tournamentId: tournament.id,
    },
  });

  console.log('🎯 Created phase');

  // Create Match
  const match = await prisma.match.create({
    data: {
      scoreA: 0,
      scoreB: 0,
      breakdown: JSON.stringify({
        teamA: {
          tries: 0,
          conversions: 0,
          penalties: 0,
          dropGoals: 0,
        },
        teamB: {
          tries: 0,
          conversions: 0,
          penalties: 0,
          dropGoals: 0,
        },
      }),
      scheduledTime: new Date('2024-04-15T10:00:00Z'),
      venue: 'Field A',
      status: 'pending',
      phaseId: phase.id,
      teamAId: team1.id,
      teamBId: team2.id,
    },
  });

  console.log('⚽ Created match');

  // Create Invitations
  await prisma.invitation.create({
    data: {
      type: 'TEAM_PLAYER',
      senderUserId: coach1.id,
      recipientEmail: 'newplayer@team.dev',
      token: 'inv_token_123',
      role: 'player',
      teamId: team1.id,
      tournamentId: tournament.id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('📧 Created invitations');

  // Create Join Request
  await prisma.joinRequest.create({
    data: {
      requesterUserId: players[0].id,
      targetEntity: 'TOURNAMENT',
      entityId: tournament.id,
      roleRequested: 'player',
      status: 'PENDING',
      message: 'I would like to join this tournament as a player',
    },
  });

  console.log('🙋 Created join requests');

  // Create Player Override
  await prisma.playerOverride.create({
    data: {
      playerId: players[0].id,
      tournamentId: tournament.id,
      field: 'position',
      originalValue: JSON.stringify('forward'),
      overrideValue: JSON.stringify('back'),
      reason: 'Injury replacement',
      createdBy: admin.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log('🔄 Created player overrides');

  // Create Audit Logs
  await Promise.all([
    prisma.auditLog.create({
      data: {
        type: 'MATCH_EVENT',
        timestamp: new Date(),
        actorId: admin.id,
        actorType: 'user',
        message: 'Match created',
        data: JSON.stringify({ matchId: match.id }),
        tournamentId: tournament.id,
        matchId: match.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        type: 'PLAYER_MOVEMENT',
        timestamp: new Date(),
        actorId: coach1.id,
        actorType: 'user',
        message: 'Player joined team',
        data: JSON.stringify({ playerId: player1.id, teamId: team1.id }),
        tournamentId: tournament.id,
        playerId: player1.id,
        teamId: team1.id,
        action: 'JOINED',
      },
    }),
  ]);

  console.log('📝 Created audit logs');

  console.log('✅ Database seeded successfully!');
  console.log(`
📊 Summary:
- Organizations: 1
- Users: ${6} (1 admin, 2 coaches, 4 players)
- Tournaments: 1
- Teams: 2
- Phases: 1
- Matches: 1
- Player Stats: 2
- Invitations: 1
- Join Requests: 1
- Player Overrides: 1
- Audit Logs: 2
`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
