"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalInfoForm } from "@/components/profile/personal-info-form";
import { AddressForm } from "@/components/profile/address-form";
import { EmergencyContacts } from "@/components/profile/emergency-contacts";
import { SecuritySettings } from "@/components/profile/security-settings";
import { useProfileQuery } from "@/hooks/use-profile-page";
import Link from "next/link";
import {
  UserIcon,
  MapPinIcon,
  PhoneCallIcon,
  ShieldIcon,
  ArrowLeft,
} from "lucide-react";

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfileQuery();

  return (
    <div className="min-h-screen bg-slate-50/50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/20 via-slate-50 to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white hover:bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="size-4" />
            Trang chủ
          </Link>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            Hồ sơ tài khoản
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <h1 className="sr-only">Trang cá nhân</h1>
          <ProfileHeader profile={profile} isLoading={isLoading} />
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-4 bg-slate-200/50 p-1 rounded-xl border border-slate-200/50 h-11">
            <TabsTrigger
              value="personal"
              className="flex items-center justify-center gap-1.5 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-slate-600 hover:text-slate-900"
              id="tab-personal"
            >
              <UserIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm font-semibold">Cá nhân</span>
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="flex items-center justify-center gap-1.5 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-slate-600 hover:text-slate-900"
              id="tab-address"
            >
              <MapPinIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm font-semibold">Địa chỉ</span>
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="flex items-center justify-center gap-1.5 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-slate-600 hover:text-slate-900"
              id="tab-contacts"
            >
              <PhoneCallIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm font-semibold">Liên hệ</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center justify-center gap-1.5 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-slate-600 hover:text-slate-900"
              id="tab-security"
            >
              <ShieldIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm font-semibold">Bảo mật</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0 outline-none">
            <PersonalInfoForm profile={profile} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="address" className="mt-0 outline-none">
            <AddressForm profile={profile} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="contacts" className="mt-0 outline-none">
            <EmergencyContacts />
          </TabsContent>

          <TabsContent value="security" className="mt-0 outline-none">
            <SecuritySettings profile={profile} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
