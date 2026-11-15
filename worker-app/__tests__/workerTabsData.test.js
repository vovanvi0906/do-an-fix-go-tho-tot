import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import Jobs from "../app/(worker)/(tabs)/jobs";
import Earnings from "../app/(worker)/(tabs)/earnings";
import Notifications from "../app/(worker)/(tabs)/notifications";
import { apiClient } from "../src/services/api/apiClient";
const mockPush = jest.fn(),
  mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
  useFocusEffect: (cb) => require("react").useEffect(cb, [cb]),
}));
jest.mock("../src/features/auth", () => ({
  useAuth: () => ({ user: { id: "worker" } }),
}));
jest.mock("../src/services/api/apiClient", () => ({
  apiClient: { get: jest.fn() },
}));
jest.mock("../src/services/socket/socketService", () => ({
  socketService: { on: jest.fn(), off: jest.fn() },
}));
const order = {
  id: "order-123456",
  status: "COMPLETED",
  service: { name: "Sửa điện" },
  addressText: "Địa chỉ khách",
  estimatedPrice: 200000,
  updatedAt: "2026-11-15T01:00:00Z",
  payment: {
    status: "PAID",
    workerPayoutAmount: 170000,
    commissionAmount: 30000,
    paidAt: "2026-11-15T01:00:00Z",
  },
};
const result = (data) => ({
  data,
  pagination: { page: 1, total: data.length, totalPages: 1 },
});
beforeEach(() => {
  jest.clearAllMocks();
  apiClient.get.mockResolvedValue(result([order]));
});
it("jobs uses backend orders and opens the selected order by ID", async () => {
  const ui = render(<Jobs />);
  await waitFor(() => expect(ui.getByText("Sửa điện")).toBeTruthy());
  fireEvent.press(ui.getByText("Sửa điện"));
  expect(mockPush).toHaveBeenCalledWith("/(worker)/job/order-123456");
  expect(apiClient.get).toHaveBeenCalledWith("/orders", {
    params: { page: 1, limit: 20 },
  });
});
it("earnings sums actual worker payouts and excludes unpaid orders", async () => {
  apiClient.get.mockResolvedValue(
    result([
      order,
      {
        ...order,
        id: "unpaid",
        payment: {
          ...order.payment,
          status: "PENDING",
          workerPayoutAmount: 900000,
        },
      },
    ]),
  );
  const ui = render(<Earnings />);
  await waitFor(() => expect(ui.getByText("170.000 đ")).toBeTruthy());
  expect(ui.queryByText("900.000 đ")).toBeNull();
  expect(ui.getByText(/không phải số dư ví/)).toBeTruthy();
});
it("updates show actual order status and a retry after network failure", async () => {
  apiClient.get.mockRejectedValueOnce(Error("Mất kết nối"));
  const ui = render(<Notifications />);
  await waitFor(() => expect(ui.getByText("Mất kết nối")).toBeTruthy());
  fireEvent.press(ui.getByText("Thử lại"));
  await waitFor(() => expect(ui.getByText("Hoàn thành")).toBeTruthy());
  fireEvent.press(ui.getByText("Hoàn thành"));
  expect(mockPush).toHaveBeenCalledWith("/(worker)/job/order-123456");
});
