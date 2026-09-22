import logo from "@/assets/ashokmart-logo.png";

export function Logo({
  className = "h-9",
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img src={logo} alt="AshokMart logo" className={className} width={1152} height={576} />
      {showTagline && (
        <p className="text-xs font-medium tracking-[0.22em] text-orange uppercase">
          Everything You Need. Delivered.
        </p>
      )}
    </div>
  );
}
