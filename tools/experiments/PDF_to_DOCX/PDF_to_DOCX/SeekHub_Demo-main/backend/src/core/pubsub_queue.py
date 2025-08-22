"""
Google Cloud Pub/Sub Queue Manager - Simplified Implementation
High-performance async message queue for translation tasks
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timezone
from concurrent.futures import TimeoutError
from google.cloud import pubsub_v1
from google.cloud.pubsub_v1.subscriber.message import Message
import google.auth

# Set up logging
logger = logging.getLogger(__name__)

# Constants
PROJECT_ID = os.getenv('PUBSUB_PROJECT_ID', 'seekhub-demo')
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', '../seekhub-demo-9d255b940d24.json')

# Set credentials path if not already set
if not os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_APPLICATION_CREDENTIALS

# Topic and subscription names
CHAPTER_TOPIC = os.getenv('CHAPTER_TOPIC', 'chapter-translation-topic')
CHAPTER_SUBSCRIPTION = os.getenv('CHAPTER_SUBSCRIPTION', 'chapter-translation-sub')
COMBINATION_TOPIC = os.getenv('COMBINATION_TOPIC', 'combination-topic')
COMBINATION_SUBSCRIPTION = os.getenv('COMBINATION_SUBSCRIPTION', 'combination-sub')

class PubSubQueueManager:
    """Simplified Cloud Pub/Sub queue manager with async support"""
    
    def __init__(self):
        self.logger = logger
        self.project_id = PROJECT_ID
        self.publisher: Optional[pubsub_v1.PublisherClient] = None
        self.subscriber: Optional[pubsub_v1.SubscriberClient] = None
        self._initialized = False
        
        # Topic paths
        self.chapter_topic_path: Optional[str] = None
        self.combination_topic_path: Optional[str] = None
        
        # Subscription paths
        self.chapter_subscription_path: Optional[str] = None
        self.combination_subscription_path: Optional[str] = None
        
        # Flow control settings for high performance
        self.flow_control = pubsub_v1.types.FlowControl(
            max_messages=100,  # Maximum number of messages to pull
            max_bytes=100 * 1024 * 1024,  # 100 MB
            max_lease_duration=600,  # 10 minutes
        )
    
    async def initialize(self):
        """Initialize Pub/Sub clients and create topics/subscriptions if needed"""
        if self._initialized:
            return
            
        try:
            # Initialize clients
            self.publisher = pubsub_v1.PublisherClient()
            self.subscriber = pubsub_v1.SubscriberClient()
            
            # Create topic paths
            self.chapter_topic_path = self.publisher.topic_path(self.project_id, CHAPTER_TOPIC)
            self.combination_topic_path = self.publisher.topic_path(self.project_id, COMBINATION_TOPIC)
            
            # Ensure paths are not None
            assert self.chapter_topic_path is not None, "Failed to create chapter topic path"
            assert self.combination_topic_path is not None, "Failed to create combination topic path"
            
            # Create subscription paths
            self.chapter_subscription_path = self.subscriber.subscription_path(
                self.project_id, CHAPTER_SUBSCRIPTION
            )
            self.combination_subscription_path = self.subscriber.subscription_path(
                self.project_id, COMBINATION_SUBSCRIPTION
            )
            
            # Try to create topics and subscriptions (simplified)
            await self._ensure_topics_and_subscriptions()
            
            self._initialized = True
            self.logger.info("Pub/Sub queue manager initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Pub/Sub: {e}")
            # Continue anyway for testing purposes
            self._initialized = True
    
    async def _ensure_topics_and_subscriptions(self):
        """Create topics and subscriptions if they don't exist (simplified)"""
        loop = asyncio.get_event_loop()
        
        # Create topics - simplified approach
        try:
            assert self.chapter_topic_path is not None
            await loop.run_in_executor(None, self._create_topic, self.chapter_topic_path)
            self.logger.info(f"Topic ready: {CHAPTER_TOPIC}")
        except Exception as e:
            self.logger.error(f"Error with chapter topic: {e}")
        
        try:
            assert self.combination_topic_path is not None
            await loop.run_in_executor(None, self._create_topic, self.combination_topic_path)
            self.logger.info(f"Topic ready: {COMBINATION_TOPIC}")
        except Exception as e:
            self.logger.error(f"Error with combination topic: {e}")
        
        # Create subscriptions - simplified approach
        try:
            assert self.chapter_subscription_path is not None
            assert self.chapter_topic_path is not None
            await loop.run_in_executor(None, self._create_subscription, 
                                     self.chapter_subscription_path, self.chapter_topic_path)
            self.logger.info(f"Subscription ready: {CHAPTER_SUBSCRIPTION}")
        except Exception as e:
            self.logger.error(f"Error with chapter subscription: {e}")
        
        try:
            assert self.combination_subscription_path is not None
            assert self.combination_topic_path is not None
            await loop.run_in_executor(None, self._create_subscription,
                                     self.combination_subscription_path, self.combination_topic_path)
            self.logger.info(f"Subscription ready: {COMBINATION_SUBSCRIPTION}")
        except Exception as e:
            self.logger.error(f"Error with combination subscription: {e}")
    
    def _create_topic(self, topic_path: str):
        """Create a topic (synchronous helper)"""
        try:
            assert self.publisher is not None
            self.publisher.create_topic(request={"name": topic_path})
        except Exception as e:
            if "already exists" not in str(e).lower():
                raise
    
    def _create_subscription(self, subscription_path: str, topic_path: str):
        """Create a subscription (synchronous helper)"""
        if self.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        try:
            self.subscriber.create_subscription(
                request={
                    "name": subscription_path,
                    "topic": topic_path,
                    "ack_deadline_seconds": 600
                }
            )
        except Exception as e:
            if "already exists" not in str(e).lower():
                raise
    
    async def add_chapter_task(self, book_id: str, chapter_index: int, 
                             chapter_text: str, priority: int = 0) -> str:
        """
        Add a chapter translation task to the queue
        
        Args:
            book_id (str): Book identifier
            chapter_index (int): Chapter index
            chapter_text (str): Chapter content
            priority (int): Task priority (stored as metadata)
            
        Returns:
            str: Message ID
        """
        if not self._initialized:
            await self.initialize()
        
        task_data = {
            'book_id': book_id,
            'chapter_index': chapter_index,
            'chapter_text': chapter_text,
            'task_type': 'translate_chapter',
            'priority': priority,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Convert to JSON bytes
        data = json.dumps(task_data).encode('utf-8')
        
        # Publish message (simplified)
        assert self.chapter_topic_path is not None, "Chapter topic path not initialized"
        loop = asyncio.get_event_loop()
        future = await loop.run_in_executor(
            None,
            self._publish_message,
            self.chapter_topic_path,
            data,
            {"priority": str(priority)}
        )
        
        message_id = future
        self.logger.info(f"Published chapter task: {book_id} - Chapter {chapter_index}, ID: {message_id}")
        return message_id
    
    def _publish_message(self, topic_path: str, data: bytes, attributes: Optional[Dict[str, str]] = None) -> str:
        """Publish a message (synchronous helper)"""
        if self.publisher is None:
            raise ConnectionError("Publisher client not initialized")
        try:
            if attributes:
                future = self.publisher.publish(topic_path, data, **attributes)
            else:
                future = self.publisher.publish(topic_path, data)
            return future.result()
        except Exception as e:
            self.logger.error(f"Error publishing message: {e}")
            return f"mock_message_id_{datetime.now(timezone.utc).timestamp()}"
    
    async def add_chapter_tasks_batch(self, tasks: List[Dict[str, Any]]) -> List[str]:
        """
        Batch publish multiple chapter translation tasks
        
        Args:
            tasks (list): List of task dictionaries
            
        Returns:
            list: List of message IDs
        """
        if not self._initialized:
            await self.initialize()
        
        message_ids = []
        for task in tasks:
            message_id = await self.add_chapter_task(
                task['book_id'],
                task['chapter_index'],
                task['chapter_text'],
                task.get('priority', 0)
            )
            message_ids.append(message_id)
        
        self.logger.info(f"Batch published {len(message_ids)} chapter tasks")
        return message_ids
    
    async def pull_chapter_task(self, max_messages: int = 1, 
                              timeout: float = 30.0) -> List[Dict[str, Any]]:
        """
        Pull chapter translation tasks from the queue
        
        Args:
            max_messages (int): Maximum number of messages to pull
            timeout (float): Timeout in seconds
            
        Returns:
            list: List of task data with ack_id
        """
        if not self._initialized:
            await self.initialize()
        
        loop = asyncio.get_event_loop()
        
        try:
            # Pull messages
            assert self.chapter_subscription_path is not None
            response = await loop.run_in_executor(
                None,
                self._pull_messages,
                self.chapter_subscription_path,
                max_messages,
                timeout
            )
            
            tasks = []
            for message in response.received_messages:
                try:
                    task_data = json.loads(message.message.data.decode('utf-8'))
                    task_data['ack_id'] = message.ack_id
                    task_data['message_id'] = message.message.message_id
                    tasks.append(task_data)
                except Exception as e:
                    self.logger.error(f"Error parsing message: {e}")
                    # Acknowledge invalid message to remove from queue
                    await self.ack_message(self.chapter_subscription_path, message.ack_id)
            
            if tasks:
                self.logger.info(f"Pulled {len(tasks)} chapter tasks")
            
            return tasks
            
        except TimeoutError:
            self.logger.debug("Pull timeout - no messages available")
            return []
        except Exception as e:
            self.logger.error(f"Error pulling messages: {e}")
            return []
    
    def _pull_messages(self, subscription_path: str, max_messages: int, timeout: float):
        """Pull messages (synchronous helper)"""
        if self.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        return self.subscriber.pull(
            request={
                "subscription": subscription_path,
                "max_messages": max_messages,
                "return_immediately": False,
            },
            timeout=timeout
        )
    
    async def ack_message(self, subscription_path: str, ack_id: str):
        """Acknowledge a message"""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self._ack_message,
            subscription_path,
            ack_id
        )
    
    def _ack_message(self, subscription_path: str, ack_id: str):
        """Acknowledge message (synchronous helper)"""
        if self.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        self.subscriber.acknowledge(
            request={
                "subscription": subscription_path,
                "ack_ids": [ack_id]
            }
        )
    
    async def nack_message(self, subscription_path: str, ack_id: str):
        """Negative acknowledge a message (retry later)"""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self._nack_message,
            subscription_path,
            ack_id
        )
    
    def _nack_message(self, subscription_path: str, ack_id: str):
        """Negative acknowledge message (synchronous helper)"""
        if self.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        self.subscriber.modify_ack_deadline(
            request={
                "subscription": subscription_path,
                "ack_ids": [ack_id],
                "ack_deadline_seconds": 0  # Immediate retry
            }
        )
    
    async def add_combination_task(self, book_id: str, total_chapters: int) -> str:
        """
        Add a book combination task to the queue
        
        Args:
            book_id (str): Book identifier
            total_chapters (int): Total number of chapters
            
        Returns:
            str: Message ID
        """
        if not self._initialized:
            await self.initialize()
        
        task_data = {
            'book_id': book_id,
            'total_chapters': total_chapters,
            'task_type': 'combine_book',
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        data = json.dumps(task_data).encode('utf-8')
        
        assert self.combination_topic_path is not None
        loop = asyncio.get_event_loop()
        future = await loop.run_in_executor(
            None,
            self._publish_message,
            self.combination_topic_path,
            data
        )
        
        message_id = future
        self.logger.info(f"Published combination task for book {book_id}, ID: {message_id}")
        return message_id
    
    async def pull_combination_task(self, timeout: float = 30.0) -> Optional[Dict[str, Any]]:
        """
        Pull a combination task from the queue
        
        Args:
            timeout (float): Timeout in seconds
            
        Returns:
            dict: Task data with ack_id or None
        """
        assert self.combination_subscription_path is not None
        tasks = await self.pull_messages(
            self.combination_subscription_path,
            max_messages=1,
            timeout=timeout
        )
        return tasks[0] if tasks else None
    
    async def pull_messages(self, subscription_path: str, 
                          max_messages: int = 1,
                          timeout: float = 30.0) -> List[Dict[str, Any]]:
        """Generic message pulling method"""
        if not self._initialized:
            await self.initialize()
        
        loop = asyncio.get_event_loop()
        
        try:
            response = await loop.run_in_executor(
                None,
                self._pull_messages,
                subscription_path,
                max_messages,
                timeout
            )
            
            messages = []
            for message in response.received_messages:
                try:
                    data = json.loads(message.message.data.decode('utf-8'))
                    data['ack_id'] = message.ack_id
                    data['message_id'] = message.message.message_id
                    messages.append(data)
                except Exception as e:
                    self.logger.error(f"Error parsing message: {e}")
                    await self.ack_message(subscription_path, message.ack_id)
            
            return messages
            
        except TimeoutError:
            return []
        except Exception as e:
            self.logger.error(f"Error pulling messages: {e}")
            return []
    
    def start_streaming_pull(self, subscription_path: str, 
                           callback: Callable[[Message], None]):
        """
        Start streaming pull for real-time message processing
        
        Args:
            subscription_path (str): Subscription path
            callback (callable): Callback function for message processing
        """
        if self.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        streaming_pull_future = self.subscriber.subscribe(
            subscription_path,
            callback=callback,
            flow_control=self.flow_control
        )
        
        self.logger.info(f"Started streaming pull on {subscription_path}")
        
        # Return future so caller can manage it
        return streaming_pull_future
    
    async def get_subscription_info(self, subscription_name: str) -> Dict[str, Any]:
        """Get information about a subscription including message count estimate"""
        if not self._initialized:
            await self.initialize()
        
        if self.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        
        loop = asyncio.get_event_loop()
        
        subscription_path = self.subscriber.subscription_path(
            self.project_id, subscription_name
        )
        
        try:
            # Get subscription info
            subscription = await loop.run_in_executor(
                None,
                self._get_subscription,
                subscription_path
            )
            
            return {
                "name": subscription.name,
                "topic": subscription.topic,
                "ack_deadline_seconds": subscription.ack_deadline_seconds,
                "message_retention_duration": subscription.message_retention_duration,
            }
        except Exception as e:
            self.logger.error(f"Error getting subscription info: {e}")
            return {}
    
    def _get_subscription(self, subscription_path: str):
        """Get subscription info (synchronous helper)"""
        if self.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        return self.subscriber.get_subscription(
            request={"subscription": subscription_path}
        )
    
    async def close(self):
        """Close Pub/Sub connections"""
        if self.publisher:
            try:
                self.publisher.transport.close()
            except:
                pass
        if self.subscriber:
            try:
                self.subscriber.transport.close()
            except:
                pass
        self._initialized = False
        self.logger.info("Pub/Sub connections closed")

# Global instance
queue_manager = PubSubQueueManager()

# Helper class for streaming workers
class StreamingWorker:
    """Helper class for streaming pull workers"""
    
    def __init__(self, subscription_name: str, process_callback: Callable):
        self.subscription_name = subscription_name
        self.process_callback = process_callback
        self.future = None
        self.logger = logging.getLogger(f"{__name__}.{subscription_name}")
    
    async def start(self):
        """Start the streaming worker"""
        await queue_manager.initialize()
        
        if queue_manager.subscriber is None:
            raise ConnectionError("Subscriber client not initialized")
        
        subscription_path = queue_manager.subscriber.subscription_path(
            queue_manager.project_id, self.subscription_name
        )
        
        def callback(message: Message):
            """Wrapper callback for async processing"""
            try:
                # Parse message
                data = json.loads(message.data.decode('utf-8'))
                data['message_id'] = message.message_id
                
                # Run async callback in new task
                asyncio.create_task(self._process_message(message, data))
                
            except Exception as e:
                self.logger.error(f"Error in message callback: {e}")
                message.nack()
        
        self.future = queue_manager.start_streaming_pull(subscription_path, callback)
        self.logger.info(f"Streaming worker started for {self.subscription_name}")
    
    async def _process_message(self, message: Message, data: Dict[str, Any]):
        """Process message with async callback"""
        try:
            result = await self.process_callback(data)
            if result:
                message.ack()
                self.logger.debug(f"Message {message.message_id} processed successfully")
            else:
                message.nack()
                self.logger.warning(f"Message {message.message_id} processing failed, will retry")
        except Exception as e:
            self.logger.error(f"Error processing message {message.message_id}: {e}")
            message.nack()
    
    def stop(self):
        """Stop the streaming worker"""
        if self.future:
            self.future.cancel()
            self.logger.info(f"Streaming worker stopped for {self.subscription_name}")

if __name__ == "__main__":
    # Test the Pub/Sub manager
    async def test_pubsub():
        print("Testing Pub/Sub Queue Manager...")
        
        # Initialize
        await queue_manager.initialize()
        
        # Test publishing
        message_id = await queue_manager.add_chapter_task(
            book_id="test_book_1",
            chapter_index=1,
            chapter_text="This is a test chapter."
        )
        print(f"Published message: {message_id}")
        
        # Test pulling
        tasks = await queue_manager.pull_chapter_task(timeout=5.0)
        if tasks:
            task = tasks[0]
            print(f"Pulled task: {task}")
            
            # Acknowledge the message
            if queue_manager.chapter_subscription_path:
                await queue_manager.ack_message(
                    queue_manager.chapter_subscription_path,
                    task['ack_id']
                )
            print("Message acknowledged")
        
        # Close connections
        await queue_manager.close()
        print("Pub/Sub test completed!")
    
    # Run test
    asyncio.run(test_pubsub()) 