/** Variantes y base compartidas por Button, IconButton y el disparador de Menu. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

/** Compartido con IconButton: mismo relleno, borde y hover por variante. */
export const variantClass: Record<ButtonVariant, string> = {
  primary: 'border-sig bg-sig font-[560] text-on-sig hover:border-sig-hover hover:bg-sig-hover',
  secondary: 'border-rule-strong bg-surface text-ink hover:border-rule-hover hover:bg-surface-2',
  ghost: 'border-transparent bg-transparent text-dim hover:bg-surface hover:text-ink',
  danger: 'border-transparent bg-transparent text-danger hover:bg-danger/10',
}

export const controlBase = 'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control border text-body no-underline transition-colors duration-120 ease-e disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none'
