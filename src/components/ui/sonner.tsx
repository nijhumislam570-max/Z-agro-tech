import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Audit P2: Hardcoded theme="light" (was useTheme() from next-themes).
 * Sonner now reads our brand-themed semantic tokens via the classNames map,
 * so it picks up dark mode automatically through CSS variables — no need
 * to flip Sonner's internal theme.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      // Accessibility: Ensure screen readers announce toasts
      richColors
      closeButton
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:min-h-[44px] group-[.toast]:min-w-[44px]",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:min-h-[44px] group-[.toast]:min-w-[44px]",
          closeButton: "group-[.toast]:min-h-[44px] group-[.toast]:min-w-[44px]",
        },
        // Sonner has built-in aria-live support
        duration: 5000,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
