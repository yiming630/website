#!/usr/bin/env python3
"""
Worker Startup Script
Launches chapter and combination workers for the translation pipeline
"""

import os
import sys
import asyncio
import signal
import logging
from pathlib import Path
from typing import List, Optional

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from src.workers.chapter_worker import ChapterWorker, run_chapter_worker
from src.workers.combination_worker import CombinationWorker, run_combination_worker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WorkerManager:
    """Manages worker processes"""
    
    def __init__(self):
        self.workers: List[asyncio.Task] = []
        self.running = False
        
    async def start_workers(self, num_chapter_workers: int = 4, num_combo_workers: int = 2):
        """Start chapter and combination workers"""
        logger.info(f"Starting {num_chapter_workers} chapter workers and {num_combo_workers} combination workers")
        
        try:
            # Start chapter workers
            for i in range(num_chapter_workers):
                worker_id = f"chapter-worker-{i+1}"
                task = asyncio.create_task(run_chapter_worker(worker_id, "pull"))
                self.workers.append(task)
                logger.info(f"Started {worker_id}")
            
            # Start combination workers
            for i in range(num_combo_workers):
                worker_id = f"combo-worker-{i+1}"
                task = asyncio.create_task(run_combination_worker(worker_id))
                self.workers.append(task)
                logger.info(f"Started {worker_id}")
            
            self.running = True
            logger.info("All workers started successfully")
            
            # Wait for all workers
            await asyncio.gather(*self.workers, return_exceptions=True)
            
        except Exception as e:
            logger.error(f"Error starting workers: {e}")
            raise
    
    async def stop_workers(self):
        """Stop all workers"""
        logger.info("Stopping all workers...")
        self.running = False
        
        for task in self.workers:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self.workers, return_exceptions=True)
        logger.info("All workers stopped")

async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Start translation workers")
    parser.add_argument("--chapter-workers", type=int, default=4, help="Number of chapter workers")
    parser.add_argument("--combo-workers", type=int, default=2, help="Number of combination workers")
    
    args = parser.parse_args()
    
    # Set up signal handlers
    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, shutting down...")
        asyncio.create_task(manager.stop_workers())
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start worker manager
    manager = WorkerManager()
    
    try:
        await manager.start_workers(args.chapter_workers, args.combo_workers)
    except KeyboardInterrupt:
        logger.info("Received interrupt, shutting down...")
    except Exception as e:
        logger.error(f"Worker startup failed: {e}")
        return 1
    finally:
        await manager.stop_workers()
    
    return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main())) 