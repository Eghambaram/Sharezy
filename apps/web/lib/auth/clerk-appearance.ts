/**
 * Clerk component theming. Clerk needs literal colours, so these mirror the
 * tokens in app/globals.css — keep them in sync.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0b1f4d",
    colorText: "#111827",
    colorTextSecondary: "#4b5563",
    colorDanger: "#dc2626",
    colorSuccess: "#0a7365",
    borderRadius: "12px",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
} as const;
