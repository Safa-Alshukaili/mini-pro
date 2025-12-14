// client/Tests/Compose.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ✅ Mock geo utils BEFORE importing Compose
vi.mock("../src/utils/geo", () => ({
  getMyLocation: vi.fn(async () => ({ lat: 23.6, lng: 58.5, accuracy: 10 })),
  reverseGeocodeOSM: vi.fn(async () => ({
    label: "Oman, Muscat",
    details: { country: "Oman", city: "Muscat" },
  })),
}));

// ✅ Mock redux
vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: vi.fn(),
}));

// ✅ Mock createPost thunk
vi.mock("../src/Features/postSlice", () => ({
  createPost: vi.fn(() => ({ type: "posts/createPost" })),
}));

import { useSelector } from "react-redux";
import Compose from "../src/Components/Compose";

describe("Compose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent submitting empty post (no text & no image)", () => {
    useSelector.mockImplementation((fn) =>
      fn({ users: { user: { _id: "me1" } } })
    );

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<Compose />);

    const postBtn = screen.getByRole("button", { name: /post/i });
    fireEvent.click(postBtn);

    expect(alertSpy).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
