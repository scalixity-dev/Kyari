import { useState, useRef, useEffect } from 'react'
import { FileDown, FileText } from 'lucide-react'

interface ExportOption {
  label: string
  icon?: React.ReactNode
  onClick: () => void
}

interface ExportButtonProps {
  options: ExportOption[]
  label?: string
  className?: string
  buttonClassName?: string
  dropdownClassName?: string
}

export function ExportButton({
  options,
  label = 'Export',
  className = '',
  buttonClassName = '',
  dropdownClassName = ''
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionClick = (option: ExportOption) => {
    option.onClick()
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex bg-white items-center justify-center gap-2 px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm w-full sm:w-auto min-h-[44px] sm:min-h-auto transition-colors ${buttonClassName}`}
      >
        <FileDown size={16} className="flex-shrink-0" />
        <span>{label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 ${dropdownClassName}`}>
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
              >
                {option.icon || <FileText size={16} />}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Preset export button for common CSV/PDF exports
interface PresetExportButtonProps {
  onExportCSV: () => void
  onExportPDF: () => void
  label?: string
  className?: string
}

export function CSVPDFExportButton({
  onExportCSV,
  onExportPDF,
  label = 'Export',
  className = ''
}: PresetExportButtonProps) {
  return (
    <ExportButton
      label={label}
      className={className}
      options={[
        {
          label: 'Export as CSV',
          icon: <FileText size={16} />,
          onClick: onExportCSV
        },
        {
          label: 'Export as PDF',
          icon: <FileText size={16} />,
          onClick: onExportPDF
        }
      ]}
    />
  )
}
