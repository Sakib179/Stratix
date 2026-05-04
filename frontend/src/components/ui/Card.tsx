import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, glow, padding = 'md', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'glass',
        hover && 'glass-hover cursor-pointer',
        glow && 'shadow-brand',
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';

const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-5', className)} {...props}>{children}</div>
);

const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>{children}</h3>
);

const CardDescription = ({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-surface-200 mt-1', className)} {...props}>{children}</p>
);

const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(className)} {...props}>{children}</div>
);

const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-5 pt-5 border-t border-[rgba(99,102,241,0.1)] flex items-center justify-between gap-3', className)} {...props}>{children}</div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
