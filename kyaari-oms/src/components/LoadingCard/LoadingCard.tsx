import React from 'react'

export interface LoadingCardProps {
  /**
   * The message to display below the spinner
   */
  message?: string
  /**
   * Additional CSS classes for the container
   */
  className?: string
}

/**
 * LoadingCard - An accessible loading state component
 * 
 * Displays a centered card with a loading spinner and message.
 * Includes proper ARIA attributes for screen reader accessibility.
 */
const LoadingCard: React.FC<LoadingCardProps> = ({ 
  message = 'Loading...', 
  className = '' 
}) => {
  return (
    <div 
      className={`bg-white rounded-xl p-12 text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div 
        className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"
        aria-hidden="true"
      ></div>
      <p className="text-gray-500" aria-label={message}>
        {message}
      </p>
    </div>
  )
}

export default LoadingCard
