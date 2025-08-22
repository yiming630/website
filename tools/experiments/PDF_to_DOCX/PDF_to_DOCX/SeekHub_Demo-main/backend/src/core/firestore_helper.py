"""
Google Firestore Database Helper Module
Provides async functions for database operations using Google Firestore
"""

import os
import asyncio
import logging
from typing import Dict, List, Optional, Any, AsyncIterator
from datetime import datetime, timezone
from google.cloud import firestore
from google.cloud.firestore_v1 import AsyncClient, AsyncTransaction
from google.cloud.firestore_v1.async_collection import AsyncCollectionReference
from google.cloud.firestore_v1.async_document import AsyncDocumentReference
from google.api_core import retry
import google.auth

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'seekhub-demo-9d255b940d24.json')
PROJECT_ID = os.getenv('FIRESTORE_PROJECT_ID', 'seekhub-demo')
DATABASE_ID = os.getenv('FIRESTORE_DATABASE_ID', '(default)')

# Set credentials path if not already set
if not os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_APPLICATION_CREDENTIALS

class FirestoreHelper:
    """Async helper class for Firestore operations with connection pooling"""
    
    def __init__(self):
        """Initialize Firestore with optimized settings"""
        self.client: Optional[AsyncClient] = None
        self.project_id = PROJECT_ID
        self.database_id = DATABASE_ID
        self._initialized = False
        
    async def connect(self) -> bool:
        """
        Establish async connection to Firestore
        
        Returns:
            bool: True if connection successful
        """
        try:
            if not self._initialized:
                # Create async client with connection pooling
                self.client = AsyncClient(
                    project=self.project_id,
                    database=self.database_id
                )
                self._initialized = True
                
                # Create indexes for better performance
                await self._ensure_indexes()
                
                logger.info(f"Connected to Firestore: {self.project_id}/{self.database_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Firestore: {e}")
            return False
    
    async def _ensure_connected(self):
        """Ensure Firestore connection is established"""
        if not self._initialized:
            await self.connect()
    
    async def _ensure_indexes(self):
        """Create composite indexes for optimized query performance"""
        try:
            # Note: Firestore indexes are typically created via Firebase Console or gcloud CLI
            # This is a placeholder for index creation logic
            logger.info("Firestore indexes should be configured via Firebase Console or gcloud CLI")
        except Exception as e:
            logger.warning(f"Could not ensure indexes: {e}")
    
    async def disconnect(self):
        """Close Firestore connection"""
        if self.client:
            # Firestore async client doesn't have explicit close method
            self._initialized = False
            logger.info("Firestore connection marked as closed")
    
    def get_collection(self, collection_name: str) -> AsyncCollectionReference:
        """
        Get a Firestore collection reference
        
        Args:
            collection_name (str): Name of the collection
            
        Returns:
            AsyncCollectionReference: The collection reference
        """
        if not self._initialized or self.client is None:
            raise ConnectionError("Not connected to Firestore. Call connect() first.")
        
        return self.client.collection(collection_name)
    
    async def insert_document(self, collection_name: str, document: Dict[str, Any], 
                            document_id: Optional[str] = None) -> str:
        """
        Insert a single document into a collection
        
        Args:
            collection_name (str): Name of the collection
            document (dict): Document to insert
            document_id (str): Optional document ID (auto-generated if not provided)
            
        Returns:
            str: The inserted document's ID
        """
        await self._ensure_connected()
            
        collection = self.get_collection(collection_name)
        
        # Add timestamp
        document['created_at'] = datetime.now(timezone.utc).isoformat()
        
        if document_id:
            doc_ref = collection.document(document_id)
            await doc_ref.set(document)
            doc_id = document_id
        else:
            doc_ref = await collection.add(document)
            doc_id = doc_ref[1].id
            
        logger.info(f"Document inserted into {collection_name}: {doc_id}")
        return doc_id
    
    async def insert_documents(self, collection_name: str, 
                             documents: List[Dict[str, Any]]) -> List[str]:
        """
        Insert multiple documents into a collection using batch write
        
        Args:
            collection_name (str): Name of the collection
            documents (list): List of documents to insert
            
        Returns:
            list: List of inserted document IDs
        """
        await self._ensure_connected()
            
        if self.client is None:
            raise ConnectionError("Failed to connect to Firestore")
            
        batch = self.client.batch()
        collection = self.get_collection(collection_name)
        doc_ids = []
        
        for doc in documents:
            doc_ref = collection.document()
            doc['created_at'] = datetime.now(timezone.utc).isoformat()
            batch.set(doc_ref, doc)
            doc_ids.append(doc_ref.id)
        
        await batch.commit()
        logger.info(f"{len(doc_ids)} documents inserted into {collection_name}")
        return doc_ids
    
    async def find_documents(self, collection_name: str, query: Optional[Dict[str, Any]] = None, 
                           limit: Optional[int] = None, order_by: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Find documents in a collection
        
        Args:
            collection_name (str): Name of the collection
            query (dict): Query filter (field: value pairs)
            limit (int): Maximum number of documents to return
            order_by (str): Field to order by
            
        Returns:
            list: List of matching documents
        """
        await self._ensure_connected()
            
        collection = self.get_collection(collection_name)
        query_ref = collection
        
        # Apply filters
        if query:
            for field, value in query.items():
                query_ref = query_ref.where(field, '==', value)
        
        # Apply ordering
        if order_by:
            query_ref = query_ref.order_by(order_by)
        
        # Apply limit
        if limit:
            query_ref = query_ref.limit(limit)
        
        # Execute query
        docs = []
        async for doc in query_ref.stream():
            doc_dict = doc.to_dict()
            if doc_dict is not None:
                doc_dict['id'] = doc.id
                docs.append(doc_dict)
        
        logger.info(f"Found {len(docs)} documents in {collection_name}")
        return docs
    
    async def find_one_document(self, collection_name: str, 
                              query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Find a single document in a collection
        
        Args:
            collection_name (str): Name of the collection
            query (dict): Query filter
            
        Returns:
            dict or None: The matching document or None if not found
        """
        docs = await self.find_documents(collection_name, query, limit=1)
        if docs:
            logger.info(f"Document found in {collection_name}")
            return docs[0]
        else:
            logger.info(f"No document found in {collection_name} with query: {query}")
            return None
    
    async def get_document_by_id(self, collection_name: str, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a document by its ID
        
        Args:
            collection_name (str): Name of the collection
            document_id (str): Document ID
            
        Returns:
            dict or None: The document or None if not found
        """
        await self._ensure_connected()
            
        doc_ref = self.get_collection(collection_name).document(document_id)
        doc = await doc_ref.get()
        
        if doc.exists:
            doc_dict = doc.to_dict()
            if doc_dict is not None:
                doc_dict['id'] = doc.id
                return doc_dict
        return None
    
    async def update_document(self, collection_name: str, document_id: str, 
                            update: Dict[str, Any]) -> bool:
        """
        Update a document by ID
        
        Args:
            collection_name (str): Name of the collection
            document_id (str): Document ID
            update (dict): Fields to update
            
        Returns:
            bool: True if updated successfully
        """
        await self._ensure_connected()
            
        doc_ref = self.get_collection(collection_name).document(document_id)
        update['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await doc_ref.update(update)
        logger.info(f"Updated document {document_id} in {collection_name}")
        return True
    
    async def delete_document(self, collection_name: str, document_id: str) -> bool:
        """
        Delete a document by ID
        
        Args:
            collection_name (str): Name of the collection
            document_id (str): Document ID
            
        Returns:
            bool: True if deleted successfully
        """
        await self._ensure_connected()
            
        doc_ref = self.get_collection(collection_name).document(document_id)
        await doc_ref.delete()
        logger.info(f"Deleted document {document_id} from {collection_name}")
        return True
    
    async def count_documents(self, collection_name: str, 
                            query: Optional[Dict[str, Any]] = None) -> int:
        """
        Count documents in a collection
        
        Args:
            collection_name (str): Name of the collection
            query (dict): Query filter
            
        Returns:
            int: Number of matching documents
        """
        # Note: Firestore doesn't have a direct count method
        # For large collections, consider using aggregation queries
        docs = await self.find_documents(collection_name, query)
        return len(docs)
    
    async def stream_collection(self, collection_name: str, 
                              batch_size: int = 100) -> AsyncIterator[List[Dict[str, Any]]]:
        """
        Stream documents from a collection in batches
        
        Args:
            collection_name (str): Name of the collection
            batch_size (int): Number of documents per batch
            
        Yields:
            List[Dict]: Batch of documents
        """
        await self._ensure_connected()
            
        collection = self.get_collection(collection_name)
        last_doc = None
        
        while True:
            query = collection.limit(batch_size)
            if last_doc:
                query = query.start_after(last_doc)
            
            batch = []
            async for doc in query.stream():
                doc_dict = doc.to_dict()
                if doc_dict is not None:
                    doc_dict['id'] = doc.id
                    batch.append(doc_dict)
                    last_doc = doc
            
            if not batch:
                break
                
            yield batch
            
            if len(batch) < batch_size:
                break

# Global instance for easy access
db_helper = FirestoreHelper()

# Context manager for automatic connection handling
class FirestoreContext:
    """Context manager for Firestore operations"""
    
    def __init__(self):
        self.helper = db_helper
    
    async def __aenter__(self):
        await self.helper.connect()
        return self.helper
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.helper.disconnect()

# Helper functions for common operations
async def save_book_data(title: str, author: str, content: str, language: str) -> str:
    """
    Save book data to Firestore
    
    Args:
        title (str): Book title
        author (str): Book author
        content (str): Book content
        language (str): Book language (en/zh)
        
    Returns:
        str: Document ID
    """
    book_data = {
        "title": title,
        "author": author,
        "content": content,
        "language": language,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    async with FirestoreContext() as db:
        return await db.insert_document("books", book_data)

async def save_translation_pair(english_text: str, chinese_text: str, 
                              source: str = "unknown") -> str:
    """
    Save translation pair to Firestore
    
    Args:
        english_text (str): English text
        chinese_text (str): Chinese text
        source (str): Source of the translation pair
        
    Returns:
        str: Document ID
    """
    translation_data = {
        "english_text": english_text,
        "chinese_text": chinese_text,
        "source": source,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    async with FirestoreContext() as db:
        return await db.insert_document("translation_pairs", translation_data)

async def update_book_status(book_id: str, status: str, **kwargs) -> bool:
    """
    Update book translation status
    
    Args:
        book_id (str): Book document ID
        status (str): New status
        **kwargs: Additional fields to update
        
    Returns:
        bool: True if updated successfully
    """
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    update_data.update(kwargs)
    
    async with FirestoreContext() as db:
        return await db.update_document("books", book_id, update_data)

if __name__ == "__main__":
    # Test the helper functions
    async def test_firestore():
        print("Testing Firestore Helper...")
        
        async with FirestoreContext() as db:
            # Test basic operations
            test_doc = {"test": "firestore_test", "timestamp": datetime.now(timezone.utc).isoformat()}
            doc_id = await db.insert_document("test_collection", test_doc)
            print(f"Inserted test document: {doc_id}")
            
            # Find the document
            found = await db.get_document_by_id("test_collection", doc_id)
            print(f"Found document: {found}")
            
            # Update the document
            await db.update_document("test_collection", doc_id, {"status": "updated"})
            print("Updated document")
            
            # Clean up
            await db.delete_document("test_collection", doc_id)
            print("Deleted document")
        
        print("Firestore Helper test completed!")
    
    # Run the test
    asyncio.run(test_firestore()) 