import { getDeliverySpeedByBatch, getRecentDeliverySpeed } from "@/lib/admin/delivery-speed";
import { AdminDeliverySpeedView } from "@/components/admin/admin-delivery-speed-view";

export default async function AdminDeliverySpeedPage() {
  const [recent, batch] = await Promise.all([
    getRecentDeliverySpeed(),
    getDeliverySpeedByBatch(),
  ]);

  return <AdminDeliverySpeedView recent={recent} batch={batch} />;
}
