const { query } = require('../utils/database');

const chatResolvers = {
  Query: {
    // Get chat history for a document
    chatHistory: async (parent, { documentId }, context) => {
      const user = context.requireAuth();

      try {
        // Verify user has access to the document
        const docResult = await query(
          'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
          [documentId, user.id]
        );

        if (docResult.rows.length === 0) {
          throw new Error('Document not found or access denied');
        }

        // Get chat messages
        const result = await query(
          'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC',
          [documentId]
        );

        return result.rows;
      } catch (error) {
        console.error('Error fetching chat history:', error);
        throw new Error('Failed to fetch chat history');
      }
    }
  },

  Mutation: {
    // Send a chat message
    sendChatMessage: async (parent, { input }, context) => {
      const user = context.requireAuth();

      try {
        // Verify user has access to the document
        const docResult = await query(
          'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
          [input.documentId, user.id]
        );

        if (docResult.rows.length === 0) {
          throw new Error('Document not found or access denied');
        }

        // Insert chat message
        const result = await query(
          `INSERT INTO chat_messages (
            document_id, content, author, message_type, selected_text, position
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            input.documentId,
            input.content,
            'USER', // For now, all messages from GraphQL are user messages
            input.messageType || 'text',
            input.selectedText || null,
            input.position ? JSON.stringify(input.position) : null
          ]
        );

        const message = result.rows[0];

        // TODO: Here you would typically:
        // 1. Call AI service to get response
        // 2. Store AI response as another message
        // 3. Emit via subscription

        return message;
      } catch (error) {
        console.error('Error sending chat message:', error);
        throw new Error('Failed to send chat message');
      }
    },

    // Clear chat history for a document
    clearChatHistory: async (parent, { documentId }, context) => {
      const user = context.requireAuth();

      try {
        // Verify user has access to the document
        const docResult = await query(
          'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
          [documentId, user.id]
        );

        if (docResult.rows.length === 0) {
          throw new Error('Document not found or access denied');
        }

        // Delete all chat messages for the document
        await query(
          'DELETE FROM chat_messages WHERE document_id = $1',
          [documentId]
        );

        return true;
      } catch (error) {
        console.error('Error clearing chat history:', error);
        throw new Error('Failed to clear chat history');
      }
    }
  },

  Subscription: {
    // New chat message subscription (placeholder)
    newChatMessage: {
      subscribe: (parent, { documentId }, context) => {
        // This would typically use a pubsub mechanism
        console.log(`Subscribing to chat messages for document: ${documentId}`);
        return null;
      }
    }
  },

  // ChatMessage type resolvers
  ChatMessage: {
    // Parse position JSON
    position: (message) => {
      try {
        return message.position || null;
      } catch (error) {
        return null;
      }
    }
  }
};

module.exports = chatResolvers;