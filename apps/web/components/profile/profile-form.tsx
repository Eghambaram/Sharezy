"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  PROFILE_TEXT_FIELDS,
  formToRecord,
  profileFormSchema,
  recordToForm,
  type ProfileFormValues,
  type ProfileView,
} from "@dx/shared";
import { FadeIn, Shake } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/verified-badge";
import { ApiError } from "@/lib/api/client";
import { useSaveProfile } from "@/lib/api/use-profile";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { PhoneField } from "./phone-field";

const ADDRESS_KEYS = ["addressLine1", "addressLine2", "city", "region", "postalCode", "country"] as const;

function isProfileField(k: string): k is (typeof PROFILE_TEXT_FIELDS)[number] {
  return (PROFILE_TEXT_FIELDS as readonly string[]).includes(k);
}

/**
 * Profile editor used by setup (C04) and profile (C13). Saves optimistically;
 * `onSaved` runs only after the server confirms. Verified badges show only
 * while the typed value still equals the provider-verified one.
 */
export function ProfileForm({
  view,
  submitLabel,
  onSaved,
}: {
  view: ProfileView;
  submitLabel: string;
  onSaved: (view: ProfileView) => void;
}) {
  const save = useSaveProfile();
  const [failures, setFailures] = useState(0);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const hasAddress = ADDRESS_KEYS.some((k) => view.profile[k] !== null);
  const [showAddress, setShowAddress] = useState(hasAddress);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: recordToForm(view.profile),
    mode: "onTouched",
  });
  const { register, handleSubmit, control, formState, setError } = form;
  const errors = formState.errors;
  const phone = useWatch({ control, name: "phone" });
  const email = useWatch({ control, name: "email" });

  const onSubmit = handleSubmit(
    (values) => {
      setGeneralError(null);
      save.mutate(formToRecord(values), {
        onSuccess: (saved) => {
          form.reset(recordToForm(saved.profile));
          onSaved(saved);
        },
        onError: (err) => {
          setFailures((n) => n + 1);
          if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
            for (const [field, message] of Object.entries(err.fields)) {
              if (isProfileField(field)) setError(field, { message });
            }
            setGeneralError("Some details need attention.");
          } else if (err instanceof ApiError && err.code === "UNAUTHENTICATED") {
            setGeneralError("Your session ended. Sign in again to save your changes.");
          } else {
            setGeneralError("We couldn't save your changes. Your details weren't updated. Check your connection and try again.");
          }
        },
      });
    },
    () => setFailures((n) => n + 1),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold">Name</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" error={errors.firstName?.message}>
            {(a) => <Input {...a} autoComplete="given-name" {...register("firstName")} />}
          </Field>
          <Field id="lastName" label="Last name" error={errors.lastName?.message}>
            {(a) => <Input {...a} autoComplete="family-name" {...register("lastName")} />}
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold">Contact</legend>
        <Field
          id="phone"
          label="Mobile number"
          optional
          hint="A business only sees this if you approve sharing it."
          error={errors.phone?.message}
          badge={view.verified.phone && phone === (view.profile.phone ?? "") ? <VerifiedBadge kind="phone" /> : null}
        >
          {(a) => (
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneField
                  id={a.id}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={a["aria-invalid"]}
                  describedBy={a["aria-describedby"]}
                />
              )}
            />
          )}
        </Field>
        <Field
          id="email"
          label="Email address"
          optional
          error={errors.email?.message}
          badge={
            view.verified.email && email.toLowerCase() === (view.profile.email ?? "").toLowerCase() ? (
              <VerifiedBadge kind="email" />
            ) : null
          }
        >
          {(a) => <Input {...a} type="email" inputMode="email" autoComplete="email" {...register("email")} />}
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold">
          Postal address <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        {showAddress ? (
          <FadeIn className="space-y-4">
            <Field id="addressLine1" label="Address line 1" error={errors.addressLine1?.message}>
              {(a) => <Input {...a} autoComplete="address-line1" {...register("addressLine1")} />}
            </Field>
            <Field id="addressLine2" label="Address line 2" optional error={errors.addressLine2?.message}>
              {(a) => <Input {...a} autoComplete="address-line2" {...register("addressLine2")} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="city" label="City or town" error={errors.city?.message}>
                {(a) => <Input {...a} autoComplete="address-level2" {...register("city")} />}
              </Field>
              <Field id="region" label="State or region" optional error={errors.region?.message}>
                {(a) => <Input {...a} autoComplete="address-level1" {...register("region")} />}
              </Field>
              <Field id="postalCode" label="Postal code" error={errors.postalCode?.message}>
                {(a) => <Input {...a} autoComplete="postal-code" {...register("postalCode")} />}
              </Field>
              <Field id="country" label="Country" error={errors.country?.message}>
                {(a) => (
                  <Select {...a} autoComplete="country" {...register("country")}>
                    <option value="">Choose a country</option>
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </FadeIn>
        ) : (
          <Button
            variant="outline"
            block
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setShowAddress(true)}
          >
            Add postal address
          </Button>
        )}
      </fieldset>

      <div className="space-y-3 pb-safe">
        {generalError ? (
          <p role="alert" className="rounded-[var(--radius-control)] bg-destructive-soft p-3 text-sm text-destructive">
            {generalError}
          </p>
        ) : null}
        <Shake trigger={failures}>
          <Button type="submit" size="lg" block loading={save.isPending} loadingLabel="Saving…">
            {submitLabel}
          </Button>
        </Shake>
      </div>
    </form>
  );
}
