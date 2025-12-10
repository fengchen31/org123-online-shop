export default function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center space-x-1 ${className}`}>
      <span className="animate-bounce [animation-delay:-0.3s]">·</span>
      <span className="animate-bounce [animation-delay:-0.15s]">·</span>
      <span className="animate-bounce">·</span>
    </span>
  );
}

export { LoadingDots };
