import clsx from 'clsx';
import Image from 'next/image';

export default function LogoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <div className={clsx('relative', props.className)} style={{ width: '100%', height: '100%' }}>
      <Image
        src="/images/avatars/org123_logo.svg"
        alt={`${process.env.SITE_NAME} logo`}
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
