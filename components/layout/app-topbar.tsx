import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

type AppTopbarProps = {
  title: string;
  subtitle?: string;
};

export function AppTopbar({ title, subtitle }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-md">
      <div>
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <form action={logoutAction}>
        <Button variant="outline" size="sm" type="submit" className="text-xs">
          Logout
        </Button>
      </form>
    </header>
  );
}
