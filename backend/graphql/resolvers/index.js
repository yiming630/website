/**
 * GraphQL Resolvers
 * Main resolver file that combines all resolver modules
 */

const { GraphQLDateTime, GraphQLJSON } = require('graphql-scalars');
const authResolvers = require('./auth');
const userResolvers = require('./user');
const projectResolvers = require('./project');
const documentResolvers = require('./document');
const translationResolvers = require('./translation');

const resolvers = {
  // Scalar resolvers
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,

  // Query resolvers
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...projectResolvers.Query,
    ...documentResolvers.Query,
    ...translationResolvers.Query,
    
    // System stats
    systemStats: async (_, __, { db }) => {
      const stats = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM projects) as total_projects,
          (SELECT COUNT(*) FROM documents) as total_documents,
          (SELECT COUNT(*) FROM translation_jobs WHERE status = 'running') as active_translations
      `);
      
      const row = stats.rows[0];
      return {
        totalUsers: parseInt(row.total_users),
        totalProjects: parseInt(row.total_projects),
        totalDocuments: parseInt(row.total_documents),
        activeTranslations: parseInt(row.active_translations)
      };
    }
  },

  // Mutation resolvers
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...projectResolvers.Mutation,
    ...documentResolvers.Mutation,
    ...translationResolvers.Mutation
  },

  // Type resolvers (field resolvers)
  User: userResolvers.User,
  Project: projectResolvers.Project,
  Document: documentResolvers.Document,
  
  // Add Subscription resolvers if available
  ...(translationResolvers.Subscription ? { Subscription: translationResolvers.Subscription } : {})
};

module.exports = resolvers;