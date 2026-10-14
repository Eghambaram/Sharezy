import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";
import { EMPTY_PROFILE, profileCompleteness, type ProfileView } from "@dx/shared";
import { AuthClientProvider } from "@/lib/auth/auth-context";
import { ProfileForm } from "./profile-form";

vi.mock("@/lib/auth/dev-session", () => ({ getDevToken: vi.fn(), signOutDev: vi.fn() }));

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AuthClientProvider client={{ mode: "dev", getToken: async () => "t.t.t", signOut: async () => {} }}>
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="always">{children}</MotionConfig>
        </LazyMotion>
      </AuthClientProvider>
    </QueryClientProvider>
  );
}

function viewWith(overrides: Partial<ProfileView["profile"]>, verifiedPhone: boolean): ProfileView {
  const profile = { ...EMPTY_PROFILE, firstName: "Alex", lastName: "Morgan", ...overrides };
  return {
    profile,
    verified: { email: false, phone: verifiedPhone },
    completeness: profileCompleteness(profile),
    saved: true,
    updatedAt: new Date(0).toISOString(),
  };
}

describe("ProfileForm", () => {
  it("shows the verified badge only for the provider-verified value, and hides it when edited", () => {
    render(wrap(<ProfileForm view={viewWith({ phone: "+919876543210" }, true)} submitLabel="Save" onSaved={() => {}} />));
    expect(screen.getByText("Verified")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Mobile number/), { target: { value: "98123 45678" } });
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("never shows a badge for an unverified number", () => {
    render(wrap(<ProfileForm view={viewWith({ phone: "+919876543210" }, false)} submitLabel="Save" onSaved={() => {}} />));
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("blocks saving without a name and says why", async () => {
    const onSaved = vi.fn();
    render(wrap(<ProfileForm view={viewWith({ firstName: null, lastName: null }, false)} submitLabel="Save" onSaved={onSaved} />));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Enter your first name")).toBeInTheDocument());
    expect(screen.getByLabelText("First name")).toHaveAttribute("aria-invalid", "true");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
