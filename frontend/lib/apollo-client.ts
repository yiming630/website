import { ApolloClient, InMemoryCache, createHttpLink, split, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';

// HTTP链接配置
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
});

// WebSocket链接配置（用于订阅）
const wsLink = typeof window !== 'undefined' ? new WebSocketLink({
  uri: process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:4000/graphql',
  options: {
    reconnect: true,
    connectionParams: () => {
      const token = localStorage.getItem('token');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  },
}) : null;

// 认证链接（添加token到请求头）
const authLink = setContext((_, { headers }) => {
  // 只在客户端获取token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// 错误处理链接
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // 如果是401错误，可能需要刷新token
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // 处理token过期
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
  }
});

// 根据操作类型分割链接（查询/变更使用HTTP，订阅使用WebSocket）
const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      ApolloLink.from([errorLink, authLink, httpLink])
    )
  : ApolloLink.from([errorLink, authLink, httpLink]);

// 创建Apollo Client实例
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          documents: {
            // 合并文档列表
            merge(existing = [], incoming) {
              return [...incoming];
            },
          },
          projects: {
            // 合并项目列表
            merge(existing = [], incoming) {
              return [...incoming];
            },
          },
        },
      },
      Document: {
        keyFields: ['id'],
      },
      Project: {
        keyFields: ['id'],
      },
      User: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// 客户端初始化函数
export const initializeApollo = () => {
  return apolloClient;
};

// 用于服务端渲染
export const createApolloClient = () => {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: createHttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
    }),
    cache: new InMemoryCache(),
  });
};
