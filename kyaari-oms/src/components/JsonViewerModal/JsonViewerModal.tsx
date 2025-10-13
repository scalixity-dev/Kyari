import React from 'react'
import { X, FileDown, Clipboard, Check } from 'lucide-react'
import { ClipboardCopy } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-[var(--color-heading)]">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy size={16} />
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
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* JSON Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm font-mono leading-relaxed">
            {formattedJson}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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

