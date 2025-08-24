
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background';
  
  const variantClasses = {
    primary: 'theme-button-primary',
    outline: 'theme-button-outline',
    ghost: 'text-foreground hover:bg-surface-elevated hover:text-foreground',
    disabled: 'theme-button-disabled'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const isDisabled = disabled || loading || variant === 'disabled';
  const finalVariant = isDisabled ? 'disabled' : variant;

  const classes = `
    ${baseClasses} 
    ${variantClasses[finalVariant]} 
    ${sizeClasses[size]} 
    ${className}
  `.trim();

  return (
    <button 
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// Specialized button variants
export function PrimaryButton({ children, ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" {...props}>{children}</Button>;
}

export function OutlineButton({ children, ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="outline" {...props}>{children}</Button>;
}

export function GhostButton({ children, ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="ghost" {...props}>{children}</Button>;
}

// Button with glow effect for CTAs
export function GlowButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <Button 
      className={`shadow-glow hover:shadow-glowHover hover:animate-glow-pulse ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
