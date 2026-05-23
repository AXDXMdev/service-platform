import HomePageClient from "@/components/HomePageClient"

export const revalidate = 120

export default function HomePage() {
  return <HomePageClient initialFeaturedServices={[]} initialRatingsByService={{}} />
}
