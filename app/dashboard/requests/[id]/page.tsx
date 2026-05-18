import RequestDetailClient from "@/components/dashboard/RequestDetailClient"

export default async function DashboardRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <RequestDetailClient requestId={id} />
}
