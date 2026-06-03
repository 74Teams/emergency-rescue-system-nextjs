import { apiRequest } from "../../client";
import { apiRoutes } from "../../endpoints";
import { ApiResponse } from "../../common/common.types";
import { ContactSummary, CreateContactInput } from "./contacts.types";

function buildContactPayload(payload: CreateContactInput) {
  return {
    name: payload.name,
    phoneNumber: payload.phoneNumber,
    relationship: payload.relationship,
    email: payload.email || "",
  };
}

export const contactsApi = {
  create(payload: CreateContactInput) {
    return apiRequest<ApiResponse<string>>({
      method: "POST",
      url: apiRoutes.auth.contact,
      data: buildContactPayload(payload),
    });
  },
  list() {
    return apiRequest<ApiResponse<ContactSummary[]>>({
      method: "GET",
      url: apiRoutes.auth.contact,
    });
  },
  detail(contactId: string) {
    return apiRequest<ApiResponse<ContactSummary>>({
      method: "GET",
      url: `${apiRoutes.auth.contact}/${contactId}`,
    });
  },
  update(contactId: string, payload: CreateContactInput) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: `${apiRoutes.auth.contact}/${contactId}`,
      data: buildContactPayload(payload),
    });
  },
  remove(contactId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: `${apiRoutes.auth.contact}/${contactId}`,
    });
  },
};
