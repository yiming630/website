"""
Redis Queue System - Python Implementation
使用Redis和RQ作为消息队列，提供高性能的任务处理
适用于需要高并发处理的场景
"""

import os
import json
import logging
import redis
from rq import Queue, Worker, Connection, Job
from rq.exceptions import NoSuchJobError
from typing import Dict, List, Optional, Any, Callable, Union
from datetime import datetime, timedelta
import threading
import time

# Set up logging
logger = logging.getLogger(__name__)

class RedisQueue:
    """使用Redis作为消息队列"""
    
    def __init__(self):
        # Redis configuration
        self.redis_config = {
            'host': os.getenv('REDIS_HOST', 'localhost'),
            'port': int(os.getenv('REDIS_PORT', '6379')),
            'db': int(os.getenv('REDIS_DB', '0')),
            'password': os.getenv('REDIS_PASSWORD', None),
            'decode_responses': True
        }
        
        # Initialize Redis connection
        self.redis_client = None
        self.queues = {}
        self.workers = {}
        self._initialized = False
        
        logger.info("Redis Queue initialized")
    
    def initialize(self):
        """初始化Redis连接和队列"""
        if self._initialized:
            return
            
        try:
            # Create Redis connection
            self.redis_client = redis.Redis(**self.redis_config)
            
            # Test connection
            self.redis_client.ping()
            
            self._initialized = True
            logger.info("Redis Queue initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis Queue: {e}")
            raise
    
    def get_queue(self, topic: str) -> Queue:
        """获取或创建指定主题的队列"""
        if not self._initialized:
            self.initialize()
            
        if topic not in self.queues:
            self.queues[topic] = Queue(
                name=topic,
                connection=self.redis_client,
                default_timeout=300  # 5分钟超时
            )
            logger.info(f"Created queue for topic: {topic}")
            
        return self.queues[topic]
    
    def publish(self, topic: str, message: Dict[str, Any], 
                priority: int = 0, delay_seconds: int = 0) -> str:
        """发布消息到队列
        
        Args:
            topic: 消息主题
            message: 消息内容
            priority: 优先级 (暂时不支持，RQ按FIFO处理)
            delay_seconds: 延迟发送秒数
            
        Returns:
            str: 任务ID
        """
        if not self._initialized:
            self.initialize()
            
        queue = self.get_queue(topic)
        
        # 准备任务数据
        task_data = {
            'topic': topic,
            'payload': message,
            'priority': priority,
            'published_at': datetime.now().isoformat()
        }
        
        try:
            if delay_seconds > 0:
                # 延迟任务
                job = queue.enqueue_in(
                    timedelta(seconds=delay_seconds),
                    process_redis_task,
                    task_data,
                    job_timeout=300
                )
            else:
                # 立即任务
                job = queue.enqueue(
                    process_redis_task,
                    task_data,
                    job_timeout=300
                )
            
            logger.info(f"Published message to Redis queue {topic}: {job.id}")
            return job.id
            
        except Exception as e:
            logger.error(f"Error publishing message to Redis: {e}")
            raise
    
    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any], Dict[str, Any]], bool],
                 worker_name: str = None, burst: bool = False):
        """订阅主题消息
        
        Args:
            topic: 消息主题
            callback: 消息处理回调函数
            worker_name: 工作器名称
            burst: 是否为突发模式（处理完现有任务后停止）
        """
        if not self._initialized:
            self.initialize()
            
        if worker_name is None:
            worker_name = f"{topic}_worker_{int(time.time())}"
        
        queue = self.get_queue(topic)
        
        # 注册回调函数到全局处理器
        register_callback(topic, callback)
        
        # 创建工作器
        worker = Worker(
            [queue],
            connection=self.redis_client,
            name=worker_name
        )
        
        self.workers[f"{topic}_{worker_name}"] = worker
        
        # 启动工作器（在后台线程中）
        def start_worker():
            logger.info(f"Starting Redis worker for topic {topic}")
            try:
                worker.work(burst=burst)
            except Exception as e:
                logger.error(f"Error in Redis worker {worker_name}: {e}")
        
        worker_thread = threading.Thread(target=start_worker, daemon=True)
        worker_thread.start()
        
        logger.info(f"Subscribed to Redis queue topic {topic} with worker {worker_name}")
        
        return worker_name
    
    def get_queue_stats(self, topic: str = None) -> Dict[str, Any]:
        """获取队列统计信息"""
        if not self._initialized:
            self.initialize()
        
        if topic:
            # 单个队列统计
            queue = self.get_queue(topic)
            
            # 获取队列长度
            pending_count = len(queue)
            
            # 获取失败任务数
            failed_queue = Queue('failed', connection=self.redis_client)
            failed_jobs = failed_queue.get_jobs()
            topic_failed_count = sum(1 for job in failed_jobs 
                                   if job.meta.get('topic') == topic)
            
            return {
                'topic': topic,
                'pending_jobs': pending_count,
                'failed_jobs': topic_failed_count,
                'workers': len([w for k, w in self.workers.items() if k.startswith(topic)]),
                'total_jobs': pending_count + topic_failed_count
            }
        else:
            # 所有队列统计
            stats = {}
            for topic_name, queue in self.queues.items():
                pending_count = len(queue)
                failed_queue = Queue('failed', connection=self.redis_client)
                failed_jobs = failed_queue.get_jobs()
                topic_failed_count = sum(1 for job in failed_jobs 
                                       if job.meta.get('topic') == topic_name)
                
                stats[topic_name] = {
                    'pending_jobs': pending_count,
                    'failed_jobs': topic_failed_count,
                    'workers': len([w for k, w in self.workers.items() if k.startswith(topic_name)]),
                    'total_jobs': pending_count + topic_failed_count
                }
            
            return stats
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """获取任务状态"""
        if not self._initialized:
            self.initialize()
            
        try:
            job = Job.fetch(job_id, connection=self.redis_client)
            
            return {
                'job_id': job_id,
                'status': job.get_status(),
                'created_at': job.created_at.isoformat() if job.created_at else None,
                'started_at': job.started_at.isoformat() if job.started_at else None,
                'ended_at': job.ended_at.isoformat() if job.ended_at else None,
                'result': job.result,
                'exc_info': job.exc_info,
                'meta': job.meta
            }
            
        except NoSuchJobError:
            return {'job_id': job_id, 'status': 'not_found'}
        except Exception as e:
            logger.error(f"Error getting job status: {e}")
            return {'job_id': job_id, 'status': 'error', 'error': str(e)}
    
    def cancel_job(self, job_id: str) -> bool:
        """取消任务"""
        if not self._initialized:
            self.initialize()
            
        try:
            job = Job.fetch(job_id, connection=self.redis_client)
            job.cancel()
            logger.info(f"Cancelled job: {job_id}")
            return True
            
        except NoSuchJobError:
            logger.warning(f"Job not found for cancellation: {job_id}")
            return False
        except Exception as e:
            logger.error(f"Error cancelling job {job_id}: {e}")
            return False
    
    def retry_failed_jobs(self, topic: str = None, limit: int = None) -> int:
        """重试失败的任务"""
        if not self._initialized:
            self.initialize()
            
        failed_queue = Queue('failed', connection=self.redis_client)
        failed_jobs = failed_queue.get_jobs()
        
        if topic:
            failed_jobs = [job for job in failed_jobs if job.meta.get('topic') == topic]
        
        if limit:
            failed_jobs = failed_jobs[:limit]
        
        retried_count = 0
        for job in failed_jobs:
            try:
                job.retry()
                retried_count += 1
                logger.info(f"Retried failed job: {job.id}")
            except Exception as e:
                logger.error(f"Error retrying job {job.id}: {e}")
        
        logger.info(f"Retried {retried_count} failed jobs")
        return retried_count
    
    def cleanup_old_jobs(self, days: int = 7) -> int:
        """清理旧任务"""
        if not self._initialized:
            self.initialize()
            
        cutoff_time = datetime.now() - timedelta(days=days)
        cleanup_count = 0
        
        # 清理已完成的任务
        for queue_name in self.queues.keys():
            queue = self.queues[queue_name]
            
            # 获取已完成的任务
            finished_jobs = queue.get_finished_job_registry()
            
            for job_id in finished_jobs.get_job_ids():
                try:
                    job = Job.fetch(job_id, connection=self.redis_client)
                    if job.ended_at and job.ended_at < cutoff_time:
                        job.delete()
                        cleanup_count += 1
                except Exception as e:
                    logger.error(f"Error cleaning up job {job_id}: {e}")
        
        logger.info(f"Cleaned up {cleanup_count} old jobs")
        return cleanup_count
    
    def stop_workers(self, topic: str = None):
        """停止工作器"""
        workers_to_stop = []
        
        if topic:
            workers_to_stop = [w for k, w in self.workers.items() if k.startswith(topic)]
        else:
            workers_to_stop = list(self.workers.values())
        
        for worker in workers_to_stop:
            try:
                worker.request_stop()
                logger.info(f"Requested stop for worker: {worker.name}")
            except Exception as e:
                logger.error(f"Error stopping worker {worker.name}: {e}")
    
    def close(self):
        """关闭Redis连接"""
        # 停止所有工作器
        self.stop_workers()
        
        # 清理资源
        self.queues.clear()
        self.workers.clear()
        
        if self.redis_client:
            self.redis_client.close()
            self.redis_client = None
        
        self._initialized = False
        logger.info("Redis Queue connections closed")

# 全局回调函数注册表
_callbacks = {}

def register_callback(topic: str, callback: Callable):
    """注册回调函数"""
    _callbacks[topic] = callback

def process_redis_task(task_data: Dict[str, Any]) -> bool:
    """处理Redis任务的通用函数"""
    topic = task_data.get('topic')
    payload = task_data.get('payload')
    
    if topic not in _callbacks:
        logger.error(f"No callback registered for topic: {topic}")
        return False
    
    try:
        callback = _callbacks[topic]
        
        # 准备元数据
        metadata = {
            'topic': topic,
            'published_at': task_data.get('published_at'),
            'started_at': datetime.now().isoformat()
        }
        
        # 调用回调函数
        result = callback(payload, metadata)
        
        logger.info(f"Successfully processed Redis task for topic: {topic}")
        return result if result is not None else True
        
    except Exception as e:
        logger.error(f"Error processing Redis task for topic {topic}: {e}")
        raise  # RQ会处理异常并标记任务为失败

# 全局Redis队列实例
redis_queue = RedisQueue()