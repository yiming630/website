const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
const { query } = require('../../../databases/connection');
const { PubSub, withFilter } = require('graphql-subscriptions');
const ChatMessage = require('../../../shared/models/ChatMessage');
const Document = require('../../../shared/models/Document');
const { requireAuth } = require('../middleware/auth');

const pubsub = new PubSub();

const chatResolvers = {
  Query: {
    chatHistory: async (_, { documentId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check access to document
      const docResult = await query(
        `SELECT d.id FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.id = $1 AND (d.owner_id = $2 OR dc.user_id = $2)`,
        [documentId, user.id]
      );
      
      if (docResult.rows.length === 0) {
        throw new ForbiddenError('Document not found or access denied');
      }
      
      const result = await query(
        'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC',
        [documentId]
      );
      
      return result.rows;
    }
  },

  Mutation: {
    sendChatMessage: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const { documentId, content, selectedText, messageType } = input;
      
      // Check access to document
      const docResult = await query(
        `SELECT d.id FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.id = $1 AND (d.owner_id = $2 OR dc.user_id = $2)`,
        [documentId, user.id]
      );
      
      if (docResult.rows.length === 0) {
        throw new ForbiddenError('Document not found or access denied');
      }
      
      // Save user message
      const userMessageResult = await query(
        `INSERT INTO chat_messages (document_id, content, author, message_type, selected_text) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [documentId, content, 'USER', messageType, selectedText]
      );
      
      const userMessage = userMessageResult.rows[0];
      
      // Publish new message
      pubsub.publish('NEW_CHAT_MESSAGE', {
        newChatMessage: userMessage,
        documentId
      });
      
      // TODO: Generate AI response
      // For now, we'll create a simple echo response
      if (messageType === 'translation_help' || messageType === 'question') {
        setTimeout(async () => {
          const aiResponse = `I understand you're asking about: "${content}". This is a placeholder AI response. The actual AI integration will be implemented later.`;
          
          const aiMessageResult = await query(
            `INSERT INTO chat_messages (document_id, content, author, message_type) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [documentId, aiResponse, 'AI', 'response']
          );
          
          const aiMessage = aiMessageResult.rows[0];
          
          // Publish AI response
          pubsub.publish('NEW_CHAT_MESSAGE', {
            newChatMessage: aiMessage,
            documentId
          });
        }, 1000); // Simulate AI thinking time
      }
      
      return userMessage;
    },

    clearChatHistory: async (_, { documentId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check if user owns the document
      const docResult = await query(
        'SELECT owner_id FROM documents WHERE id = $1',
        [documentId]
      );
      
      if (docResult.rows.length === 0) {
        throw new ForbiddenError('Document not found');
      }
      
      if (docResult.rows[0].owner_id !== user.id) {
        throw new ForbiddenError('Only document owner can clear chat history');
      }
      
      await query(
        'DELETE FROM chat_messages WHERE document_id = $1',
        [documentId]
      );
      
      return true;
    }
  },

  Subscription: {
    newChatMessage: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['NEW_CHAT_MESSAGE']),
        (payload, variables) => {
          return payload.documentId === variables.documentId;
        }
      )
    }
  },

  ChatMessage: {
    position: (parent) => {
      return parent.position ? JSON.parse(parent.position) : null;
    }
  }
};

module.exports = chatResolvers;