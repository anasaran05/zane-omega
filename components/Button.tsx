import { Glowbutton, Outlinebutton } from '@/components/button';

import { ReactNode, buttonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface buttonProps extends Omit<buttonHTMLAttributes, 'className'> {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: buttonProps) {
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
export function Primarybutton(props: Omit<buttonProps, 'variant'>) {
  return <button variant="primary" {...props} />;
}

export function Outlinebutton(props: Omit<buttonProps, 'variant'>) {
  return <button variant="outline" {...props} />;
}

export function Ghostbutton(props: Omit<buttonProps, 'variant'>) {
  return <button variant="ghost" {...props} />;
}

// button with glow effect for CTAs
export function Glowbutton({ className = '', ...props }: buttonProps) {
  return (
    <button 
      className={`shadow-glow hover:shadow-glowHover hover:animate-glow-pulse ${className}`}
      {...props}
    />
  );
}
