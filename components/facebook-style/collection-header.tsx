'use client';

interface CollectionHeaderProps {
  title: string;
  description: string;
  productCount: number;
}

export function CollectionHeader({ title, description, productCount }: CollectionHeaderProps) {
  if (!description) return null;

  return (
    <div className="mb-3 sm:mb-4">
      <p className="text-sm leading-relaxed text-gray-700">{description}</p>
    </div>
  );
}
