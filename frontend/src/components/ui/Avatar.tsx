import { getInitials, cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const gradients = [
  'from-brand-500 to-violet-500',
  'from-cyan-500 to-brand-500',
  'from-emerald-500 to-cyan-500',
  'from-violet-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
];

const nameToGradient = (name: string) => {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[code % gradients.length];
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-xl object-cover flex-shrink-0', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-white bg-gradient-to-br',
        nameToGradient(name),
        sizeMap[size],
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
