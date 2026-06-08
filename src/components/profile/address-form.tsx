'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SaveIcon, Loader2Icon, MapPinIcon } from 'lucide-react'
import type {
    Address,
    ProfileResponse,
    UpdateProfileRequest,
} from '@/lib/api/types'
import { useUpdateProfile } from '@/hooks/use-profile-page'

interface AddressFormProps {
    profile: ProfileResponse | undefined
    isLoading: boolean
}

export function AddressForm({ profile, isLoading }: AddressFormProps) {
    const updateMutation = useUpdateProfile()

    const [street, setStreet] = useState('')
    const [district, setDistrict] = useState('')
    const [city, setCity] = useState('')
    const [gps, setGps] = useState('')

    useEffect(() => {
        if (profile?.address) {
            setStreet(profile.address.street ?? '')
            setDistrict(profile.address.district ?? '')
            setCity(profile.address.city ?? '')
            setGps(profile.address.gps ?? '')
        }
    }, [profile])

    const currentAddress = profile?.address ?? {}
    const isDirty =
        street !== (currentAddress.street ?? '') ||
        district !== (currentAddress.district ?? '') ||
        city !== (currentAddress.city ?? '') ||
        gps !== (currentAddress.gps ?? '')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const address: Address = {
            street: street || undefined,
            district: district || undefined,
            city: city || undefined,
            gps: gps || undefined,
        }

        const payload: UpdateProfileRequest = {
            fullName: profile?.fullName ?? '',
            phoneNumber: profile?.phoneNumber ?? '',
            address,
        }

        updateMutation.mutate(payload)
    }

    function handleReset() {
        setStreet(currentAddress.street ?? '')
        setDistrict(currentAddress.district ?? '')
        setCity(currentAddress.city ?? '')
        setGps(currentAddress.gps ?? '')
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
        )
    }

    return (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl p-6 md:p-8 ring-0">
            <CardHeader className="p-0 mb-6 flex flex-col gap-1.5">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                    <MapPinIcon className="size-5 text-blue-600" />
                    Địa chỉ
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                    Địa chỉ cư trú của bạn sẽ được sử dụng khi cần hỗ trợ khẩn
                    cấp.
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="px-0 space-y-6">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="address-street"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Đường / Số nhà
                        </label>
                        <Input
                            id="address-street"
                            value={street}
                            onChange={e => setStreet(e.target.value)}
                            placeholder="Ví dụ: 123 Đường Lê Lợi"
                            className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="address-district"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Quận / Huyện
                            </label>
                            <Input
                                id="address-district"
                                value={district}
                                onChange={e => setDistrict(e.target.value)}
                                placeholder="Ví dụ: Hoàn Kiếm"
                                className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="address-city"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Thành phố / Tỉnh
                            </label>
                            <Input
                                id="address-city"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Ví dụ: Hà Nội"
                                className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="address-gps"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Tọa độ GPS
                        </label>
                        <Input
                            id="address-gps"
                            value={gps}
                            onChange={e => setGps(e.target.value)}
                            placeholder="Ví dụ: 21.0285,105.8542"
                            className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                        />
                        <p className="text-xs text-slate-400">
                            Tọa độ GPS (latitude,longitude) giúp xác định vị trí
                            chính xác.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="px-0 pb-6 md:pb-8 mt-6 border-t border-slate-100 pt-6 flex justify-end gap-3 bg-transparent">
                    {isDirty && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleReset}
                            className="h-10 px-5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                        >
                            Hủy thay đổi
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={!isDirty || updateMutation.isPending}
                        className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                    >
                        {updateMutation.isPending ? (
                            <Loader2Icon className="size-4 mr-2 animate-spin" />
                        ) : (
                            <SaveIcon className="size-4 mr-2" />
                        )}
                        Lưu địa chỉ
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
