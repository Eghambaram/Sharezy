import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";

test.describe("business sign-in (dev mode)", () => {
  test("dashboard redirects to business login when signed out", async ({ page }) => {
    await page.goto("/biz/dashboard");
    await expect(page).toHaveURL(/\/biz\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("owner signs in and sees their organization and role", async ({ page }) => {
    await page.goto("/biz/login");
    await page.getByRole("link", { name: "Continue with Google" }).click();
    await expect(page).toHaveURL(/\/dev\/sign-in\?as=business/);
    await page.getByRole("button", { name: /Ramesh Kumar/ }).click();

    await expect(page).toHaveURL(/\/biz\/dashboard$/);
    await expect(page.getByText("Maple Grove Properties")).toBeVisible();
    await expect(page.getByText("Owner")).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/biz\/login$/);
  });
});
