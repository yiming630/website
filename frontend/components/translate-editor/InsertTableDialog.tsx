"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Table, Grid3X3 } from 'lucide-react'

interface InsertTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (rows: number, cols: number, withHeader: boolean) => void
}

export const InsertTableDialog: React.FC<InsertTableDialogProps> = ({
  open,
  onOpenChange,
  onInsert,
}) => {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [withHeader, setWithHeader] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)

  const handleInsert = () => {
    onInsert(rows, cols, withHeader)
    // 重置状态
    setRows(3)
    setCols(3)
    setWithHeader(true)
    onOpenChange(false)
  }

  const handleQuickSelect = (r: number, c: number) => {
    setRows(r)
    setCols(c)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>插入表格</DialogTitle>
          <DialogDescription>
            选择表格的行数和列数
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 快速选择网格 */}
          <div className="space-y-2">
            <Label>快速选择</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-10 gap-1 w-fit mx-auto">
                {Array.from({ length: 8 }, (_, rowIndex) => (
                  Array.from({ length: 10 }, (_, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-6 h-6 border cursor-pointer transition-colors
                        ${(hoveredCell && rowIndex <= hoveredCell.row && colIndex <= hoveredCell.col) ||
                          (rows === rowIndex + 1 && cols === colIndex + 1)
                          ? 'bg-blue-500 border-blue-600'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                        }
                      `}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleQuickSelect(rowIndex + 1, colIndex + 1)}
                    />
                  ))
                ))}
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                {hoveredCell ? `${hoveredCell.row + 1} × ${hoveredCell.col + 1}` : `${rows} × ${cols}`}
              </div>
            </div>
          </div>

          {/* 精确输入 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rows">行数</Label>
                <span className="text-sm text-gray-500">{rows}</span>
              </div>
              <Slider
                id="rows"
                value={[rows]}
                onValueChange={(value) => setRows(value[0])}
                min={1}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cols">列数</Label>
                <span className="text-sm text-gray-500">{cols}</span>
              </div>
              <Slider
                id="cols"
                value={[cols]}
                onValueChange={(value) => setCols(value[0])}
                min={1}
                max={20}
                step={1}
              />
            </div>
          </div>

          {/* 表头选项 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="with-header" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              包含表头行
            </Label>
            <Switch
              id="with-header"
              checked={withHeader}
              onCheckedChange={setWithHeader}
            />
          </div>

          {/* 预览 */}
          <div className="space-y-2">
            <Label>预览</Label>
            <div className="border rounded-lg p-4 bg-white max-h-[200px] overflow-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {Array.from({ length: Math.min(rows, 5) }, (_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: Math.min(cols, 5) }, (_, colIndex) => {
                        const isHeader = withHeader && rowIndex === 0
                        const Tag = isHeader ? 'th' : 'td'
                        return (
                          <Tag
                            key={colIndex}
                            className={`
                              border px-2 py-1 text-sm
                              ${isHeader ? 'bg-gray-100 font-semibold' : 'bg-white'}
                            `}
                          >
                            {isHeader ? `标题 ${colIndex + 1}` : `单元格`}
                          </Tag>
                        )
                      })}
                      {cols > 5 && (
                        <td className="border px-2 py-1 text-sm text-gray-400">...</td>
                      )}
                    </tr>
                  ))}
                  {rows > 5 && (
                    <tr>
                      <td
                        colSpan={Math.min(cols, 5) + (cols > 5 ? 1 : 0)}
                        className="border px-2 py-1 text-sm text-center text-gray-400"
                      >
                        ...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleInsert}>
            <Table className="h-4 w-4 mr-2" />
            插入表格
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InsertTableDialog
