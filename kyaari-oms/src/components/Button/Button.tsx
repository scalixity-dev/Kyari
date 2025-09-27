type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
}

export default function Button({ children, className = '', ...rest }: Props) {
  return (
    <button 
      {...rest} 
      className={`bg-accent text-button-text border-none px-4 py-2.5 rounded-lg cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
