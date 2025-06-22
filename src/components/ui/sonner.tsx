import { Toaster as Sonner, ToasterProps } from "sonner";

// Simple version of sonner toast component without theme integration
// since we're not using next-themes
const Toaster = ({ ...props }: ToasterProps) => {
  // Default to light theme - this can be changed based on your app's theme
  const theme = "light";

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          // Variables for consistent styling with shadcn/ui
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(222.2 47.4% 11.2%)",
          "--normal-border": "hsl(214.3 31.8% 91.4%)",
          "--success-bg": "hsl(143.8 80.7% 85%)",
          "--success-text": "hsl(140.6 100% 27.1%)",
          "--error-bg": "hsl(0 100% 97%)",
          "--error-text": "hsl(0 84.2% 60.2%)",
          "--info-bg": "hsl(210.6 100% 96.1%)",
          "--info-text": "hsl(221.2 83.2% 53.3%)",
          "--warning-bg": "hsl(47.9 95.8% 76.3%)",
          "--warning-text": "hsl(22.7 82.5% 31.4%)",
        } as React.CSSProperties
      }
      richColors
      expand={true}
      position="top-center"
      {...props}
    />
  );
};

export { Toaster };
