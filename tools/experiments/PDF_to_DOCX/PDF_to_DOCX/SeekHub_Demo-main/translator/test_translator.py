#!/usr/bin/env python3
"""
测试OpenRouter版本的translator服务
"""
import asyncio
import aiohttp
import json
import time
from typing import Dict, Any

# 配置
BASE_URL = "http://localhost:8000"
TEST_TEXTS = {
    "short": "Hello, world!",
    "medium": "Artificial intelligence is transforming the way we live and work. From healthcare to transportation, AI systems are becoming increasingly sophisticated and capable of handling complex tasks.",
    "long": """Machine learning, a subset of artificial intelligence, has revolutionized numerous industries 
    by enabling computers to learn from data without being explicitly programmed. This technology powers 
    recommendation systems on streaming platforms, enables autonomous vehicles to navigate complex environments, 
    and helps doctors diagnose diseases with unprecedented accuracy. As we continue to generate vast amounts 
    of data, machine learning algorithms become increasingly sophisticated, opening new possibilities for 
    innovation and discovery. The future of AI and machine learning holds immense potential for solving 
    some of humanity's most pressing challenges, from climate change to healthcare accessibility."""
}

class TranslatorTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = None
        self.results = []
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_health_check(self) -> Dict[str, Any]:
        """测试健康检查端点"""
        print("\n🔍 测试健康检查端点...")
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                result = await response.json()
                status = "✅ 成功" if response.status == 200 else "❌ 失败"
                print(f"  状态: {status}")
                print(f"  响应: {result}")
                return {"test": "health_check", "success": response.status == 200, "data": result}
        except Exception as e:
            print(f"  ❌ 错误: {str(e)}")
            return {"test": "health_check", "success": False, "error": str(e)}
    
    async def test_translation(self, text_type: str, text: str) -> Dict[str, Any]:
        """测试基础翻译功能"""
        print(f"\n🔍 测试翻译 ({text_type})...")
        print(f"  原文长度: {len(text)} 字符")
        
        start_time = time.time()
        try:
            payload = {"text": text}
            async with self.session.post(
                f"{self.base_url}/translate",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()
                elapsed = time.time() - start_time
                
                if response.status == 200:
                    print(f"  ✅ 成功 (耗时: {elapsed:.2f}秒)")
                    print(f"  译文: {result.get('translation', '')[:100]}...")
                    if result.get('model_used'):
                        print(f"  使用模型: {result['model_used']}")
                    if result.get('tokens_used'):
                        print(f"  Token使用: {result['tokens_used']}")
                    return {
                        "test": f"translation_{text_type}",
                        "success": True,
                        "elapsed": elapsed,
                        "translation_preview": result.get('translation', '')[:100],
                        "model_used": result.get('model_used'),
                        "tokens_used": result.get('tokens_used')
                    }
                else:
                    print(f"  ❌ 失败 (状态码: {response.status})")
                    print(f"  错误: {result}")
                    return {
                        "test": f"translation_{text_type}",
                        "success": False,
                        "status_code": response.status,
                        "error": result
                    }
        except Exception as e:
            print(f"  ❌ 异常: {str(e)}")
            return {
                "test": f"translation_{text_type}",
                "success": False,
                "error": str(e)
            }
    
    async def test_stream_translation(self, text: str) -> Dict[str, Any]:
        """测试流式翻译"""
        print("\n🔍 测试流式翻译...")
        
        try:
            payload = {"text": text}
            chunks_received = 0
            content_parts = []
            
            async with self.session.post(
                f"{self.base_url}/translate/stream",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"  ❌ 失败 (状态码: {response.status})")
                    return {"test": "stream_translation", "success": False, "error": error_text}
                
                async for line in response.content:
                    if line:
                        line_str = line.decode('utf-8').strip()
                        if line_str.startswith('data: '):
                            chunks_received += 1
                            try:
                                data = json.loads(line_str[6:])
                                if data.get('content'):
                                    content_parts.append(data['content'])
                                    print(f"  收到chunk #{chunks_received}: {len(data['content'])}字符", end='\r')
                                elif data.get('done'):
                                    print(f"\n  ✅ 流式翻译完成，共收到 {chunks_received} 个chunks")
                            except json.JSONDecodeError:
                                pass
                
                full_translation = ''.join(content_parts)
                print(f"  译文预览: {full_translation[:100]}...")
                return {
                    "test": "stream_translation",
                    "success": True,
                    "chunks_received": chunks_received,
                    "translation_preview": full_translation[:100]
                }
        except Exception as e:
            print(f"  ❌ 异常: {str(e)}")
            return {"test": "stream_translation", "success": False, "error": str(e)}
    
    async def test_batch_translation(self, texts: list) -> Dict[str, Any]:
        """测试批量翻译"""
        print(f"\n🔍 测试批量翻译 ({len(texts)} 个文本)...")
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{self.base_url}/translate/batch",
                json=texts,
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()
                elapsed = time.time() - start_time
                
                if response.status == 200:
                    success_count = sum(1 for r in result.get('results', []) if r.get('success'))
                    print(f"  ✅ 完成 (耗时: {elapsed:.2f}秒)")
                    print(f"  成功: {success_count}/{len(texts)}")
                    return {
                        "test": "batch_translation",
                        "success": True,
                        "elapsed": elapsed,
                        "success_count": success_count,
                        "total_count": len(texts)
                    }
                else:
                    print(f"  ❌ 失败 (状态码: {response.status})")
                    return {
                        "test": "batch_translation",
                        "success": False,
                        "status_code": response.status,
                        "error": result
                    }
        except Exception as e:
            print(f"  ❌ 异常: {str(e)}")
            return {"test": "batch_translation", "success": False, "error": str(e)}
    
    async def test_error_handling(self) -> Dict[str, Any]:
        """测试错误处理"""
        print("\n🔍 测试错误处理...")
        
        # 测试超大文本
        print("  测试超大文本...")
        huge_text = "a" * 150000  # 超过MAX_CHARS限制
        
        try:
            async with self.session.post(
                f"{self.base_url}/translate",
                json={"text": huge_text},
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 413:
                    print("  ✅ 正确拒绝超大文本 (413)")
                    return {"test": "error_handling", "success": True, "case": "oversized_text"}
                else:
                    print(f"  ❌ 未正确处理超大文本 (状态码: {response.status})")
                    return {"test": "error_handling", "success": False, "case": "oversized_text"}
        except Exception as e:
            print(f"  ❌ 异常: {str(e)}")
            return {"test": "error_handling", "success": False, "error": str(e)}
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("=" * 60)
        print("🚀 开始测试OpenRouter Translator服务")
        print("=" * 60)
        
        # 1. 健康检查
        result = await self.test_health_check()
        self.results.append(result)
        
        # 2. 基础翻译测试
        for text_type, text in TEST_TEXTS.items():
            result = await self.test_translation(text_type, text)
            self.results.append(result)
            await asyncio.sleep(1)  # 避免请求过快
        
        # 3. 流式翻译测试
        result = await self.test_stream_translation(TEST_TEXTS["medium"])
        self.results.append(result)
        
        # 4. 批量翻译测试
        batch_texts = ["Hello", "How are you?", "Thank you"]
        result = await self.test_batch_translation(batch_texts)
        self.results.append(result)
        
        # 5. 错误处理测试
        result = await self.test_error_handling()
        self.results.append(result)
        
        # 生成报告
        self.generate_report()
    
    def generate_report(self):
        """生成测试报告"""
        print("\n" + "=" * 60)
        print("📊 测试报告")
        print("=" * 60)
        
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
            if result.get('elapsed'):
                print(f"     耗时: {result['elapsed']:.2f}秒")
            if result.get('error'):
                print(f"     错误: {result['error']}")
        
        print("\n" + "=" * 60)
        if successful_tests == total_tests:
            print("🎉 所有测试通过！服务运行正常。")
        else:
            print("⚠️  部分测试失败，请检查服务配置。")
        print("=" * 60)

async def main():
    """主函数"""
    async with TranslatorTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    print("\n⚠️  请确保translator服务正在运行:")
    print("   uvicorn main_openrouter:app --reload --port 8000")
    print("\n按Enter继续测试，或Ctrl+C退出...")
    input()
    
    asyncio.run(main())
