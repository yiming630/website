"""
PostgreSQL Queue System
使用PostgreSQL作为消息队列，替代Google Pub/Sub
适用于中国网络环境，无需外部依赖
"""

import os
import json
import asyncio
import logging
import psycopg2
import psycopg2.pool
from typing import Dict, List, Optional, Any, Callable, Union
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import threading
import time

# Set up logging
logger = logging.getLogger(__name__)

class PostgreSQLQueue:
    """使用PostgreSQL作为消息队列"""
    
    def __init__(self):
        # Database configuration
        self.db_config = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', '5432')),
            'database': os.getenv('POSTGRES_DB', 'seekhub_database'),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password')
        }
        
        # Connection pool
        self.pool = None
        self._initialized = False
        self._polling_threads = {}
        self._shutdown = False
        
        logger.info("PostgreSQL Queue initialized")
    
    def initialize(self):
        """初始化数据库连接池和队列表"""
        if self._initialized:
            return
            
        try:
            # Create connection pool
            self.pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                **self.db_config
            )
            
            # Create queue tables
            self._create_queue_tables()
            
            self._initialized = True
            logger.info("PostgreSQL Queue initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL Queue: {e}")
            raise
    
    def _create_queue_tables(self):
        """创建队列相关的数据库表"""
        create_tables_sql = """
        -- 创建队列表
        CREATE TABLE IF NOT EXISTS message_queue (
            id BIGSERIAL PRIMARY KEY,
            topic VARCHAR(255) NOT NULL,
            message_id VARCHAR(255) UNIQUE NOT NULL,
            payload JSONB NOT NULL,
            priority INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'pending',
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            visibility_timeout TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP WITH TIME ZONE
        );
        
        -- 创建索引以优化查询性能
        CREATE INDEX IF NOT EXISTS idx_message_queue_topic_status 
        ON message_queue (topic, status);
        
        CREATE INDEX IF NOT EXISTS idx_message_queue_priority_scheduled 
        ON message_queue (priority DESC, scheduled_at ASC) 
        WHERE status = 'pending';
        
        CREATE INDEX IF NOT EXISTS idx_message_queue_visibility_timeout 
        ON message_queue (visibility_timeout) 
        WHERE status = 'processing';
        
        -- 创建订阅者表
        CREATE TABLE IF NOT EXISTS queue_subscriptions (
            id BIGSERIAL PRIMARY KEY,
            topic VARCHAR(255) NOT NULL,
            subscriber_id VARCHAR(255) NOT NULL,
            last_poll_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(topic, subscriber_id)
        );
        
        -- 创建死信队列表
        CREATE TABLE IF NOT EXISTS dead_letter_queue (
            id BIGSERIAL PRIMARY KEY,
            original_message_id VARCHAR(255) NOT NULL,
            topic VARCHAR(255) NOT NULL,
            payload JSONB NOT NULL,
            failure_reason TEXT,
            retry_count INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 创建更新时间触发器
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_message_queue_updated_at ON message_queue;
        CREATE TRIGGER update_message_queue_updated_at 
        BEFORE UPDATE ON message_queue 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(create_tables_sql)
                conn.commit()
                logger.info("Queue tables created successfully")
            finally:
                self.pool.putconn(conn)
    
    def publish(self, topic: str, message: Dict[str, Any], 
                priority: int = 0, delay_seconds: int = 0, 
                max_retries: int = 3) -> str:
        """发布消息到队列
        
        Args:
            topic: 消息主题
            message: 消息内容
            priority: 优先级 (数值越大优先级越高)
            delay_seconds: 延迟发送秒数
            max_retries: 最大重试次数
            
        Returns:
            str: 消息ID
        """
        if not self._initialized:
            self.initialize()
            
        message_id = f"{topic}_{int(time.time() * 1000000)}_{id(message)}"
        scheduled_at = datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)
        
        insert_sql = """
        INSERT INTO message_queue 
        (topic, message_id, payload, priority, scheduled_at, max_retries)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(insert_sql, (
                        topic, message_id, json.dumps(message), 
                        priority, scheduled_at, max_retries
                    ))
                    conn.commit()
                    
                logger.debug(f"Published message {message_id} to topic {topic}")
                return message_id
                
            except Exception as e:
                logger.error(f"Error publishing message: {e}")
                conn.rollback()
                raise
            finally:
                self.pool.putconn(conn)
    
    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], bool], 
                 subscriber_id: str = None, max_messages: int = 1,
                 visibility_timeout: int = 300, poll_interval: int = 5):
        """订阅主题消息
        
        Args:
            topic: 消息主题
            callback: 消息处理回调函数，返回True表示处理成功
            subscriber_id: 订阅者ID
            max_messages: 每次拉取的最大消息数
            visibility_timeout: 消息可见性超时时间（秒）
            poll_interval: 轮询间隔（秒）
        """
        if not self._initialized:
            self.initialize()
            
        if subscriber_id is None:
            subscriber_id = f"{topic}_subscriber_{int(time.time())}"
        
        # 注册订阅者
        self._register_subscriber(topic, subscriber_id)
        
        # 启动轮询线程
        thread_key = f"{topic}_{subscriber_id}"
        if thread_key in self._polling_threads:
            logger.warning(f"Subscription already exists for {thread_key}")
            return
        
        def polling_worker():
            """轮询工作线程"""
            logger.info(f"Started polling worker for topic {topic}")
            
            while not self._shutdown:
                try:
                    messages = self._pull_messages(
                        topic, max_messages, visibility_timeout
                    )
                    
                    for message in messages:
                        try:
                            # 调用回调函数处理消息
                            success = callback(message['payload'])
                            
                            if success:
                                self._acknowledge_message(message['message_id'])
                                logger.debug(f"Message {message['message_id']} processed successfully")
                            else:
                                self._nack_message(message['message_id'])
                                logger.warning(f"Message {message['message_id']} processing failed")
                                
                        except Exception as e:
                            logger.error(f"Error processing message {message['message_id']}: {e}")
                            self._nack_message(message['message_id'])
                    
                    # 更新订阅者最后轮询时间
                    self._update_subscriber_poll_time(topic, subscriber_id)
                    
                    # 等待下次轮询
                    if not messages:  # 没有消息时等待更长时间
                        time.sleep(poll_interval)
                    else:
                        time.sleep(0.1)  # 有消息时快速轮询
                        
                except Exception as e:
                    logger.error(f"Error in polling worker: {e}")
                    time.sleep(poll_interval)
            
            logger.info(f"Polling worker stopped for topic {topic}")
        
        # 启动后台线程
        thread = threading.Thread(target=polling_worker, daemon=True)
        thread.start()
        
        self._polling_threads[thread_key] = {
            'thread': thread,
            'topic': topic,
            'subscriber_id': subscriber_id
        }
        
        logger.info(f"Subscribed to topic {topic} with subscriber {subscriber_id}")
    
    def _register_subscriber(self, topic: str, subscriber_id: str):
        """注册订阅者"""
        insert_sql = """
        INSERT INTO queue_subscriptions (topic, subscriber_id)
        VALUES (%s, %s)
        ON CONFLICT (topic, subscriber_id) 
        DO UPDATE SET 
            last_poll_at = CURRENT_TIMESTAMP,
            is_active = TRUE
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(insert_sql, (topic, subscriber_id))
                conn.commit()
            finally:
                self.pool.putconn(conn)
    
    def _pull_messages(self, topic: str, max_messages: int, 
                      visibility_timeout: int) -> List[Dict[str, Any]]:
        """拉取消息"""
        # 设置可见性超时时间
        timeout_time = datetime.now(timezone.utc) + timedelta(seconds=visibility_timeout)
        
        select_sql = """
        UPDATE message_queue 
        SET status = 'processing', 
            visibility_timeout = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (
            SELECT id FROM message_queue
            WHERE topic = %s 
            AND status = 'pending'
            AND scheduled_at <= CURRENT_TIMESTAMP
            ORDER BY priority DESC, scheduled_at ASC
            LIMIT %s
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, message_id, payload, priority, retry_count, created_at
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(select_sql, (timeout_time, topic, max_messages))
                    rows = cursor.fetchall()
                    conn.commit()
                    
                    messages = []
                    for row in rows:
                        messages.append({
                            'id': row[0],
                            'message_id': row[1],
                            'payload': row[2],
                            'priority': row[3],
                            'retry_count': row[4],
                            'created_at': row[5]
                        })
                    
                    return messages
                    
            except Exception as e:
                logger.error(f"Error pulling messages: {e}")
                conn.rollback()
                return []
            finally:
                self.pool.putconn(conn)
    
    def _acknowledge_message(self, message_id: str):
        """确认消息处理完成"""
        update_sql = """
        UPDATE message_queue 
        SET status = 'completed', 
            processed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE message_id = %s
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(update_sql, (message_id,))
                conn.commit()
            finally:
                self.pool.putconn(conn)
    
    def _nack_message(self, message_id: str):
        """消息处理失败，重新入队或移入死信队列"""
        # 获取消息信息
        select_sql = """
        SELECT id, topic, payload, retry_count, max_retries 
        FROM message_queue 
        WHERE message_id = %s
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(select_sql, (message_id,))
                    row = cursor.fetchone()
                    
                    if not row:
                        return
                    
                    msg_id, topic, payload, retry_count, max_retries = row
                    
                    if retry_count >= max_retries:
                        # 移入死信队列
                        dead_letter_sql = """
                        INSERT INTO dead_letter_queue 
                        (original_message_id, topic, payload, failure_reason, retry_count)
                        VALUES (%s, %s, %s, %s, %s)
                        """
                        cursor.execute(dead_letter_sql, (
                            message_id, topic, json.dumps(payload), 
                            'Max retries exceeded', retry_count
                        ))
                        
                        # 删除原消息
                        cursor.execute(
                            "UPDATE message_queue SET status = 'failed' WHERE message_id = %s", 
                            (message_id,)
                        )
                        
                        logger.warning(f"Message {message_id} moved to dead letter queue")
                    else:
                        # 重新入队，增加重试计数
                        retry_delay = min(300, 2 ** retry_count)  # 指数退避，最大5分钟
                        scheduled_at = datetime.now(timezone.utc) + timedelta(seconds=retry_delay)
                        
                        update_sql = """
                        UPDATE message_queue 
                        SET status = 'pending', 
                            retry_count = retry_count + 1,
                            scheduled_at = %s,
                            visibility_timeout = NULL,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE message_id = %s
                        """
                        cursor.execute(update_sql, (scheduled_at, message_id))
                        
                        logger.info(f"Message {message_id} requeued for retry {retry_count + 1}")
                
                conn.commit()
                
            except Exception as e:
                logger.error(f"Error handling nack for message {message_id}: {e}")
                conn.rollback()
            finally:
                self.pool.putconn(conn)
    
    def _update_subscriber_poll_time(self, topic: str, subscriber_id: str):
        """更新订阅者轮询时间"""
        update_sql = """
        UPDATE queue_subscriptions 
        SET last_poll_at = CURRENT_TIMESTAMP 
        WHERE topic = %s AND subscriber_id = %s
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(update_sql, (topic, subscriber_id))
                conn.commit()
            except Exception as e:
                logger.error(f"Error updating subscriber poll time: {e}")
            finally:
                self.pool.putconn(conn)
    
    def get_queue_stats(self, topic: str = None) -> Dict[str, Any]:
        """获取队列统计信息"""
        if not self._initialized:
            self.initialize()
        
        where_clause = "WHERE topic = %s" if topic else ""
        params = [topic] if topic else []
        
        stats_sql = f"""
        SELECT 
            topic,
            COUNT(*) as total_messages,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_messages,
            COUNT(*) FILTER (WHERE status = 'processing') as processing_messages,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_messages,
            COUNT(*) FILTER (WHERE status = 'failed') as failed_messages,
            AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
        FROM message_queue 
        {where_clause}
        GROUP BY topic
        ORDER BY topic
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(stats_sql, params)
                    rows = cursor.fetchall()
                    
                    if topic:
                        # 返回单个主题的统计
                        if rows:
                            row = rows[0]
                            return {
                                'topic': row[0],
                                'total_messages': row[1],
                                'pending_messages': row[2],
                                'processing_messages': row[3],
                                'completed_messages': row[4],
                                'failed_messages': row[5],
                                'avg_processing_time_seconds': float(row[6]) if row[6] else 0
                            }
                        else:
                            return {'topic': topic, 'total_messages': 0}
                    else:
                        # 返回所有主题的统计
                        stats = {}
                        for row in rows:
                            stats[row[0]] = {
                                'total_messages': row[1],
                                'pending_messages': row[2],
                                'processing_messages': row[3],
                                'completed_messages': row[4],
                                'failed_messages': row[5],
                                'avg_processing_time_seconds': float(row[6]) if row[6] else 0
                            }
                        return stats
                        
            except Exception as e:
                logger.error(f"Error getting queue stats: {e}")
                return {}
            finally:
                self.pool.putconn(conn)
    
    def cleanup_old_messages(self, days: int = 7):
        """清理旧消息"""
        if not self._initialized:
            self.initialize()
            
        cleanup_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        cleanup_sql = """
        DELETE FROM message_queue 
        WHERE (status = 'completed' OR status = 'failed')
        AND updated_at < %s
        """
        
        with self.pool.getconn() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(cleanup_sql, (cleanup_date,))
                    deleted_count = cursor.rowcount
                    conn.commit()
                    
                logger.info(f"Cleaned up {deleted_count} old messages")
                return deleted_count
                
            except Exception as e:
                logger.error(f"Error cleaning up old messages: {e}")
                conn.rollback()
                return 0
            finally:
                self.pool.putconn(conn)
    
    def close(self):
        """关闭队列连接"""
        self._shutdown = True
        
        # 等待所有轮询线程结束
        for thread_key, thread_info in self._polling_threads.items():
            thread_info['thread'].join(timeout=5.0)
        
        self._polling_threads.clear()
        
        if self.pool:
            self.pool.closeall()
            
        logger.info("PostgreSQL Queue connections closed")

# 全局队列实例
postgres_queue = PostgreSQLQueue()