import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";

test.describe("customer sign-in (dev mode)", () => {
  test("protected routes redirect to welcome", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole("heading", { name: "Your information. Your choice." })).toBeVisible();
  });

  test("welcome shows the dev banner, honest footnote, and passes axe", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByRole("note", { name: "Development simulation" })).toBeVisible();
    await expect(page.getByText("Creating a profile doesn't verify your real-world identity.")).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("sign in as a synthetic customer, see account, sign out", async ({ page }) => {
    await page.goto("/welcome");
    await page.getByRole("link", { name: "Continue with mobile number" }).click();
    await expect(page).toHaveURL(/\/dev\/sign-in\?as=customer/);
    await expect(page.getByText("This is not real authentication.")).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    await page.getByRole("button", { name: /Alex Morgan/ }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("heading", { name: "You're signed in" })).toBeVisible();
    // Seeded contacts were never verified, so no badge and no unverified values shown.
    await expect(page.getByText("No verified mobile number")).toBeVisible();
    await expect(page.getByText("Verified", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Sample data")).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    // Signed in → welcome bounces to home.
    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("a rejected session signs out instead of looping", async ({ page, context }) => {
    await context.addCookies([{ name: "dx_dev_session", value: "a.b.c", url: "http://localhost:3000" }]);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/welcome$/, { timeout: 15_000 });
    expect((await context.cookies()).find((c) => c.name === "dx_dev_session")).toBeUndefined();
  });

  test("new synthetic customer gets an empty account", async ({ page }) => {
    await page.goto("/dev/sign-in?as=customer");
    await page.getByRole("button", { name: /Start as a new customer/ }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText("No verified email address")).toBeVisible();
  });
});
