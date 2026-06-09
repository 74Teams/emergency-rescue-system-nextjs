"use client";

import { UserAccountMenu } from "@/components/shared/UserAccountMenu";

export function CitizenHeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <UserAccountMenu showLoginWhenGuest avatarSize="md" />
    </div>
  );
}
