import { useState, useRef, useEffect } from 'react'
import { ChevronDown, CheckSquare } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

export interface CustomDropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function CustomDropdown({ 
  value, 
  options, 
  onChange, 
  placeholder, 
  className = '', 
  required = false 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder || 'Select...'

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm font-medium text-secondary bg-white hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 text-left flex items-center justify-between min-h-[44px]"
        aria-required={required}
      >
        <span className={selectedOption ? 'text-secondary' : 'text-gray-400'}>
          {displayValue}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl flex items-center justify-between ${
                option.value === value ? 'bg-accent/10 text-accent font-medium' : 'text-secondary'
              }`}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <CheckSquare size={14} className="text-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomDropdown

