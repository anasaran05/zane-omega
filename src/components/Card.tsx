
import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: CSSProperties;
}

export default function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  onClick,
  style
}: CardProps) {
  const baseClasses = 'theme-card transition-all duration-200';
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-lg hover:shadow-xl',
    interactive: 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/20'
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const classes = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${paddingClasses[padding]} 
    ${onClick ? 'cursor-pointer' : ''} 
    ${className}
  `.trim();

  if (onClick) {
    return (
      <div 
        className={classes}
        onClick={onClick}
        style={style}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

// Specialized card components
export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-xl font-heading font-semibold text-foreground ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-muted-foreground ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 pt-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
}
