"""
测试本地存储集成
"""
import asyncio
import os
import sys
from pathlib import Path

# 设置环境变量
os.environ['LOCAL_STORAGE_ROOT'] = 'C:/Users/Lenovo/Desktop/seekhub-demo/storage'
os.environ['PUBLIC_URL_BASE'] = 'http://localhost:4000/files'

# 添加路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from local_storage import LocalFileStorage

async def test_local_storage():
    """测试本地存储功能"""
    print("开始测试本地存储集成...")
    
    storage = LocalFileStorage()
    
    # 测试1: 上传字符串
    print("\n测试1: 上传字符串内容")
    test_content = """
    Chapter 1: Introduction
    This is a test chapter for translation.
    
    Chapter 2: Development
    This chapter contains more content for testing.
    """
    
    book_id = "test_book_001"
    url = storage.upload_string(test_content, f"books/{book_id}/original.txt")
    print(f"[OK] 上传成功: {url}")
    
    # 测试2: 读取内容
    print("\n测试2: 读取上传的内容")
    downloaded = storage.download_string(f"books/{book_id}/original.txt")
    if downloaded == test_content:
        print("[OK] 内容验证成功")
    else:
        print("[ERROR] 内容不匹配")
    
    # 测试3: 上传章节翻译
    print("\n测试3: 上传章节翻译")
    chapter_translation = "第一章：介绍\n这是用于翻译的测试章节。"
    chapter_url = storage.upload_string(
        chapter_translation,
        f"books/{book_id}/chapters/chapter_0_zh.txt"
    )
    print(f"[OK] 章节上传成功: {chapter_url}")
    
    # 测试4: 列出文件
    print("\n测试4: 列出所有文件")
    files = storage.list_objects(f"books/{book_id}")
    print(f"[OK] 找到 {len(files)} 个文件:")
    for file in files:
        print(f"  - {file}")
    
    # 测试5: 组合翻译
    print("\n测试5: 模拟组合翻译")
    combined_text = f"{chapter_translation}\n\n第二章：开发\n这个章节包含更多用于测试的内容。"
    final_url = storage.upload_string(
        combined_text,
        f"books/{book_id}/translated_zh.txt"
    )
    print(f"[OK] 最终翻译上传成功: {final_url}")
    
    print("\n所有测试完成！")
    
    # 清理测试文件
    print("\n清理测试文件...")
    storage.delete_object(f"books/{book_id}/original.txt")
    storage.delete_object(f"books/{book_id}/chapters/chapter_0_zh.txt")
    storage.delete_object(f"books/{book_id}/translated_zh.txt")
    print("[OK] 清理完成")

if __name__ == "__main__":
    asyncio.run(test_local_storage())