"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search, Replace, X, ChevronUp, ChevronDown } from 'lucide-react'

interface FindReplaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
  onReplace: (searchText: string, replaceText: string, options: FindReplaceOptions) => void
  onHighlight: (searchText: string, options: FindReplaceOptions) => void
}

export interface FindReplaceOptions {
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
  replaceAll: boolean
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  open,
  onOpenChange,
  content,
  onReplace,
  onHighlight,
}) => {
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 计算匹配数量
  useEffect(() => {
    if (!searchText || !content) {
      setMatchCount(0)
      return
    }

    try {
      let pattern = searchText
      let flags = 'g'
      
      if (!caseSensitive) flags += 'i'
      
      if (wholeWord && !useRegex) {
        pattern = `\\b${pattern}\\b`
      }
      
      const regex = useRegex ? new RegExp(pattern, flags) : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
      const matches = content.match(regex)
      setMatchCount(matches ? matches.length : 0)
    } catch (error) {
      // 如果正则表达式无效，设置匹配数为0
      setMatchCount(0)
    }
  }, [searchText, content, caseSensitive, wholeWord, useRegex])

  // 当对话框打开时，聚焦搜索输入框
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  const handleFind = () => {
    if (!searchText) return
    
    const options: FindReplaceOptions = {
      caseSensitive,
      wholeWord,
      useRegex,
      replaceAll: false,
    }
    
    onHighlight(searchText, options)
    setCurrentMatch(1)
  }

  const handleFindNext = () => {
    if (!searchText || matchCount === 0) return
    
    const next = currentMatch < matchCount ? currentMatch + 1 : 1
    setCurrentMatch(next)
    
    const options: FindReplaceOptions = {
      caseSensitive,
      wholeWord,
      useRegex,
      replaceAll: false,
    }
    
    onHighlight(searchText, options)
  }

  const handleFindPrevious = () => {
    if (!searchText || matchCount === 0) return
    
    const prev = currentMatch > 1 ? currentMatch - 1 : matchCount
    setCurrentMatch(prev)
    
    const options: FindReplaceOptions = {
      caseSensitive,
      wholeWord,
      useRegex,
      replaceAll: false,
    }
    
    onHighlight(searchText, options)
  }

  const handleReplace = () => {
    if (!searchText) return
    
    const options: FindReplaceOptions = {
      caseSensitive,
      wholeWord,
      useRegex,
      replaceAll: false,
    }
    
    onReplace(searchText, replaceText, options)
    
    // 替换后重新计算匹配数
    setCurrentMatch(Math.max(0, currentMatch - 1))
  }

  const handleReplaceAll = () => {
    if (!searchText) return
    
    const options: FindReplaceOptions = {
      caseSensitive,
      wholeWord,
      useRegex,
      replaceAll: true,
    }
    
    onReplace(searchText, replaceText, options)
    setCurrentMatch(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handleFindPrevious()
      } else {
        handleFindNext()
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>查找和替换</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find">查找</TabsTrigger>
            <TabsTrigger value="replace">替换</TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="space-y-4">
            {/* 查找输入框 */}
            <div className="space-y-2">
              <Label htmlFor="find-input">查找内容</Label>
              <div className="flex gap-2">
                <Input
                  ref={searchInputRef}
                  id="find-input"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="输入要查找的内容"
                  className="flex-1"
                />
                {matchCount > 0 && (
                  <Badge variant="secondary" className="px-3 py-2">
                    {currentMatch > 0 ? `${currentMatch}/` : ''}{matchCount} 个匹配
                  </Badge>
                )}
              </div>
            </div>

            {/* 查找选项 */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive"
                  checked={caseSensitive}
                  onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
                />
                <Label htmlFor="case-sensitive" className="text-sm">
                  区分大小写
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whole-word"
                  checked={wholeWord}
                  onCheckedChange={(checked) => setWholeWord(checked as boolean)}
                />
                <Label htmlFor="whole-word" className="text-sm">
                  全字匹配
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-regex"
                  checked={useRegex}
                  onCheckedChange={(checked) => setUseRegex(checked as boolean)}
                />
                <Label htmlFor="use-regex" className="text-sm">
                  使用正则表达式
                </Label>
              </div>
            </div>

            {/* 查找按钮 */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleFindPrevious}
                disabled={!searchText || matchCount === 0}
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                上一个
              </Button>
              <Button
                variant="outline"
                onClick={handleFindNext}
                disabled={!searchText || matchCount === 0}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                下一个
              </Button>
              <Button onClick={handleFind} disabled={!searchText}>
                <Search className="h-4 w-4 mr-1" />
                查找全部
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="replace" className="space-y-4">
            {/* 查找输入框 */}
            <div className="space-y-2">
              <Label htmlFor="find-input-replace">查找内容</Label>
              <div className="flex gap-2">
                <Input
                  id="find-input-replace"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="输入要查找的内容"
                  className="flex-1"
                />
                {matchCount > 0 && (
                  <Badge variant="secondary" className="px-3 py-2">
                    {matchCount} 个匹配
                  </Badge>
                )}
              </div>
            </div>

            {/* 替换输入框 */}
            <div className="space-y-2">
              <Label htmlFor="replace-input">替换为</Label>
              <Input
                id="replace-input"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="输入替换内容"
              />
            </div>

            {/* 替换选项 */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive-replace"
                  checked={caseSensitive}
                  onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
                />
                <Label htmlFor="case-sensitive-replace" className="text-sm">
                  区分大小写
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whole-word-replace"
                  checked={wholeWord}
                  onCheckedChange={(checked) => setWholeWord(checked as boolean)}
                />
                <Label htmlFor="whole-word-replace" className="text-sm">
                  全字匹配
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-regex-replace"
                  checked={useRegex}
                  onCheckedChange={(checked) => setUseRegex(checked as boolean)}
                />
                <Label htmlFor="use-regex-replace" className="text-sm">
                  使用正则表达式
                </Label>
              </div>
            </div>

            {/* 替换按钮 */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleReplace}
                disabled={!searchText || matchCount === 0}
              >
                <Replace className="h-4 w-4 mr-1" />
                替换
              </Button>
              <Button
                onClick={handleReplaceAll}
                disabled={!searchText || matchCount === 0}
              >
                <Replace className="h-4 w-4 mr-1" />
                全部替换 ({matchCount})
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* 提示信息 */}
        <div className="text-xs text-gray-500 mt-2">
          提示：按 Enter 查找下一个，Shift+Enter 查找上一个，Esc 关闭对话框
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FindReplaceDialog
