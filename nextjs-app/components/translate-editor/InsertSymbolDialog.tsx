"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AtSign, Search } from 'lucide-react'

interface InsertSymbolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (symbol: string) => void
}

// 符号分类数据
const symbolCategories = {
  common: {
    name: '常用符号',
    symbols: [
      '©', '®', '™', '§', '¶', '†', '‡', '‰', '‱',
      '№', '℗', '℠', '℡', '℻', '✓', '✗', '✔', '✘',
      '♂', '♀', '☆', '★', '♠', '♣', '♥', '♦',
      '♪', '♫', '☀', '☁', '☂', '☃', '☄', '☽',
    ],
  },
  math: {
    name: '数学符号',
    symbols: [
      '±', '×', '÷', '≠', '≈', '≤', '≥', '∞', '∑',
      '∏', '∫', '√', '∛', '∜', '∂', '∇', '∈', '∉',
      '⊂', '⊃', '⊆', '⊇', '∪', '∩', '∧', '∨',
      'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ω',
    ],
  },
  currency: {
    name: '货币符号',
    symbols: [
      '¥', '$', '€', '£', '¢', '¤', '₹', '₽', '₴',
      '₦', '₨', '₩', '₪', '₫', '₱', '₹', '₺', '₼',
    ],
  },
  arrows: {
    name: '箭头符号',
    symbols: [
      '←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '⇑', '⇓', '⇔', '⇕',
      '↖', '↗', '↘', '↙', '↰', '↱', '↲', '↳', '↴', '↵',
      '⤴', '⤵', '⬆', '⬇', '⬅', '➡', '⬉', '⬊', '⬈', '⬋',
    ],
  },
  punctuation: {
    name: '标点符号',
    symbols: [
      '•', '◦', '‣', '⁃', '…', '‥', '„', '"', '"', "'", "'", '‚',
      '«', '»', '‹', '›', '「', '」', '『', '』', '【', '】', '〖', '〗',
      '—', '–', '‾', '¯', '＿', '﹏', '～',
    ],
  },
  emoji: {
    name: '表情符号',
    symbols: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '👍', '👎', '👌', '✌', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
    ],
  },
}

export const InsertSymbolDialog: React.FC<InsertSymbolDialogProps> = ({
  open,
  onOpenChange,
  onInsert,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('common')
  const [recentSymbols, setRecentSymbols] = useState<string[]>([])

  const handleInsert = (symbol: string) => {
    onInsert(symbol)
    
    // 添加到最近使用
    setRecentSymbols(prev => {
      const updated = [symbol, ...prev.filter(s => s !== symbol)].slice(0, 20)
      localStorage.setItem('recentSymbols', JSON.stringify(updated))
      return updated
    })
    
    onOpenChange(false)
  }

  // 加载最近使用的符号
  React.useEffect(() => {
    const saved = localStorage.getItem('recentSymbols')
    if (saved) {
      try {
        setRecentSymbols(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // 搜索符号
  const filteredSymbols = searchTerm
    ? Object.values(symbolCategories)
        .flatMap(cat => cat.symbols)
        .filter(symbol => symbol.includes(searchTerm))
    : symbolCategories[selectedCategory as keyof typeof symbolCategories]?.symbols || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>插入特殊符号</DialogTitle>
          <DialogDescription>
            选择要插入的特殊字符或符号
          </DialogDescription>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索符号..."
            className="pl-10"
          />
        </div>

        {!searchTerm ? (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              {Object.entries(symbolCategories).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 最近使用 */}
            {recentSymbols.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2 text-gray-700">最近使用</h3>
                <div className="grid grid-cols-10 gap-2">
                  {recentSymbols.map((symbol, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-10 w-10 p-0 text-lg hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => handleInsert(symbol)}
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 分类符号 */}
            {Object.entries(symbolCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-4">
                <div className="grid grid-cols-10 gap-2">
                  {category.symbols.map((symbol, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-10 w-10 p-0 text-lg hover:bg-blue-50 hover:border-blue-300 group relative"
                      onClick={() => handleInsert(symbol)}
                      title={`Unicode: ${symbol.charCodeAt(0).toString(16).toUpperCase()}`}
                    >
                      {symbol}
                      {/* 悬停时显示Unicode */}
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        U+{symbol.charCodeAt(0).toString(16).toUpperCase()}
                      </span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // 搜索结果
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2 text-gray-700">
              搜索结果 ({filteredSymbols.length})
            </h3>
            {filteredSymbols.length > 0 ? (
              <div className="grid grid-cols-10 gap-2">
                {filteredSymbols.map((symbol, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-10 w-10 p-0 text-lg hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handleInsert(symbol)}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">没有找到匹配的符号</p>
            )}
          </div>
        )}

        {/* 提示信息 */}
        <div className="text-xs text-gray-500 mt-4">
          提示：点击符号即可插入到编辑器中
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InsertSymbolDialog
