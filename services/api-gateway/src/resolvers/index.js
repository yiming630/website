const userResolvers = require('./userResolvers');
const projectResolvers = require('./projectResolvers');
const documentResolvers = require('./documentResolvers');
const chatResolvers = require('./chatResolvers');
const configResolvers = require('./configResolvers');

// Custom scalar resolvers
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  }
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return null;
      }
    }
    return null;
  }
});

const resolvers = {
  // Custom scalars
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  // Root resolvers
  Query: {
    ...userResolvers.Query,
    ...projectResolvers.Query,
    ...documentResolvers.Query,
    ...chatResolvers.Query,
    ...configResolvers.Query
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...projectResolvers.Mutation,
    ...documentResolvers.Mutation,
    ...chatResolvers.Mutation
  },

  Subscription: {
    ...documentResolvers.Subscription,
    ...chatResolvers.Subscription
  },

  // Type resolvers
  User: userResolvers.User,
  Project: projectResolvers.Project,
  Document: documentResolvers.Document,
  ChatMessage: chatResolvers.ChatMessage
};

module.exports = resolvers;