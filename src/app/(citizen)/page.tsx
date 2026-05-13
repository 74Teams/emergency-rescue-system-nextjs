
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/AppSidebar";
import { useCitizenRequestsQuery } from "@/lib/api/citizen-requests";
import { getRoleRedirectPath } from "@/lib/api/use-auth";
import { getStoredAccessToken, getStoredUser } from "@/lib/api/storage";

const MapComponent = dynamic(() => import("@/components/citizen/CitizenMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      Đang tải bản đồ Cứu Hộ...
    </div>
  ),
});

type AuthStatus = "checking" | "authorized" | "redirecting";

export default function CitizenDashboard() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const accessToken = getStoredAccessToken();
    const user = getStoredUser();

    if (!accessToken || !user) {
      router.replace("/login");
      setAuthStatus("redirecting");
      return;
    }

    const targetPath = getRoleRedirectPath(user.roles);
    if (targetPath !== "/") {
      router.replace(targetPath);
      setAuthStatus("redirecting");
      return;
    }

    setAuthStatus("authorized");
  }, [router]);

  if (authStatus !== "authorized") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="size-5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
          <span className="text-sm font-medium">Đang kiểm tra đăng nhập...</span>
        </div>
      </div>
    );
  }

  return <CitizenDashboardContent />;
}

function CitizenDashboardContent() {
  const { data } = useCitizenRequestsQuery();
  const requestsList = data?.items ?? [];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <AppSidebar requests={requestsList} />

      <main className="flex-1 relative z-0">
        <MapComponent requests={requestsList} />
      </main>
    </div>
  );
}
