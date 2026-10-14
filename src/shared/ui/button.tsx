export function Button({ className = "", ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={`rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
