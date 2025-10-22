import Image from 'next/image';
import clsx from 'clsx';

interface GridTileImageProps {
  alt: string;
  src: string;
  width: number;
  height: number;
  active?: boolean;
  className?: string;
}

export function GridTileImage({
  alt,
  src,
  width,
  height,
  active = false,
  className
}: GridTileImageProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden border-2',
        active ? 'border-blue-600' : 'border-neutral-200 dark:border-neutral-800',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
