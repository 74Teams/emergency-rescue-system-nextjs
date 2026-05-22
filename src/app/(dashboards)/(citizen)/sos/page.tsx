"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/client";
import { useCreateCitizenRequestMutation } from "@/lib/api/features/requests/citizen.queries";
import type { EmergencyCategory, RequestPriority } from "@/types/request";

import {
  Loader2,
  LocateFixed,
  MapPin,
  Paperclip,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const emergencyCategoryToApiValue: Record<EmergencyCategory, number> = {
  FIRE: 1,
  FLOOD: 2,
  EARTHQUAKE: 3,
  MEDICAL: 4,
  TRAFFIC: 5,
  COLLAPSE: 6,
  LANDSLIDE: 7,
  OTHER: 8,
};
const priorityToApiValue: Record<RequestPriority, number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export default function SubmitRequestPage() {
  const createRequestMutation = useCreateCitizenRequestMutation();

  const [emergencyType, setEmergencyType] =
    useState<EmergencyCategory>("FLOOD");
  const [priority, setPriority] = useState<RequestPriority>("CRITICAL");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState("");
  const [attachments, setAttachments] = useState<
    { file: File; preview: string; type: string }[]
  >([]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(
          `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
        );
        toast.success("Đã lấy tọa độ hiện tại.");
      },
      () => toast.error("Không thể lấy vị trí hiện tại."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const nextFiles = Array.from(event.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
    }));

    setAttachments((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, attachmentIndex) => attachmentIndex !== index),
    );
  };

  const coordsValue = useMemo(() => coords.trim(), [coords]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!coordsValue) {
      toast.error("Vui lòng lấy tọa độ GPS trước khi gửi.");
      return;
    }

    const [latitude, longitude] = coordsValue
      .split(",")
      .map((value) => parseFloat(value.trim()));

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error("Tọa độ không hợp lệ.");
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        emergencyType: emergencyCategoryToApiValue[emergencyType],
        priority: priorityToApiValue[priority],
        description,
        address: address || "Chưa có địa chỉ",
        latitude,
        longitude,
        landmark: landmark || undefined,
        medias: attachments.map((item) => item.file),
      });

      toast.success("Đã gửi yêu cầu cứu trợ.");
      setEmergencyType("FLOOD");
      setPriority("CRITICAL");
      setAddress("");
      setLandmark("");
      setDescription("");
      setCoords("");
      setAttachments([]);
    } catch (error) {
      toast.error("Không thể gửi yêu cầu", {
        description: getApiErrorMessage(error),
      });
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-white">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            * Cấp bách
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-2 text-slate-900 tracking-tight">
            Gửi Yêu Cầu Cứu Trợ
          </h1>
          <p className="text-slate-500 mb-8">
            Cung cấp thông tin chính xác để đội cứu hộ tiếp cận bạn nhanh nhất.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Loại sự cố *
                </label>
                <Select
                  value={emergencyType}
                  onValueChange={(value) =>
                    setEmergencyType(value as EmergencyCategory)
                  }
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl">
                    <SelectValue placeholder="Chọn loại sự cố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRE">Hỏa hoạn / Cháy nổ</SelectItem>
                    <SelectItem value="FLOOD">Ngập lụt / Lũ quét</SelectItem>
                    <SelectItem value="MEDICAL">Cấp cứu y tế</SelectItem>
                    <SelectItem value="LANDSLIDE">Sạt lở đất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Mức độ ưu tiên *
                </label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as RequestPriority)
                  }
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl">
                    <SelectValue placeholder="Chọn mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">
                      CRITICAL - Cực kỳ khẩn cấp
                    </SelectItem>
                    <SelectItem value="HIGH">HIGH - Nguy hiểm cao</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM - Trung bình</SelectItem>
                    <SelectItem value="LOW">LOW - Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Địa chỉ *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  className="pl-10 bg-slate-50 border-slate-200 h-12 text-md rounded-xl"
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Mốc nhận diện
              </label>
              <Input
                className="bg-slate-50 border-slate-200 h-12 rounded-xl"
                placeholder="Ví dụ: Gần trường học, ngã tư..."
                value={landmark}
                onChange={(event) => setLandmark(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Tọa độ GPS *
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  className="bg-slate-50 border-slate-200 h-12 rounded-xl font-mono flex-1"
                  placeholder="16.05440, 108.20220"
                  value={coords}
                  onChange={(event) => setCoords(event.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGetLocation}
                  className="bg-slate-100 hover:bg-slate-200 text-[#003da5] h-12 px-6 rounded-xl font-semibold"
                >
                  <LocateFixed className="w-5 h-5 mr-2" />
                  Lấy vị trí hiện tại
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Mô tả tình trạng hiện tại *
              </label>
              <Textarea
                className="bg-slate-50 border-slate-200 min-h-[120px] rounded-xl text-md p-4"
                placeholder="Ví dụ: Đang bị cô lập do nước dâng cao, cần lương thực và nước uống cho 3 người..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                Đính kèm minh chứng
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                {attachments.map((item, index) => (
                  <div
                    key={index}
                    className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-white"
                  >
                    {item.type === "image" ? (
                      <Image
                        src={item.preview}
                        alt="Tệp đính kèm"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Paperclip className="text-slate-400 w-5 h-5" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-white hover:border-[#003da5] transition-all group">
                  <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-[#003da5]" />
                  <span className="text-[9px] text-slate-500 font-medium">
                    Thêm file
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={createRequestMutation.isPending}
              className="w-full md:w-auto bg-[#003da5] hover:bg-blue-800 text-white h-14 px-8 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
            >
              {createRequestMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              Gửi Yêu Cầu
              <Send className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>

        <div className="w-full lg:w-[350px] space-y-6">
          <div className="bg-[#f0f7ff] rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 text-[#003da5] font-bold mb-4 text-lg">
              <UploadCloud className="w-6 h-6" />
            </div>
            <ul className="space-y-4 text-sm text-blue-900">
              <li className="flex gap-3">
                <span className="bg-blue-200 text-[#003da5] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  1
                </span>
                Giữ điện thoại luôn bật và đảm bảo có sóng.
              </li>
              <li className="flex gap-3">
                <span className="bg-blue-200 text-[#003da5] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  2
                </span>
                Nếu có thể, hãy di chuyển lên vị trí cao hơn.
              </li>
              <li className="flex gap-3">
                <span className="bg-blue-200 text-[#003da5] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  3
                </span>
                Sử dụng đèn pin hoặc vải màu sáng để làm tín hiệu.
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between text-lg">
              Đường dây nóng
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </h3>
            <div className="space-y-3 text-base">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-medium">Cứu hỏa</span>
                <span className="font-bold text-red-600">114</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-medium">Cấp cứu</span>
                <span className="font-bold text-red-600">115</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  Cứu hộ địa phương
                </span>
                <span className="font-bold text-[#003da5]">024 123 456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
