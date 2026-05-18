import Image from "next/image"

type ProviderAvatarProps = {
  name?: string | null
  imageUrl?: string | null
  size?: "sm" | "md" | "lg"
}

const sizeClass = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
}

function initialsFor(name?: string | null) {
  const cleaned = (name || "Hilfinio Anbieter").trim()
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export default function ProviderAvatar({ name, imageUrl, size = "md" }: ProviderAvatarProps) {
  const classes = `${sizeClass[size]} grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/80 bg-[var(--brand)] text-center font-bold text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)] dark:border-slate-800`

  if (imageUrl) {
    return (
      <div className={classes}>
        <Image
          src={imageUrl}
          alt={name ? `${name} Profilbild` : "Anbieter Profilbild"}
          width={160}
          height={160}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return <div className={classes}>{initialsFor(name)}</div>
}
