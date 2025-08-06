import {
  useQuery,
  useSuspenseQuery,
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
  useMutation,
} from '@tanstack/react-query';
function fetcher(endpoint, requestInit, query, variables) {
  return async () => {
    const res = await fetch(endpoint, {
      method: 'POST',
      ...requestInit,
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) {
      const { message } = json.errors[0];
      throw new Error(message);
    }
    return json.data;
  };
}
export const TestConnectionDocument = `
    query TestConnection {
  __typename
}
    `;
export const useTestConnectionQuery = (dataSource, variables, options) => {
  return useQuery({
    queryKey:
      variables === undefined
        ? ['TestConnection']
        : ['TestConnection', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      TestConnectionDocument,
      variables
    ),
    ...options,
  });
};
useTestConnectionQuery.document = TestConnectionDocument;
useTestConnectionQuery.getKey = (variables) =>
  variables === undefined ? ['TestConnection'] : ['TestConnection', variables];
export const useSuspenseTestConnectionQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseQuery({
    queryKey:
      variables === undefined
        ? ['TestConnectionSuspense']
        : ['TestConnectionSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      TestConnectionDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseTestConnectionQuery.document = TestConnectionDocument;
useSuspenseTestConnectionQuery.getKey = (variables) =>
  variables === undefined
    ? ['TestConnectionSuspense']
    : ['TestConnectionSuspense', variables];
export const useInfiniteTestConnectionQuery = (
  dataSource,
  variables,
  options
) => {
  return useInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ['TestConnection.infinite']
            : ['TestConnection.infinite', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            TestConnectionDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteTestConnectionQuery.getKey = (variables) =>
  variables === undefined
    ? ['TestConnection.infinite']
    : ['TestConnection.infinite', variables];
export const useSuspenseInfiniteTestConnectionQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ['TestConnection.infiniteSuspense']
            : ['TestConnection.infiniteSuspense', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            TestConnectionDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteTestConnectionQuery.getKey = (variables) =>
  variables === undefined
    ? ['TestConnection.infiniteSuspense']
    : ['TestConnection.infiniteSuspense', variables];
export const GetTournamentsDocument = `
    query GetTournaments {
  tournaments {
    id
    name
    sport
    status
    startDate
    endDate
    isLocked
    createdAt
    updatedAt
  }
}
    `;
export const useGetTournamentsQuery = (dataSource, variables, options) => {
  return useQuery({
    queryKey:
      variables === undefined
        ? ['GetTournaments']
        : ['GetTournaments', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentsDocument,
      variables
    ),
    ...options,
  });
};
useGetTournamentsQuery.document = GetTournamentsDocument;
useGetTournamentsQuery.getKey = (variables) =>
  variables === undefined ? ['GetTournaments'] : ['GetTournaments', variables];
export const useSuspenseGetTournamentsQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseQuery({
    queryKey:
      variables === undefined
        ? ['GetTournamentsSuspense']
        : ['GetTournamentsSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentsDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseGetTournamentsQuery.document = GetTournamentsDocument;
useSuspenseGetTournamentsQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetTournamentsSuspense']
    : ['GetTournamentsSuspense', variables];
export const useInfiniteGetTournamentsQuery = (
  dataSource,
  variables,
  options
) => {
  return useInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ['GetTournaments.infinite']
            : ['GetTournaments.infinite', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteGetTournamentsQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetTournaments.infinite']
    : ['GetTournaments.infinite', variables];
export const useSuspenseInfiniteGetTournamentsQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ['GetTournaments.infiniteSuspense']
            : ['GetTournaments.infiniteSuspense', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteGetTournamentsQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetTournaments.infiniteSuspense']
    : ['GetTournaments.infiniteSuspense', variables];
export const GetTournamentDocument = `
    query GetTournament($id: ID!) {
  tournament(id: $id) {
    id
    name
    sport
    status
    startDate
    endDate
    phases {
      id
      name
      pluginId
      status
      matches {
        id
        teamA {
          id
          name
        }
        teamB {
          id
          name
        }
        scoreA
        scoreB
        status
        scheduledAt
        venue
      }
    }
    teams {
      id
      name
      players {
        id
        name
        email
        role
      }
    }
    settings
    isLocked
    createdAt
    updatedAt
  }
}
    `;
export const useGetTournamentQuery = (dataSource, variables, options) => {
  return useQuery({
    queryKey: ['GetTournament', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentDocument,
      variables
    ),
    ...options,
  });
};
useGetTournamentQuery.document = GetTournamentDocument;
useGetTournamentQuery.getKey = (variables) => ['GetTournament', variables];
export const useSuspenseGetTournamentQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseQuery({
    queryKey: ['GetTournamentSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseGetTournamentQuery.document = GetTournamentDocument;
useSuspenseGetTournamentQuery.getKey = (variables) => [
  'GetTournamentSuspense',
  variables,
];
export const useInfiniteGetTournamentQuery = (
  dataSource,
  variables,
  options
) => {
  return useInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? ['GetTournament.infinite', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteGetTournamentQuery.getKey = (variables) => [
  'GetTournament.infinite',
  variables,
];
export const useSuspenseInfiniteGetTournamentQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? [
          'GetTournament.infiniteSuspense',
          variables,
        ],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteGetTournamentQuery.getKey = (variables) => [
  'GetTournament.infiniteSuspense',
  variables,
];
export const GetMatchesDocument = `
    query GetMatches {
  matches {
    id
    teamA {
      id
      name
    }
    teamB {
      id
      name
    }
    scoreA
    scoreB
    status
    scheduledAt
    venue
  }
}
    `;
export const useGetMatchesQuery = (dataSource, variables, options) => {
  return useQuery({
    queryKey:
      variables === undefined ? ['GetMatches'] : ['GetMatches', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetMatchesDocument,
      variables
    ),
    ...options,
  });
};
useGetMatchesQuery.document = GetMatchesDocument;
useGetMatchesQuery.getKey = (variables) =>
  variables === undefined ? ['GetMatches'] : ['GetMatches', variables];
export const useSuspenseGetMatchesQuery = (dataSource, variables, options) => {
  return useSuspenseQuery({
    queryKey:
      variables === undefined
        ? ['GetMatchesSuspense']
        : ['GetMatchesSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetMatchesDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseGetMatchesQuery.document = GetMatchesDocument;
useSuspenseGetMatchesQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetMatchesSuspense']
    : ['GetMatchesSuspense', variables];
export const useInfiniteGetMatchesQuery = (dataSource, variables, options) => {
  return useInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ['GetMatches.infinite']
            : ['GetMatches.infinite', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetMatchesDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteGetMatchesQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetMatches.infinite']
    : ['GetMatches.infinite', variables];
export const useSuspenseInfiniteGetMatchesQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ['GetMatches.infiniteSuspense']
            : ['GetMatches.infiniteSuspense', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetMatchesDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteGetMatchesQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetMatches.infiniteSuspense']
    : ['GetMatches.infiniteSuspense', variables];
export const CreateTournamentDocument = `
    mutation CreateTournament($input: CreateTournamentInput!) {
  createTournament(input: $input) {
    id
    name
    sport
    status
    startDate
    endDate
    settings
    isLocked
    createdAt
    updatedAt
  }
}
    `;
export const useCreateTournamentMutation = (dataSource, options) => {
  return useMutation({
    mutationKey: ['CreateTournament'],
    mutationFn: (variables) =>
      fetcher(
        dataSource.endpoint,
        dataSource.fetchParams || {},
        CreateTournamentDocument,
        variables
      )(),
    ...options,
  });
};
useCreateTournamentMutation.getKey = () => ['CreateTournament'];
export const UpdateMatchScoreDocument = `
    mutation UpdateMatchScore($id: ID!, $score: JSON!) {
  updateMatchScore(id: $id, score: $score) {
    id
    scoreA
    scoreB
    status
    completedAt
  }
}
    `;
export const useUpdateMatchScoreMutation = (dataSource, options) => {
  return useMutation({
    mutationKey: ['UpdateMatchScore'],
    mutationFn: (variables) =>
      fetcher(
        dataSource.endpoint,
        dataSource.fetchParams || {},
        UpdateMatchScoreDocument,
        variables
      )(),
    ...options,
  });
};
useUpdateMatchScoreMutation.getKey = () => ['UpdateMatchScore'];
export const MatchUpdatedDocument = `
    subscription MatchUpdated($tournamentId: ID!) {
  matchUpdated(tournamentId: $tournamentId) {
    id
    teamA {
      id
      name
    }
    teamB {
      id
      name
    }
    scoreA
    scoreB
    status
  }
}
    `;
export const TournamentUpdatedDocument = `
    subscription TournamentUpdated($id: ID!) {
  tournamentUpdated(id: $id) {
    id
    name
    sport
    status
    phases {
      id
      name
      status
    }
    updatedAt
  }
}
    `;
export const LeaderboardUpdatedDocument = `
    subscription LeaderboardUpdated($tournamentId: ID!) {
  leaderboardUpdated(tournamentId: $tournamentId) {
    team {
      id
      name
    }
    position
    points
    wins
    losses
    draws
    stats
  }
}
    `;
//# sourceMappingURL=graphql.js.map
