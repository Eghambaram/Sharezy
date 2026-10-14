import { activityPageSchema, profileViewSchema } from "@dx/shared";
import { createTestApp, type TestApp } from "./app.js";

describe("profile + activity (integration)", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(async () => {
    await t.reset();
  });
  afterAll(async () => {
    await t.app.close();
  });

  const getProfile = async (subject: string) =>
    profileViewSchema.parse((await t.http().get("/v1/me/profile").set("Authorization", await t.bearer(subject)).expect(200)).body);
  const patch = async (subject: string, body: object, status: number) =>
    t.http().patch("/v1/me/profile").set("Authorization", await t.bearer(subject)).send(body).expect(status);

  it("requires authentication", async () => {
    await t.http().get("/v1/me/profile").expect(401);
    await t.http().patch("/v1/me/profile").send({ firstName: "X" }).expect(401);
  });

  it("starts empty and unsaved for a new user", async () => {
    const view = await getProfile("dev-new");
    expect(view).toMatchObject({ saved: false, updatedAt: null, verified: { email: false, phone: false } });
    expect(view.completeness).toEqual({ done: 0, total: 4, missing: ["FULL_NAME", "MOBILE", "EMAIL", "ADDRESS"] });
  });

  it("creates, updates, and clears fields", async () => {
    const created = profileViewSchema.parse(
      (await patch("dev-a", { firstName: "Alex", lastName: "Morgan", phone: "+919876543210" }, 200)).body,
    );
    expect(created).toMatchObject({ saved: true, profile: { firstName: "Alex", phone: "+919876543210", email: null } });
    expect(created.completeness.done).toBe(2);

    await patch("dev-a", { email: "alex@example.com" }, 200);
    const cleared = profileViewSchema.parse((await patch("dev-a", { phone: null, email: "" }, 200)).body);
    expect(cleared.profile).toMatchObject({ firstName: "Alex", phone: null, email: null });
  });

  it("requires a started address to be completed", async () => {
    const res = await patch("dev-a", { firstName: "A", lastName: "B", city: "Pune" }, 400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.details.fields)).toEqual(["addressLine1", "postalCode", "country"]);

    await patch("dev-a", { addressLine1: "1 MG Road", city: "Pune", postalCode: "411001", country: "IN" }, 200);
    // Clearing one required part of an existing address is rejected too.
    await patch("dev-a", { postalCode: null }, 400);
  });

  it("rejects invalid values without echoing them, and unknown keys", async () => {
    const res = await patch("dev-a", { phone: "+91-not-a-phone", email: "nope" }, 400);
    const text = JSON.stringify(res.body);
    expect(text).not.toContain("not-a-phone");
    expect(text).not.toContain("nope");
    expect(Object.keys(res.body.error.details.fields).sort()).toEqual(["email", "phone"]);

    const mass = await patch("dev-a", { firstName: "A", userId: "someone-else", verified: true }, 400);
    expect(mass.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("marks a contact verified only while it equals the provider-verified value", async () => {
    await t.prisma.user.create({ data: { authSubject: "dev-v", phone: "+919876543210", phoneVerified: true } });

    // Before the first save, the verified phone is suggested and flagged.
    const suggested = await getProfile("dev-v");
    expect(suggested).toMatchObject({ saved: false, profile: { phone: "+919876543210" }, verified: { phone: true, email: false } });

    await patch("dev-v", { firstName: "V", lastName: "One", phone: "+919876543210" }, 200);
    expect((await getProfile("dev-v")).verified.phone).toBe(true);

    await patch("dev-v", { phone: "+919812345678" }, 200);
    expect((await getProfile("dev-v")).verified.phone).toBe(false);
  });

  it("audits changed field names, never values", async () => {
    await patch("dev-a", { firstName: "Alex", lastName: "Morgan" }, 200);
    await patch("dev-a", { firstName: "Alex" }, 200); // no change, no event
    const events = await t.prisma.auditEvent.findMany({ where: { type: "PROFILE_UPDATED" } });
    expect(events).toHaveLength(1);
    expect(events[0]?.meta).toEqual({ fields: ["firstName", "lastName"], created: true });
    expect(JSON.stringify(events)).not.toContain("Morgan");
  });

  it("lists only the caller's own, non-hidden activity, newest first, with pagination", async () => {
    const me = await t.prisma.user.create({ data: { authSubject: "dev-me" } });
    const other = await t.prisma.user.create({ data: { authSubject: "dev-other" } });
    const biz = await t.prisma.user.create({ data: { authSubject: "dev-biz" } });
    const org = await t.prisma.organization.create({ data: { name: "Org", category: "Retail" } });

    let n = 0;
    const grant = async (customerId: string, minutesAgo: number, hidden = false) => {
      n += 1;
      const session = await t.prisma.shareSession.create({
        data: {
          reference: `REQ-T${n}`,
          organizationId: org.id,
          createdById: biz.id,
          name: "Visit",
          purpose: `Purpose ${n}`,
          method: "QR",
          status: "APPROVED",
          expiresAt: new Date(),
        },
      });
      await t.prisma.consentGrant.create({
        data: {
          receiptId: `DX-TEST-000${n}`,
          sessionId: session.id,
          customerId,
          organizationId: org.id,
          decision: "APPROVED",
          approvedKeys: ["FULL_NAME"],
          requestedKeys: ["FULL_NAME", "EMAIL"],
          requiredKeys: ["FULL_NAME"],
          purposeSnapshot: `Purpose ${n}`,
          orgNameSnapshot: "Org",
          consentTextVersion: "test",
          idempotencyKey: crypto.randomUUID(),
          createdAt: new Date(Date.now() - minutesAgo * 60_000),
          hiddenByCustomerAt: hidden ? new Date() : null,
        },
      });
    };
    await grant(me.id, 30);
    await grant(me.id, 20);
    await grant(me.id, 10);
    await grant(me.id, 5, true);
    await grant(other.id, 1);

    const auth = await t.bearer("dev-me");
    const first = activityPageSchema.parse((await t.http().get("/v1/me/activity?limit=2").set("Authorization", auth).expect(200)).body);
    expect(first.items.map((i) => i.purpose)).toEqual(["Purpose 3", "Purpose 2"]);
    expect(first.items[0]).toMatchObject({ sharedKeys: ["FULL_NAME"], requestedKeys: ["FULL_NAME", "EMAIL"] });
    expect(first.nextCursor).not.toBeNull();

    const second = activityPageSchema.parse(
      (await t.http().get(`/v1/me/activity?limit=2&cursor=${first.nextCursor}`).set("Authorization", auth).expect(200)).body,
    );
    expect(second.items.map((i) => i.purpose)).toEqual(["Purpose 1"]);
    expect(second.nextCursor).toBeNull();

    await t.http().get("/v1/me/activity?limit=500").set("Authorization", auth).expect(400);
  });
});
