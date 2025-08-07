const userResolvers = require('./userResolvers');
const projectResolvers = require('./projectResolvers');
const documentResolvers = require('./documentResolvers');
const chatResolvers = require('./chatResolvers');
const configResolvers = require('./configResolvers');

const resolvers = {
  Query: {
    // User queries
    ...userResolvers.Query,
    
    // Project queries
    ...projectResolvers.Query,
    
    // Document queries
    ...documentResolvers.Query,
    
    // Chat queries
    ...chatResolvers.Query,
    
    // Config queries
    ...configResolvers.Query
  },

  Mutation: {
    // User mutations
    ...userResolvers.Mutation,
    
    // Project mutations
    ...projectResolvers.Mutation,
    
    // Document mutations
    ...documentResolvers.Mutation,
    
    // Chat mutations
    ...chatResolvers.Mutation
  },

  Subscription: {
    // Real-time subscriptions
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