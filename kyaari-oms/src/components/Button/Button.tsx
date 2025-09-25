import styles from './Button.module.css'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
}

export default function Button({ children, ...rest }: Props) {
  return (
    <button {...rest} className={styles.btn}>
      {children}
    </button>
  )
}
