import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-medium leading-normal transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
        outline: 'border-border bg-card text-foreground',
        urgent: 'border-[hsl(var(--urgency-urgent)/0.3)] bg-[hsl(var(--urgency-urgent)/0.1)] text-[hsl(var(--urgency-urgent))] font-semibold',
        priority: 'border-[hsl(var(--urgency-priority)/0.3)] bg-[hsl(var(--urgency-priority)/0.12)] text-[hsl(var(--urgency-priority))] font-semibold',
        routine: 'border-[hsl(var(--urgency-routine)/0.3)] bg-[hsl(var(--urgency-routine)/0.12)] text-[hsl(var(--urgency-routine))] font-semibold',
        provenance: 'border-border bg-muted/60 text-muted-foreground font-mono text-[10px] uppercase tracking-wider',
        accent: 'border-accent/30 bg-accent/10 text-accent font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
