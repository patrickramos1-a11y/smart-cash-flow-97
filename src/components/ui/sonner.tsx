import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/60 group-[.toaster]:shadow-elevated group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          title: "font-display font-semibold text-sm",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-brand group-[.toast]:text-brand-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:!border-l-[hsl(var(--income))]",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:!border-l-[hsl(var(--expense))]",
          warning:
            "group-[.toaster]:border-l-4 group-[.toaster]:!border-l-[hsl(var(--warning))]",
          info:
            "group-[.toaster]:border-l-4 group-[.toaster]:!border-l-[hsl(var(--brand))]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
