import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrandVoiceCopilot from "@/src/components/brand-voice/BrandVoiceCopilot";

describe("BrandVoiceCopilot", () => {
  it("opens picker on /seo-audit", async () => {
    const user = userEvent.setup();
    render(<BrandVoiceCopilot />);
    const input = screen.getByPlaceholderText(/seo-audit/i);
    await user.type(input, "/seo-audit https://example.com");
    const submit = screen.getByRole("button");
    await user.click(submit);
    // The dialog should open; we expect confirm button to be in the doc
    expect(await screen.findByText(/Confirm Agent Action/i)).toBeInTheDocument();
  });
});


