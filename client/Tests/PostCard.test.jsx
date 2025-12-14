// client/Tests/PostCard.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ✅ Mock API_BASE BEFORE importing PostCard
vi.mock("../src/api", () => ({
  API_BASE: "http://localhost:3001",
}));

// ✅ Mock redux
vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
}));

import { useSelector } from "react-redux";
import PostCard from "../src/Components/PostCard";

describe("PostCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should disable like button when user is not logged in", () => {
    useSelector.mockImplementation((fn) => fn({ users: { user: null } }));

    const post = {
      _id: "p1",
      text: "Hello",
      likes: [],
      commentsCount: 0,
      author: { _id: "u1", firstname: "Safa", lastname: "A" },
    };

    render(
      <MemoryRouter>
        <PostCard post={post} onLike={vi.fn()} onComment={vi.fn()} />
      </MemoryRouter>
    );

    const likeBtn = screen.getByRole("button", { name: /like/i });
    expect(likeBtn).toBeDisabled();
  });

  it("should render post text when logged in", () => {
    useSelector.mockImplementation((fn) =>
      fn({ users: { user: { _id: "me1" } } })
    );

    const post = {
      _id: "p1",
      text: "Hello",
      likes: ["me1"],
      commentsCount: 2,
      author: { _id: "u1", firstname: "Safa", lastname: "A" },
    };

    render(
      <MemoryRouter>
        <PostCard post={post} onLike={vi.fn()} onComment={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
