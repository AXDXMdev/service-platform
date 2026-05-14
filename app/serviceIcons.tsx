import type { ServiceCategory } from "@/app/serviceCatalog"

type IconProps = {
  slug: ServiceCategory["slug"]
  className?: string
}

export function ServiceCategoryIcon({ slug, className }: IconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ?? "h-5 w-5",
    "aria-hidden": true,
  }

  switch (slug) {
    case "cleaning":
      return (
        <svg {...common}>
          <path d="M4 20h9" />
          <path d="M8 4v16" />
          <path d="M8 8h8l-1.5 5H8" />
        </svg>
      )
    case "repair":
      return (
        <svg {...common}>
          <path d="M14 3a3 3 0 0 0 4 4l-8 8a2 2 0 1 1-3-3l8-8a3 3 0 0 0-1-1z" />
          <path d="M3 21l4-4" />
        </svg>
      )
    case "moving":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="12" height="10" rx="1.5" />
          <path d="M15 10h3l3 3v4h-6" />
          <circle cx="8" cy="18.5" r="1.5" />
          <circle cx="18" cy="18.5" r="1.5" />
        </svg>
      )
    case "tutoring":
      return (
        <svg {...common}>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M7 10v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4" />
        </svg>
      )
    case "wellness":
      return (
        <svg {...common}>
          <path d="M12 21s-6.5-4.2-6.5-9A3.5 3.5 0 0 1 12 9a3.5 3.5 0 0 1 6.5 3c0 4.8-6.5 9-6.5 9z" />
        </svg>
      )
    case "it":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </svg>
      )
    case "first-aid":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.8-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.2-7 10-7 10z" />
          <path d="M12 9v6" />
          <path d="M9 12h6" />
        </svg>
      )
    case "volunteer":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.8-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.2-7 10-7 10z" />
          <path d="M9.5 12.5h5" />
          <path d="M12 10v5" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}
