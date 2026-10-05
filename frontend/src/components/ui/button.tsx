import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[6px] text-xs font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.99]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20',
        outline: 'border border-border bg-card text-foreground hover:bg-muted hover:border-muted-foreground/30 shadow-2xs',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent',
        ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-8 px-3 py-1.5',
        sm: 'h-7 rounded-[5px] px-2.5 text-[11px]',
        lg: 'h-9 rounded-[6px] px-4 text-xs',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
