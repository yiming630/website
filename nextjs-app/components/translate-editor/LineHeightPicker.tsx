"use client"

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { AlignJustify, ChevronDown } from 'lucide-react'

interface LineHeightPickerProps {
  value: string
  onChange: (height: string) => void
  disabled?: boolean
}

const lineHeightOptions = [
  { value: '1', label: '1.0 - 紧凑' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5 - 默认' },
  { value: '1.75', label: '1.75' },
  { value: '2', label: '2.0 - 宽松' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3.0' },
]

export const LineHeightPicker: React.FC<LineHeightPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const currentOption = lineHeightOptions.find(opt => opt.value === value) || lineHeightOptions[2]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-1" 
          title="行间距"
          disabled={disabled}
        >
          <AlignJustify className="h-4 w-4" />
          <span className="ml-1 text-xs">{currentOption.value}</span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {lineHeightOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={value === option.value ? 'bg-gray-100' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <span>{option.label}</span>
              {value === option.value && (
                <span className="text-blue-600 ml-2">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LineHeightPicker
