import CommandCenter from "@/components/dashboards/commander/CommandCenter";

/**
 * Page Commander cho Command Center
 *
 * NHIỆM VỤ CỦA FILE:
 * - Next.js page component cho route /commander
 * - Render CommandCenter component
 * - Page-level metadata và SEO
 *
 * DATA FLOW:
 * 1. Next.js render page
 * 2. Page render CommandCenter component
 * 3. CommandCenter fetch và render data
 *
 * CƠ CHẾ REALTIME:
 * - Không có realtime ở page level
 * - Realtime được handle ở component level
 *
 * LEAFLET MAP INTEGRATION:
 * - Không có trực tiếp Leaflet ở page level
 * - Leaflet được handle ở MapView component
 */

export const metadata = {
  title: "Command Center - RescueSystem",
  description: "Trung tâm điều phối đội cứu hộ",
};

export default function CommanderPage() {
  return <CommandCenter />;
}
