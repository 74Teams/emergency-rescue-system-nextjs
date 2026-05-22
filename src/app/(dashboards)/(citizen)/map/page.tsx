"use client";

import dynamic from "next/dynamic";
import { useCitizenRequestsQuery } from "@/lib/api/features/requests/citizen.queries";
import { Loader2 } from "lucide-react";

// Dynamically import map component with ssr: false to prevent Leaflet window reference error during SSR.
const CitizenMap = dynamic(
  () => import("@/components/dashboards/citizen/CitizenMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-500">
            Đang tải bản đồ cứu hộ...
          </p>
        </div>
      </div>
    ),
  },
);

export default function CitizenMapPage() {
  const { data, isLoading } = useCitizenRequestsQuery();
  const requests = data?.items ?? [];

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative">
      <CitizenMap requests={requests} />
    </div>
  );
}
