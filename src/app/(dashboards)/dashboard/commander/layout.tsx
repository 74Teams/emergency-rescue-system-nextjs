import type { ReactNode } from "react";

/**
 * Layout cho Commander Dashboard
 *
 * NHIỆM VỤ CỦA FILE:
 * - Next.js layout component cho route group /commander
 * - Cung cấp shared layout cho tất cả commander pages
 * - Có thể thêm header, sidebar, navigation ở đây
 *
 * DATA FLOW:
 * 1. Next.js render layout
 * 2. Layout render children (page component)
 *
 * CƠ CHẾ REALTIME:
 * - Không có realtime ở layout level
 *
 * LEAFLET MAP INTEGRATION:
 * - Không có Leaflet ở layout level
 */

export default function CommanderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>
  );
}
