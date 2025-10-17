import React from 'react'
import { X, FileDown, FileText, CheckSquare } from 'lucide-react'

interface JsonViewerModalProps {
  isOpen: boolean
  onClose: () => void
  jsonData: Record<string, unknown> | null
  title?: string
  onDownload?: () => void
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  jsonData, 
  title = 'JSON Data',
  onDownload 
}) => {
  const [copied, setCopied] = React.useState(false)

  if (!isOpen || !jsonData) return null

  const formattedJson = JSON.stringify(jsonData, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      // Default download behavior
      const blob = new Blob([formattedJson], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 xl:p-6 2xl:p-8">
      <div className="bg-white rounded-2xl w-full max-w-[90vw] sm:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl max-h-[95vh] flex flex-col shadow-2xl transform translate-x-6 sm:translate-x-8 xl:translate-x-16">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 xl:px-7 xl:py-5 2xl:px-8 2xl:py-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl xl:text-2xl 2xl:text-3xl">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <CheckSquare size={16} className="text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                    <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white rounded-lg transition-colors text-sm"
              title="Download JSON"
            >
              <FileDown size={16} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 xl:p-1.5 2xl:p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close JSON viewer"
            >
              <X size={24} className="xl:w-7 xl:h-7 2xl:w-8 2xl:h-8" />
            </button>
          </div>
        </div>

        {/* JSON Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 xl:p-7 2xl:p-8 bg-gray-50">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm font-mono leading-relaxed">
            {formattedJson}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 xl:px-7 xl:py-5 2xl:px-8 2xl:py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Size: {new Blob([formattedJson]).size} bytes</span>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

