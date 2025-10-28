import React from 'react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactElement
  onClick?: () => void
  className?: string
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  onClick,
  className = '' 
}) => {
  const baseClasses = 'bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative'
  const interactiveClasses = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      onClick={onClick}
    >
      {/* Circular icon at top center, overlapping the card edge */}
      <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
        {React.isValidElement(icon) 
          ? React.cloneElement(icon, { 
              color: 'white', 
              size: 32, 
              strokeWidth: 2 
            } as React.SVGProps<SVGSVGElement>) 
          : icon}
      </div>
      
      {/* Card content */}
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">{title}</h3>
      <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {subtitle && <div className="text-xs sm:text-sm text-accent mt-1 px-2">{subtitle}</div>}
    </div>
  )
}

