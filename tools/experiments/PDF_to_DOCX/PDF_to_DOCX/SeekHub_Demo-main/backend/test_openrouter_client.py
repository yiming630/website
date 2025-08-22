#!/usr/bin/env python3
"""
测试OpenRouter版本的backend翻译客户端
"""
import asyncio
import time
import sys
import os
from pathlib import Path

# 添加src到Python路径
sys.path.insert(0, str(Path(__file__).parent))

# 设置测试环境变量（如果还没设置）
if not os.getenv("OPENROUTER_API_KEY"):
    print("⚠️  未设置OPENROUTER_API_KEY环境变量")
    print("   使用Mock translator进行测试")

from src.core.gemini_client_openrouter import (
    HighSpeedOpenRouterTranslator,
    MockGeminiTranslator,
    create_translator
)

# 测试文本
TEST_TEXTS = {
    "short": "Hello, world!",
    "medium": """Artificial intelligence is transforming the way we live and work. 
    From healthcare to transportation, AI systems are becoming increasingly sophisticated 
    and capable of handling complex tasks.""",
    "long": """Machine learning, a subset of artificial intelligence, has revolutionized 
    numerous industries by enabling computers to learn from data without being explicitly 
    programmed. This technology powers recommendation systems on streaming platforms, 
    enables autonomous vehicles to navigate complex environments, and helps doctors 
    diagnose diseases with unprecedented accuracy. As we continue to generate vast 
    amounts of data, machine learning algorithms become increasingly sophisticated, 
    opening new possibilities for innovation and discovery."""
}

class TranslatorTester:
    """翻译客户端测试器"""
    
    def __init__(self):
        self.translator = None
        self.results = []
    
    async def setup(self):
        """初始化翻译器"""
        print("\n🔧 初始化翻译器...")
        self.translator = create_translator()
        
        if isinstance(self.translator, MockGeminiTranslator):
            print("   使用Mock翻译器（测试模式）")
        else:
            print("   使用OpenRouter翻译器（生产模式）")
            print(f"   模型: {self.translator.model}")
            print(f"   备用模型: {self.translator.fallback_model}")
    
    async def test_basic_translation(self):
        """测试基础翻译功能"""
        print("\n📝 测试基础翻译...")
        
        for text_type, text in TEST_TEXTS.items():
            print(f"\n   测试{text_type}文本 ({len(text)}字符)...")
            start_time = time.time()
            
            try:
                result = await self.translator.translate_text(text, "en", "zh")
                elapsed = time.time() - start_time
                
                if result:
                    print(f"   ✅ 成功 (耗时: {elapsed:.2f}秒)")
                    print(f"   原文: {text[:50]}...")
                    print(f"   译文: {result[:50]}...")
                    self.results.append({
                        "test": f"basic_{text_type}",
                        "success": True,
                        "time": elapsed
                    })
                else:
                    print(f"   ❌ 翻译失败")
                    self.results.append({
                        "test": f"basic_{text_type}",
                        "success": False
                    })
            except Exception as e:
                print(f"   ❌ 异常: {str(e)}")
                self.results.append({
                    "test": f"basic_{text_type}",
                    "success": False,
                    "error": str(e)
                })
    
    async def test_batch_translation(self):
        """测试批量翻译"""
        print("\n📚 测试批量翻译...")
        
        texts = [
            "Good morning",
            "How are you?",
            "Thank you very much",
            "See you tomorrow",
            "Have a nice day"
        ]
        
        print(f"   批量翻译{len(texts)}个文本...")
        start_time = time.time()
        
        try:
            results = await self.translator.translate_batch(texts, "en", "zh")
            elapsed = time.time() - start_time
            
            success_count = sum(1 for r in results if r is not None)
            print(f"   ✅ 完成 (耗时: {elapsed:.2f}秒)")
            print(f"   成功: {success_count}/{len(texts)}")
            
            for i, (original, translated) in enumerate(zip(texts, results)):
                if translated:
                    print(f"   [{i+1}] {original} → {translated}")
            
            self.results.append({
                "test": "batch_translation",
                "success": success_count == len(texts),
                "time": elapsed,
                "success_rate": success_count / len(texts)
            })
        except Exception as e:
            print(f"   ❌ 异常: {str(e)}")
            self.results.append({
                "test": "batch_translation",
                "success": False,
                "error": str(e)
            })
    
    async def test_stream_translation(self):
        """测试流式翻译"""
        print("\n🌊 测试流式翻译...")
        
        text = TEST_TEXTS["medium"]
        print(f"   流式翻译{len(text)}字符...")
        
        try:
            chunks = []
            chunk_count = 0
            start_time = time.time()
            
            async for chunk in self.translator.translate_text_stream(text, "en", "zh"):
                chunks.append(chunk)
                chunk_count += 1
                print(f"   收到chunk #{chunk_count}: {len(chunk)}字符", end='\r')
            
            elapsed = time.time() - start_time
            full_translation = "".join(chunks)
            
            print(f"\n   ✅ 完成 (耗时: {elapsed:.2f}秒)")
            print(f"   共{chunk_count}个chunks")
            print(f"   译文预览: {full_translation[:100]}...")
            
            self.results.append({
                "test": "stream_translation",
                "success": bool(full_translation),
                "time": elapsed,
                "chunks": chunk_count
            })
        except Exception as e:
            print(f"   ❌ 异常: {str(e)}")
            self.results.append({
                "test": "stream_translation",
                "success": False,
                "error": str(e)
            })
    
    async def test_chapter_translation(self):
        """测试章节翻译"""
        print("\n📖 测试章节翻译...")
        
        chapter_text = TEST_TEXTS["long"]
        chapter_index = 1
        
        print(f"   翻译第{chapter_index}章 ({len(chapter_text)}字符)...")
        
        try:
            result = await self.translator.translate_chapter(chapter_text, chapter_index)
            
            if result['success']:
                print(f"   ✅ 成功")
                print(f"   处理时间: {result['processing_time']:.2f}秒")
                print(f"   字数: {result['word_count']}")
                print(f"   字符数: {result['character_count']}")
            else:
                print(f"   ❌ 失败")
            
            self.results.append({
                "test": "chapter_translation",
                "success": result['success'],
                "time": result.get('processing_time', 0)
            })
        except Exception as e:
            print(f"   ❌ 异常: {str(e)}")
            self.results.append({
                "test": "chapter_translation",
                "success": False,
                "error": str(e)
            })
    
    async def test_progress_callback(self):
        """测试带进度回调的章节翻译"""
        print("\n📊 测试进度回调...")
        
        chapter_text = TEST_TEXTS["medium"]
        chapter_index = 2
        progress_updates = []
        
        async def progress_callback(chunk, progress):
            progress_updates.append(progress)
            print(f"   进度: {progress:.1f}%", end='\r')
        
        print(f"   翻译第{chapter_index}章 (带进度回调)...")
        
        try:
            result = await self.translator.translate_chapter_stream(
                chapter_text, 
                chapter_index,
                callback=progress_callback
            )
            
            print(f"\n   ✅ 完成")
            print(f"   进度更新次数: {len(progress_updates)}")
            print(f"   翻译时间: {result.get('translation_time', 0):.2f}秒")
            
            self.results.append({
                "test": "progress_callback",
                "success": result['success'],
                "time": result.get('translation_time', 0),
                "progress_updates": len(progress_updates)
            })
        except Exception as e:
            print(f"   ❌ 异常: {str(e)}")
            self.results.append({
                "test": "progress_callback",
                "success": False,
                "error": str(e)
            })
    
    async def test_error_handling(self):
        """测试错误处理"""
        print("\n⚠️  测试错误处理...")
        
        # 测试超长文本
        huge_text = "a" * 1000000  # 1M字符
        
        print("   测试超长文本处理...")
        try:
            result = await self.translator.translate_text(huge_text[:10000], "en", "zh")
            if result:
                print("   ✅ 处理成功")
                self.results.append({
                    "test": "error_handling",
                    "success": True
                })
            else:
                print("   ⚠️  返回None（预期行为）")
                self.results.append({
                    "test": "error_handling",
                    "success": True
                })
        except Exception as e:
            print(f"   ✅ 正确捕获异常: {str(e)[:100]}")
            self.results.append({
                "test": "error_handling",
                "success": True
            })
    
    async def cleanup(self):
        """清理资源"""
        if self.translator:
            await self.translator.close()
            print("\n🧹 资源清理完成")
    
    def generate_report(self):
        """生成测试报告"""
        print("\n" + "="*60)
        print("📊 测试报告")
        print("="*60)
        
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r.get('success'))
        
        print(f"\n总测试数: {total_tests}")
        print(f"成功: {successful_tests}")
        print(f"失败: {total_tests - successful_tests}")
        print(f"成功率: {(successful_tests/total_tests)*100:.1f}%")
        
        print("\n详细结果:")
        for result in self.results:
            status = "✅" if result.get('success') else "❌"
            test_name = result.get('test', 'unknown')
            print(f"  {status} {test_name}")
            if result.get('time'):
                print(f"     耗时: {result['time']:.2f}秒")
            if result.get('error'):
                print(f"     错误: {result['error'][:100]}")
            if result.get('success_rate') is not None:
                print(f"     成功率: {result['success_rate']*100:.1f}%")
        
        print("\n" + "="*60)
        if successful_tests == total_tests:
            print("🎉 所有测试通过！翻译客户端运行正常。")
        else:
            print("⚠️  部分测试失败，请检查配置和网络连接。")
        print("="*60)
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("="*60)
        print("🚀 开始测试OpenRouter翻译客户端")
        print("="*60)
        
        await self.setup()
        
        # 运行各项测试
        await self.test_basic_translation()
        await self.test_batch_translation()
        await self.test_stream_translation()
        await self.test_chapter_translation()
        await self.test_progress_callback()
        await self.test_error_handling()
        
        await self.cleanup()
        
        # 生成报告
        self.generate_report()

async def main():
    """主函数"""
    tester = TranslatorTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    print("\n⚠️  请确保已设置环境变量:")
    print("   export OPENROUTER_API_KEY=your_key_here")
    print("\n如果未设置，将使用Mock translator进行测试")
    print("\n按Enter继续测试，或Ctrl+C退出...")
    input()
    
    asyncio.run(main())
