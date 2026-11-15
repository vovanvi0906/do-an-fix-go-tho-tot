import { useCallback } from "react";
import { apiClient } from "../../services/api/apiClient";
import { useAuth } from "../auth";
import { useOrderRecovery } from "../orders/hooks/useOrderRecovery";
export function useWorkerOrders({ page = 1, status, limit = 20 } = {}) {
  const { user } = useAuth();
  const load = useCallback(async () => {
    const result = await apiClient.get("/orders", {
      params: { page, limit, ...(status ? { status } : {}) },
    });
    if (!Array.isArray(result?.data) || !result?.pagination)
      throw Error("Chưa đọc được danh sách công việc. Vui lòng thử lại.");
    return result;
  }, [page, status, limit]);
  return useOrderRecovery(load, user?.id);
}
