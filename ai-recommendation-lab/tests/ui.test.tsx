// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { App } from "../src/main";
import { LabApi } from "../src/api";
import type { Diagnosis, ModelResult } from "../src/contracts";
const result: Diagnosis = {
  requestId: "request-1",
  status: "needs_more_info",
  imageUrl: "https://example.test/image",
  category: { id: "c", slug: "dien-lanh", name: "Điện lạnh" },
  target: null,
  suggestedTargetId: "t",
  availableCategories: [{ id: "c", name: "Điện lạnh" }],
  availableTargets: [
    { id: "t", name: "Tủ lạnh", slug: "tu-lanh", categoryId: "c" },
  ],
  suggestedServices: [],
  symptomCatalogEnabled: true,
};
const model: ModelResult = {
  engine: "model",
  suggestedCategoryId: "dien-lanh",
  categoryCandidates: [],
  targetCandidates: [],
};
beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:test"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(LabApi.prototype, "upload").mockResolvedValue(result);
  vi.spyOn(LabApi.prototype, "infer").mockResolvedValue(model);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function scan() {
  const f = new File(["test"], "fridge.jpg", { type: "image/jpeg" });
  Object.defineProperty(f, "slice", {
    value: () => ({
      arrayBuffer: async () => new Uint8Array([255, 216, 255]).buffer,
    }),
  });
  fireEvent.change(screen.getByLabelText("Upload ảnh thiết bị"), {
    target: { files: [f] },
  });
  fireEvent.click(screen.getByText(/Phân tích với API thật/));
  await screen.findByText("Điện lạnh");
}
describe("user flow", () => {
  it("requires explicit device confirmation and displays approved symptoms then real service mapping", async () => {
    const answer = vi
      .spyOn(LabApi.prototype, "answer")
      .mockResolvedValue({ ...result, target: result.availableTargets[0] });
    const symptoms = vi.spyOn(LabApi.prototype, "symptoms").mockResolvedValue([
      {
        id: "sym",
        targetId: "t",
        name: "Không lạnh",
        code: "cold",
        kind: "USER_REPORTED",
      },
    ]);
    vi.spyOn(LabApi.prototype, "recommend").mockResolvedValue({
      items: [
        {
          id: "svc",
          name: "Sửa tủ lạnh",
          reason: "Theo triệu chứng xác nhận",
          basePrice: 180000,
        },
      ],
    });
    render(<App />);
    await scan();
    fireEvent.click(screen.getByText("Xác nhận thiết bị & chọn triệu chứng →"));
    expect(symptoms).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận thiết bị" }));
    await screen.findByText("Không lạnh");
    expect(answer).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "request-1" }),
      "",
      { categoryId: "c", targetId: "t" },
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Lấy tối đa 3 dịch vụ"));
    await screen.findByText("Sửa tủ lạnh");
    expect(screen.getByText("Theo triệu chứng xác nhận")).toBeTruthy();
  });
  it("shows disabled catalog failure and retry without inventing symptoms", async () => {
    vi.spyOn(LabApi.prototype, "answer").mockResolvedValue({
      ...result,
      target: result.availableTargets[0],
    });
    vi.spyOn(LabApi.prototype, "symptoms").mockRejectedValue(
      new Error("SYMPTOM_CATALOG_NOT_ENABLED"),
    );
    render(<App />);
    await scan();
    fireEvent.click(screen.getByText("Xác nhận thiết bị & chọn triệu chứng →"));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận thiết bị" }));
    await screen.findByRole("alert");
    expect(screen.getByText("SYMPTOM_CATALOG_NOT_ENABLED")).toBeTruthy();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByText("Thử lại thao tác")).toBeTruthy();
  });
  it("locks duplicate scan clicks and invalidates results after description changes", async () => {
    render(<App />);
    await scan();
    expect(LabApi.prototype.upload).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByPlaceholderText(/Ví dụ:/), {
      target: { value: "new description" },
    });
    await waitFor(() => expect(screen.queryByText("request-1")).toBeNull());
    expect(screen.getByText("Sẵn sàng kiểm thử")).toBeTruthy();
  });
});

describe("retry configuration regression", () => {
  it("uses the updated timeout after a failed scan", async () => {
    const usedTimeouts: number[] = [];
    vi.spyOn(LabApi.prototype, "upload").mockImplementation(async function (
      this: LabApi,
    ) {
      usedTimeouts.push(this.config.timeoutMs);
      if (usedTimeouts.length === 1) throw new Error("API_TIMEOUT");
      return result;
    });
    render(<App />);
    const f = new File(["test"], "fridge.jpg", { type: "image/jpeg" });
    Object.defineProperty(f, "slice", {
      value: () => ({
        arrayBuffer: async () => new Uint8Array([255, 216, 255]).buffer,
      }),
    });
    fireEvent.change(screen.getByLabelText("Upload ảnh thiết bị"), {
      target: { files: [f] },
    });
    fireEvent.click(screen.getByText(/Phân tích với API thật/));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByText("⚙ Kết nối API"));
    fireEvent.change(screen.getByLabelText("Timeout (ms)"), {
      target: { value: "60000" },
    });
    fireEvent.click(screen.getByText("Thử lại thao tác"));
    await screen.findByText("Điện lạnh");
    expect(usedTimeouts).toEqual([45000, 60000]);
  });
});
