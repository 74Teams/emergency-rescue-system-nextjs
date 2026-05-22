"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PhoneCallIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Loader2Icon,
  UserPlusIcon,
  HeartHandshakeIcon,
} from "lucide-react";
import type { ContactSummary, CreateContactInput } from "@/lib/api/types";
import {
  useContactsQuery,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/hooks/use-profile-page";

const relationshipOptions = [
  { value: "Father", label: "Cha" },
  { value: "Mother", label: "Mẹ" },
  { value: "Brother", label: "Anh/Em trai" },
  { value: "Sister", label: "Chị/Em gái" },
  { value: "Spouse", label: "Vợ/Chồng" },
  { value: "Child", label: "Con" },
  { value: "Friend", label: "Bạn bè" },
  { value: "Colleague", label: "Đồng nghiệp" },
  { value: "Other", label: "Khác" },
];

function getRelationshipLabel(value: string): string {
  return (
    relationshipOptions.find((opt) => opt.value === value)?.label ?? value
  );
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
  contact: ContactSummary;
  onEdit: (contact: ContactSummary) => void;
  onDelete: (contactId: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="group relative flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      {/* Avatar circle */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HeartHandshakeIcon className="size-5" />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{contact.name}</span>
          <Badge variant="outline" className="shrink-0">
            {getRelationshipLabel(contact.relationship)}
          </Badge>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <PhoneCallIcon className="size-3.5" />
          {contact.phone}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(contact)}
          aria-label="Chỉnh sửa liên hệ"
        >
          <PencilIcon data-icon="inline-start" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={isDeleting}
              aria-label="Xóa liên hệ"
            >
              {isDeleting ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : (
                <TrashIcon data-icon="inline-start" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa liên hệ khẩn cấp?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa <strong>{contact.name}</strong> khỏi danh
                sách liên hệ khẩn cấp? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(contact.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContact: ContactSummary | null;
  onSave: (payload: CreateContactInput) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  // Sync when editContact changes
  useState(() => {
    if (editContact) {
      setName(editContact.name);
      setPhone(editContact.phone);
      setRelationship(editContact.relationship);
    } else {
      setName("");
      setPhone("");
      setRelationship("");
    }
  });

  // Reset when open changes
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && editContact) {
      setName(editContact.name);
      setPhone(editContact.phone);
      setRelationship(editContact.relationship);
    } else if (nextOpen && !editContact) {
      setName("");
      setPhone("");
      setRelationship("");
    }
    onOpenChange(nextOpen);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, phone, relationship });
  }

  const isEdit = !!editContact;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Chỉnh sửa liên hệ khẩn cấp"
              : "Thêm liên hệ khẩn cấp"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin liên hệ khẩn cấp của bạn."
              : "Thêm người liên hệ để hệ thống thông báo khi có tình huống khẩn cấp."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contact-name">
                Họ và tên <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn B"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-phone">
                Số điện thoại <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0987654321"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-relationship">
                Mối quan hệ <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="contact-relationship">
                  <SelectValue placeholder="Chọn mối quan hệ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {relationshipOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!name || !phone || !relationship || isPending}
            >
              {isPending ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : isEdit ? (
                <PencilIcon data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {isEdit ? "Cập nhật" : "Thêm liên hệ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────
export function EmergencyContacts() {
  const { data: contacts, isLoading } = useContactsQuery();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<ContactSummary | null>(null);

  function handleAddNew() {
    setEditContact(null);
    setDialogOpen(true);
  }

  function handleEdit(contact: ContactSummary) {
    setEditContact(contact);
    setDialogOpen(true);
  }

  function handleSave(payload: CreateContactInput) {
    if (editContact) {
      updateMutation.mutate(
        { contactId: editContact.id, payload },
        {
          onSuccess: () => setDialogOpen(false),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  }

  function handleDelete(contactId: string) {
    deleteMutation.mutate(contactId);
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
    );
  }

  const contactList = contacts ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="flex items-center gap-2">
                <PhoneCallIcon className="size-5 text-primary" />
                Liên hệ khẩn cấp
              </CardTitle>
              <CardDescription>
                Danh sách người liên hệ khi có tình huống khẩn cấp xảy ra.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddNew}>
              <UserPlusIcon data-icon="inline-start" />
              Thêm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {contactList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <PhoneCallIcon className="size-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  Chưa có liên hệ khẩn cấp
                </p>
                <p className="text-sm text-muted-foreground">
                  Hãy thêm người thân để liên hệ khi cần thiết.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddNew}>
                <PlusIcon data-icon="inline-start" />
                Thêm liên hệ đầu tiên
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {contactList.map((contact) => (
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
          <CardFooter className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
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
  );
}
