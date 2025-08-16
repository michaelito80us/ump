import {
  useMutation,
  useQuery,
  useSuspenseQuery,
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
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
export const CreateTournamentAdminTestDocument = `
    mutation CreateTournamentAdminTest($input: CreateTournamentInput!) {
  createTournament(input: $input) {
    id
    name
    status
    startDate
    endDate
  }
}
    `;
export const useCreateTournamentAdminTestMutation = (dataSource, options) => {
  return useMutation({
    mutationKey: ['CreateTournamentAdminTest'],
    mutationFn: (variables) =>
      fetcher(
        dataSource.endpoint,
        dataSource.fetchParams || {},
        CreateTournamentAdminTestDocument,
        variables
      )(),
    ...options,
  });
};
useCreateTournamentAdminTestMutation.getKey = () => [
  'CreateTournamentAdminTest',
];
export const UpdateTournamentDocument = `
    mutation UpdateTournament($id: ID!, $input: UpdateTournamentInput!) {
  updateTournament(id: $id, input: $input) {
    id
    name
    status
    startDate
    endDate
  }
}
    `;
export const useUpdateTournamentMutation = (dataSource, options) => {
  return useMutation({
    mutationKey: ['UpdateTournament'],
    mutationFn: (variables) =>
      fetcher(
        dataSource.endpoint,
        dataSource.fetchParams || {},
        UpdateTournamentDocument,
        variables
      )(),
    ...options,
  });
};
useUpdateTournamentMutation.getKey = () => ['UpdateTournament'];
export const DeleteTournamentDocument = `
    mutation DeleteTournament($id: ID!) {
  deleteTournament(id: $id)
}
    `;
export const useDeleteTournamentMutation = (dataSource, options) => {
  return useMutation({
    mutationKey: ['DeleteTournament'],
    mutationFn: (variables) =>
      fetcher(
        dataSource.endpoint,
        dataSource.fetchParams || {},
        DeleteTournamentDocument,
        variables
      )(),
    ...options,
  });
};
useDeleteTournamentMutation.getKey = () => ['DeleteTournament'];
export const GetTournamentDetailsDocument = `
    query GetTournamentDetails($id: ID!) {
  tournament(id: $id) {
    id
    name
    status
    startDate
    endDate
    phases {
      id
      name
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
        startedAt
        venue
      }
    }
    settings
  }
}
    `;
export const useGetTournamentDetailsQuery = (
  dataSource,
  variables,
  options
) => {
  return useQuery({
    queryKey: ['GetTournamentDetails', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentDetailsDocument,
      variables
    ),
    ...options,
  });
};
useGetTournamentDetailsQuery.document = GetTournamentDetailsDocument;
useGetTournamentDetailsQuery.getKey = (variables) => [
  'GetTournamentDetails',
  variables,
];
export const useSuspenseGetTournamentDetailsQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseQuery({
    queryKey: ['GetTournamentDetailsSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentDetailsDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseGetTournamentDetailsQuery.document = GetTournamentDetailsDocument;
useSuspenseGetTournamentDetailsQuery.getKey = (variables) => [
  'GetTournamentDetailsSuspense',
  variables,
];
export const useInfiniteGetTournamentDetailsQuery = (
  dataSource,
  variables,
  options
) => {
  return useInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? [
          'GetTournamentDetails.infinite',
          variables,
        ],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentDetailsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteGetTournamentDetailsQuery.getKey = (variables) => [
  'GetTournamentDetails.infinite',
  variables,
];
export const useSuspenseInfiniteGetTournamentDetailsQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? [
          'GetTournamentDetails.infiniteSuspense',
          variables,
        ],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentDetailsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteGetTournamentDetailsQuery.getKey = (variables) => [
  'GetTournamentDetails.infiniteSuspense',
  variables,
];
export const GetTournamentsMobileTestDocument = `
    query GetTournamentsMobileTest {
  tournaments {
    id
    name
    status
    startDate
    endDate
  }
}
    `;
export const useGetTournamentsMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useQuery({
    queryKey:
      variables === undefined
        ? ['GetTournamentsMobileTest']
        : ['GetTournamentsMobileTest', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentsMobileTestDocument,
      variables
    ),
    ...options,
  });
};
useGetTournamentsMobileTestQuery.document = GetTournamentsMobileTestDocument;
useGetTournamentsMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetTournamentsMobileTest']
    : ['GetTournamentsMobileTest', variables];
export const useSuspenseGetTournamentsMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseQuery({
    queryKey:
      variables === undefined
        ? ['GetTournamentsMobileTestSuspense']
        : ['GetTournamentsMobileTestSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentsMobileTestDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseGetTournamentsMobileTestQuery.document =
  GetTournamentsMobileTestDocument;
useSuspenseGetTournamentsMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetTournamentsMobileTestSuspense']
    : ['GetTournamentsMobileTestSuspense', variables];
export const useInfiniteGetTournamentsMobileTestQuery = (
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
            ? ['GetTournamentsMobileTest.infinite']
            : ['GetTournamentsMobileTest.infinite', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentsMobileTestDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteGetTournamentsMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetTournamentsMobileTest.infinite']
    : ['GetTournamentsMobileTest.infinite', variables];
export const useSuspenseInfiniteGetTournamentsMobileTestQuery = (
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
            ? ['GetTournamentsMobileTest.infiniteSuspense']
            : ['GetTournamentsMobileTest.infiniteSuspense', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentsMobileTestDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteGetTournamentsMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetTournamentsMobileTest.infiniteSuspense']
    : ['GetTournamentsMobileTest.infiniteSuspense', variables];
export const GetTournamentMobileTestDocument = `
    query GetTournamentMobileTest($id: ID!) {
  tournament(id: $id) {
    id
    name
    status
    startDate
    endDate
    phases {
      id
      name
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
        startedAt
      }
    }
  }
}
    `;
export const useGetTournamentMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useQuery({
    queryKey: ['GetTournamentMobileTest', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentMobileTestDocument,
      variables
    ),
    ...options,
  });
};
useGetTournamentMobileTestQuery.document = GetTournamentMobileTestDocument;
useGetTournamentMobileTestQuery.getKey = (variables) => [
  'GetTournamentMobileTest',
  variables,
];
export const useSuspenseGetTournamentMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseQuery({
    queryKey: ['GetTournamentMobileTestSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetTournamentMobileTestDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseGetTournamentMobileTestQuery.document =
  GetTournamentMobileTestDocument;
useSuspenseGetTournamentMobileTestQuery.getKey = (variables) => [
  'GetTournamentMobileTestSuspense',
  variables,
];
export const useInfiniteGetTournamentMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? [
          'GetTournamentMobileTest.infinite',
          variables,
        ],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentMobileTestDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteGetTournamentMobileTestQuery.getKey = (variables) => [
  'GetTournamentMobileTest.infinite',
  variables,
];
export const useSuspenseInfiniteGetTournamentMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseInfiniteQuery(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? [
          'GetTournamentMobileTest.infiniteSuspense',
          variables,
        ],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetTournamentMobileTestDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteGetTournamentMobileTestQuery.getKey = (variables) => [
  'GetTournamentMobileTest.infiniteSuspense',
  variables,
];
export const GetMatchesMobileTestDocument = `
    query GetMatchesMobileTest {
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
    startedAt
  }
}
    `;
export const useGetMatchesMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useQuery({
    queryKey:
      variables === undefined
        ? ['GetMatchesMobileTest']
        : ['GetMatchesMobileTest', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetMatchesMobileTestDocument,
      variables
    ),
    ...options,
  });
};
useGetMatchesMobileTestQuery.document = GetMatchesMobileTestDocument;
useGetMatchesMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetMatchesMobileTest']
    : ['GetMatchesMobileTest', variables];
export const useSuspenseGetMatchesMobileTestQuery = (
  dataSource,
  variables,
  options
) => {
  return useSuspenseQuery({
    queryKey:
      variables === undefined
        ? ['GetMatchesMobileTestSuspense']
        : ['GetMatchesMobileTestSuspense', variables],
    queryFn: fetcher(
      dataSource.endpoint,
      dataSource.fetchParams || {},
      GetMatchesMobileTestDocument,
      variables
    ),
    ...options,
  });
};
useSuspenseGetMatchesMobileTestQuery.document = GetMatchesMobileTestDocument;
useSuspenseGetMatchesMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetMatchesMobileTestSuspense']
    : ['GetMatchesMobileTestSuspense', variables];
export const useInfiniteGetMatchesMobileTestQuery = (
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
            ? ['GetMatchesMobileTest.infinite']
            : ['GetMatchesMobileTest.infinite', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetMatchesMobileTestDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useInfiniteGetMatchesMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetMatchesMobileTest.infinite']
    : ['GetMatchesMobileTest.infinite', variables];
export const useSuspenseInfiniteGetMatchesMobileTestQuery = (
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
            ? ['GetMatchesMobileTest.infiniteSuspense']
            : ['GetMatchesMobileTest.infiniteSuspense', variables],
        queryFn: (metaData) =>
          fetcher(
            dataSource.endpoint,
            dataSource.fetchParams || {},
            GetMatchesMobileTestDocument,
            { ...variables, ...(metaData.pageParam ?? {}) }
          )(),
        ...restOptions,
      };
    })()
  );
};
useSuspenseInfiniteGetMatchesMobileTestQuery.getKey = (variables) =>
  variables === undefined
    ? ['GetMatchesMobileTest.infiniteSuspense']
    : ['GetMatchesMobileTest.infiniteSuspense', variables];
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
export const MatchUpdatesApolloDocument = `
    subscription MatchUpdatesApollo($tournamentId: ID!) {
  matchUpdated(tournamentId: $tournamentId) {
    id
    status
    scoreA
    scoreB
  }
}
    `;
export const MatchUpdatesDocument = `
    subscription MatchUpdates($tournamentId: ID!) {
  matchUpdated(tournamentId: $tournamentId) {
    id
    status
    scoreA
    scoreB
  }
}
    `;
export const LeaderboardUpdatedMobileDocument = `
    subscription LeaderboardUpdatedMobile($tournamentId: ID!) {
  leaderboardUpdated(tournamentId: $tournamentId) {
    teamId
    position
    points
    wins
    losses
    draws
    goalsFor
    goalsAgainst
    goalDifference
  }
}
    `;
export const MatchUpdatedMobileDocument = `
    subscription MatchUpdatedMobile($tournamentId: ID!) {
  matchUpdated(tournamentId: $tournamentId) {
    id
    phaseId
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
    updatedAt
  }
}
    `;
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
