import { FlaskConical } from 'lucide-react';

export function Logo({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizes = { sm: 'h-6 w-6', default: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} rounded-lg bg-primary flex items-center justify-center`}>
        <FlaskConical className="h-4/5 w-4/5 text-primary-foreground" />
      </div>
      <span className={`font-bold text-foreground ${size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'}`}>
        Laboratorio
      </span>
    </div>
  );
}
