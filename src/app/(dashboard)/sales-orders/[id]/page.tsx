import SalesOrderDetailsPage from "@/components/cards/SalesOrderDetails";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SalesOrderDetailsPage id={id} />;
}
