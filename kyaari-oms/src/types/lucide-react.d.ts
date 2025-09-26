declare module 'lucide-react' {
  import type { JSX } from 'react'

  export type LucideIcon = (props: {
    size?: number
    color?: string
    className?: string
  }) => JSX.Element

  export const LayoutDashboard: LucideIcon
  export const Package: LucideIcon
  export const Users: LucideIcon
  export const Bell: LucideIcon
  export const Wallet: LucideIcon
  export const MapPin: LucideIcon
  export const BarChart3: LucideIcon
  export const FileText: LucideIcon
  export const Search: LucideIcon
}


