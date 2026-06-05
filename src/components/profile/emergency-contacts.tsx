'use client'

import { useState } from 'react'
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    PhoneCallIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    Loader2Icon,
    UserPlusIcon,
    HeartHandshakeIcon,
} from 'lucide-react'
import type { ContactSummary, CreateContactInput } from '@/lib/api/types'
import {
    useContactsQuery,
    useCreateContact,
    useUpdateContact,
    useDeleteContact,
} from '@/hooks/use-profile-page'

const relationshipOptions = [
    { value: 'Father', label: 'Cha' },
    { value: 'Mother', label: 'Mẹ' },
    { value: 'Brother', label: 'Anh/Em trai' },
    { value: 'Sister', label: 'Chị/Em gái' },
    { value: 'Spouse', label: 'Vợ/Chồng' },
    { value: 'Child', label: 'Con' },
    { value: 'Friend', label: 'Bạn bè' },
    { value: 'Colleague', label: 'Đồng nghiệp' },
    { value: 'Other', label: 'Khác' },
]

function getRelationshipLabel(value: string): string {
    return relationshipOptions.find(opt => opt.value === value)?.label ?? value
}

// ────────────────────────────────────────────
// Contact Card
// ────────────────────────────────────────────
function ContactCard({
    contact,
    onEdit,
    onDelete,
    isDeleting,
}: {
    contact: ContactSummary
    onEdit: (contact: ContactSummary) => void
    onDelete: (contactId: string) => void
    isDeleting: boolean
}) {
    return (
        <div className="group relative flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm">
            <div className="flex items-center gap-4 min-w-0">
                {/* Avatar circle */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    <HeartHandshakeIcon className="size-5" />
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">
                            {contact.name}
                        </span>
                        <Badge
                            variant="outline"
                            className="shrink-0 bg-slate-50 text-slate-600 border-slate-200"
                        >
                            {getRelationshipLabel(contact.relationship)}
                        </Badge>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <PhoneCallIcon className="size-3.5 text-slate-400" />
                        {contact.phoneNumber}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(contact)}
                    aria-label="Chỉnh sửa liên hệ"
                    className="size-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                >
                    <PencilIcon className="size-4" />
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            disabled={isDeleting}
                            aria-label="Xóa liên hệ"
                        >
                            {isDeleting ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                                <TrashIcon className="size-4" />
                            )}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Xóa liên hệ khẩn cấp?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc muốn xóa{' '}
                                <strong>{contact.name}</strong> khỏi danh sách
                                liên hệ khẩn cấp? Hành động này không thể hoàn
                                tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-lg">
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDelete(contact.id)}
                                className="bg-red-600 text-white hover:bg-red-700 rounded-lg"
                            >
                                Xóa
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────
// Contact Form Dialog
// ────────────────────────────────────────────
function ContactFormDialog({
    open,
    onOpenChange,
    editContact,
    onSave,
    isPending,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    editContact: ContactSummary | null
    onSave: (payload: CreateContactInput) => void
    isPending: boolean
}) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [relationship, setRelationship] = useState('')

    // Sync when editContact changes
    useState(() => {
        if (editContact) {
            setName(editContact.name)
            setPhone(editContact.phoneNumber)
            setRelationship(editContact.relationship)
        } else {
            setName('')
            setPhone('')
            setRelationship('')
        }
    })

    // Reset when open changes
    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen && editContact) {
            setName(editContact.name)
            setPhone(editContact.phoneNumber)
            setRelationship(editContact.relationship)
        } else if (nextOpen && !editContact) {
            setName('')
            setPhone('')
            setRelationship('')
        }
        onOpenChange(nextOpen)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        onSave({ name, phoneNumber: phone, relationship })
    }

    const isEdit = !!editContact

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        {isEdit
                            ? 'Chỉnh sửa liên hệ khẩn cấp'
                            : 'Thêm liên hệ khẩn cấp'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        {isEdit
                            ? 'Cập nhật thông tin liên hệ khẩn cấp của bạn.'
                            : 'Thêm người liên hệ để hệ thống thông báo khi có tình huống khẩn cấp.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="contact-name"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Họ và tên{' '}
                            <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="contact-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn B"
                            required
                            className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="contact-phone"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Số điện thoại{' '}
                            <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="contact-phone"
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Ví dụ: 0987654321"
                            required
                            className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="contact-relationship"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Mối quan hệ{' '}
                            <span className="text-destructive">*</span>
                        </label>
                        <Select
                            value={relationship}
                            onValueChange={setRelationship}
                        >
                            <SelectTrigger
                                id="contact-relationship"
                                className="h-10 border-slate-200 rounded-lg px-3"
                            >
                                <SelectValue placeholder="Chọn mối quan hệ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {relationshipOptions.map(opt => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="h-10 px-5 border-slate-200 rounded-lg"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                !name || !phone || !relationship || isPending
                            }
                            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            {isPending ? (
                                <Loader2Icon className="size-4 mr-2 animate-spin" />
                            ) : null}
                            {isEdit ? 'Cập nhật' : 'Thêm liên hệ'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────
export function EmergencyContacts() {
    const { data: contacts, isLoading } = useContactsQuery()
    const createMutation = useCreateContact()
    const updateMutation = useUpdateContact()
    const deleteMutation = useDeleteContact()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editContact, setEditContact] = useState<ContactSummary | null>(null)

    function handleAddNew() {
        setEditContact(null)
        setDialogOpen(true)
    }

    function handleEdit(contact: ContactSummary) {
        setEditContact(contact)
        setDialogOpen(true)
    }

    function handleSave(payload: CreateContactInput) {
        if (editContact) {
            updateMutation.mutate(
                { contactId: editContact.id, payload },
                {
                    onSuccess: () => setDialogOpen(false),
                }
            )
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => setDialogOpen(false),
            })
        }
    }

    function handleDelete(contactId: string) {
        deleteMutation.mutate(contactId)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-[72px] w-full rounded-lg" />
                        <Skeleton className="h-[72px] w-full rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    const contactList = contacts ?? []

    return (
        <>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl p-6 md:p-8 ring-0">
                <CardHeader className="p-0 mb-6 flex flex-col gap-1.5 w-full">
                    <div className="flex items-center justify-between flex-wrap gap-4 w-full">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                                <PhoneCallIcon className="size-5 text-blue-600" />
                                Liên hệ khẩn cấp
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-500">
                                Danh sách người liên hệ khi có tình huống khẩn
                                cấp xảy ra.
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleAddNew}
                            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                            <UserPlusIcon className="size-4 mr-2" />
                            Thêm mới
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="px-0 pt-4">
                    {contactList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-12 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                                <PhoneCallIcon className="size-6 text-slate-400" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-slate-800">
                                    Chưa có liên hệ khẩn cấp
                                </p>
                                <p className="text-xs text-slate-400">
                                    Hãy thêm người thân để liên hệ khi cần
                                    thiết.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleAddNew}
                                className="h-9 px-4 border border-slate-200 rounded-lg mt-2 text-sm hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                            >
                                <PlusIcon className="size-4 mr-2" />
                                Thêm liên hệ đầu tiên
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {contactList.map(contact => (
                                <ContactCard
                                    key={contact.id}
                                    contact={contact}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    isDeleting={
                                        deleteMutation.isPending &&
                                        deleteMutation.variables === contact.id
                                    }
                                />
                            ))}
                        </div>
                    )}
                </CardContent>

                {contactList.length > 0 && (
                    <CardFooter className="px-0 pb-6 md:pb-8 mt-6 border-t border-slate-100 pt-6 flex justify-end bg-transparent">
                        <p className="text-xs text-slate-400">
                            Tổng cộng {contactList.length} liên hệ khẩn cấp
                        </p>
                    </CardFooter>
                )}
            </Card>

            <ContactFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editContact={editContact}
                onSave={handleSave}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </>
    )
}
