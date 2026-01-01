import { cn } from "@/lib/utils";

interface OAuthSeparatorProps {
  className?: string;
  text?: string;
}

/**
 * Visual separator between OAuth and credential-based authentication options.
 * Displays horizontal lines with centered text (typically "or").
 */
export function OAuthSeparator({
  className,
  text = "or",
}: OAuthSeparatorProps) {
  return (
    <div className={cn("relative my-4", className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}
