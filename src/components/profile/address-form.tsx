"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveIcon, Loader2Icon, MapPinIcon } from "lucide-react";
import type { Address, ProfileResponse, UpdateProfileRequest } from "@/lib/api/types";
import { useUpdateProfile } from "@/hooks/use-profile-page";

interface AddressFormProps {
  profile: ProfileResponse | undefined;
  isLoading: boolean;
}

export function AddressForm({ profile, isLoading }: AddressFormProps) {
  const updateMutation = useUpdateProfile();

  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [gps, setGps] = useState("");

  useEffect(() => {
    if (profile?.address) {
      setStreet(profile.address.street ?? "");
      setDistrict(profile.address.district ?? "");
      setCity(profile.address.city ?? "");
      setGps(profile.address.gps ?? "");
    }
  }, [profile]);

  const currentAddress = profile?.address ?? {};
  const isDirty =
    street !== (currentAddress.street ?? "") ||
    district !== (currentAddress.district ?? "") ||
    city !== (currentAddress.city ?? "") ||
    gps !== (currentAddress.gps ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const address: Address = {
      street: street || undefined,
      district: district || undefined,
      city: city || undefined,
      gps: gps || undefined,
    };

    const payload: UpdateProfileRequest = {
      fullName: profile?.fullName ?? "",
      phoneNumber: profile?.phoneNumber ?? "",
      address,
    };

    updateMutation.mutate(payload);
  }

  function handleReset() {
    setStreet(currentAddress.street ?? "");
    setDistrict(currentAddress.district ?? "");
    setCity(currentAddress.city ?? "");
    setGps(currentAddress.gps ?? "");
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinIcon className="size-5 text-primary" />
          Địa chỉ
        </CardTitle>
        <CardDescription>
          Địa chỉ cư trú của bạn sẽ được sử dụng khi cần hỗ trợ khẩn cấp.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="address-street">Đường / Số nhà</FieldLabel>
              <Input
                id="address-street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Ví dụ: 123 Đường Lê Lợi"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="address-district">Quận / Huyện</FieldLabel>
                <Input
                  id="address-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Ví dụ: Hoàn Kiếm"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="address-city">Thành phố / Tỉnh</FieldLabel>
                <Input
                  id="address-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ví dụ: Hà Nội"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="address-gps">Tọa độ GPS</FieldLabel>
              <Input
                id="address-gps"
                value={gps}
                onChange={(e) => setGps(e.target.value)}
                placeholder="Ví dụ: 21.0285,105.8542"
              />
              <FieldDescription>
                Tọa độ GPS (latitude,longitude) giúp xác định vị trí chính xác.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          {isDirty && (
            <Button type="button" variant="ghost" onClick={handleReset}>
              Hủy thay đổi
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            Lưu địa chỉ
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
