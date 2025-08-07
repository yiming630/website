const { query } = require('../../databases/connection');
const { v4: uuidv4 } = require('uuid');

class ChatMessage {
  constructor(data) {
    this.id = data.id;
    this.documentId = data.document_id;
    this.content = data.content;
    this.author = data.author;
    this.messageType = data.message_type;
    this.selectedText = data.selected_text;
    this.position = data.position;
    this.createdAt = data.created_at;
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM chat_messages WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new ChatMessage(result.rows[0]);
    } catch (error) {
      console.error('Error finding chat message by ID:', error);
      throw new Error('Database error while finding chat message');
    }
  }

  static async findByDocumentId(documentId, limit = 50) {
    try {
      const result = await query(
        'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC LIMIT $2',
        [documentId, limit]
      );

      return result.rows.map(row => new ChatMessage(row));
    } catch (error) {
      console.error('Error finding chat messages by document ID:', error);
      throw new Error('Database error while finding chat messages');
    }
  }

  static async create(messageData) {
    try {
      const {
        documentId,
        content,
        author,
        messageType = 'text',
        selectedText = null,
        position = null
      } = messageData;

      const result = await query(
        `INSERT INTO chat_messages (document_id, content, author, message_type, selected_text, position)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          documentId,
          content,
          author,
          messageType,
          selectedText,
          position ? JSON.stringify(position) : null
        ]
      );

      return new ChatMessage(result.rows[0]);
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw new Error('Database error while creating chat message');
    }
  }

  static async clearChatHistory(documentId, userId) {
    try {
      // First check if user has access to the document
      const accessCheck = await query(
        `SELECT 1 FROM documents d
         WHERE d.id = $1 
         AND (d.owner_id = $2 
              OR d.id IN (
                SELECT dc.document_id FROM document_collaborators dc 
                WHERE dc.user_id = $2
              )
              OR d.project_id IN (
                SELECT p.id FROM projects p 
                WHERE p.owner_id = $2 
                OR p.id IN (
                  SELECT pc.project_id FROM project_collaborators pc 
                  WHERE pc.user_id = $2
                )
              ))`,
        [documentId, userId]
      );

      if (accessCheck.rows.length === 0) {
        throw new Error('Access denied');
      }

      const result = await query(
        'DELETE FROM chat_messages WHERE document_id = $1',
        [documentId]
      );

      return result.rowCount;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error('Database error while clearing chat history');
    }
  }

  static async getLatestMessages(documentId, limit = 10) {
    try {
      const result = await query(
        'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at DESC LIMIT $2',
        [documentId, limit]
      );

      return result.rows.map(row => new ChatMessage(row)).reverse();
    } catch (error) {
      console.error('Error getting latest chat messages:', error);
      throw new Error('Database error while getting latest messages');
    }
  }

  static async getMessagesByType(documentId, messageType) {
    try {
      const result = await query(
        'SELECT * FROM chat_messages WHERE document_id = $1 AND message_type = $2 ORDER BY created_at ASC',
        [documentId, messageType]
      );

      return result.rows.map(row => new ChatMessage(row));
    } catch (error) {
      console.error('Error getting messages by type:', error);
      throw new Error('Database error while getting messages by type');
    }
  }

  async delete() {
    try {
      const result = await query(
        'DELETE FROM chat_messages WHERE id = $1 RETURNING id',
        [this.id]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting chat message:', error);
      throw new Error('Database error while deleting chat message');
    }
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      author: this.author,
      messageType: this.messageType,
      selectedText: this.selectedText,
      position: this.position,
      createdAt: this.createdAt
    };
  }
}

module.exports = ChatMessage;
