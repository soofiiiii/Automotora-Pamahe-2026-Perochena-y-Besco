type AppLogoProps = {
  compact?: boolean;
  className?: string;
  variant?: "default" | "inverse";
};

export function AppLogo({
  compact = false,
  className = "",
  variant = "default",
}: AppLogoProps) {
  return (
    <div className={`app-logo ${className}`}>
      <img
        src={
          variant === "inverse"
            ? "/branding/Logo Pamahe.png"
            : "/branding/pamahe-logo.png"
        }
        alt="Automotora Pamahe"
        className={
          compact
            ? "h-9 w-auto object-contain"
            : "h-11 w-auto object-contain sm:h-12"
        }
      />
    </div>
  );
}
