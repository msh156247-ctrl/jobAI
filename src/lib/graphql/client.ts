/**
 * GraphQL Client Configuration
 * Apollo Client for Supabase GraphQL API
 */

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { supabase } from '@/lib/supabase'

/**
 * GraphQL 엔드포인트
 * Supabase는 PostgREST를 사용하지만, GraphQL은 pg_graphql extension으로 제공됩니다
 * 또는 Hasura/PostGraphile을 별도로 설정할 수 있습니다
 *
 * 여기서는 Supabase의 GraphQL API를 사용한다고 가정합니다
 */
const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`

/**
 * Auth 링크: Supabase 인증 토큰을 헤더에 추가
 */
const authLink = new ApolloLink((operation, forward) => {
  // 세션에서 토큰 가져오기 (동기적으로 처리)
  const session = supabase.auth.getSession()

  session.then(({ data }) => {
    if (data.session?.access_token) {
      operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
        headers: {
          ...headers,
          authorization: `Bearer ${data.session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      }))
    }
  })

  return forward(operation)
})

/**
 * HTTP 링크
 */
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  headers: {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
})

/**
 * Error 링크: 에러 로깅 및 처리
 */
const errorLink = onError((errorHandler: any) => {
  if (errorHandler.graphQLErrors) {
    errorHandler.graphQLErrors.forEach((error: any) => {
      console.error(
        `[GraphQL error]: Message: ${error.message}, Location: ${JSON.stringify(error.locations)}, Path: ${error.path}`
      )
    })
  }

  if (errorHandler.networkError) {
    console.error(`[Network error]:`, errorHandler.networkError)
  }
})

/**
 * Apollo Client 인스턴스
 */
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // 추천 시스템용 캐싱 정책
          recommendations: {
            merge(existing = [], incoming: any[]) {
              return incoming
            },
          },
          // 행동 추적 데이터 캐싱
          userBehaviors: {
            merge(existing = [], incoming: any[]) {
              return [...existing, ...incoming]
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})

/**
 * GraphQL 사용 여부 확인
 * 환경 변수로 제어 가능
 */
export const USE_GRAPHQL = process.env.NEXT_PUBLIC_USE_GRAPHQL === 'true'
