"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalInfoForm } from "@/components/profile/personal-info-form";
import { AddressForm } from "@/components/profile/address-form";
import { EmergencyContacts } from "@/components/profile/emergency-contacts";
import { SecuritySettings } from "@/components/profile/security-settings";
import { useProfileQuery } from "@/hooks/use-profile-page";
import {
  UserIcon,
  MapPinIcon,
  PhoneCallIcon,
  ShieldIcon,
} from "lucide-react";

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfileQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="sr-only">Trang cá nhân</h1>
          <ProfileHeader profile={profile} isLoading={isLoading} />
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger
              value="personal"
              className="flex items-center gap-1.5"
              id="tab-personal"
            >
              <UserIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm">Cá nhân</span>
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="flex items-center gap-1.5"
              id="tab-address"
            >
              <MapPinIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm">Địa chỉ</span>
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="flex items-center gap-1.5"
              id="tab-contacts"
            >
              <PhoneCallIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm">Liên hệ</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-1.5"
              id="tab-security"
            >
              <ShieldIcon className="size-4 hidden sm:inline" />
              <span className="text-xs sm:text-sm">Bảo mật</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            <PersonalInfoForm profile={profile} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="address" className="mt-0">
            <AddressForm profile={profile} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="contacts" className="mt-0">
            <EmergencyContacts />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SecuritySettings profile={profile} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
