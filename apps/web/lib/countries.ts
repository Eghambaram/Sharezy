import { getCountries } from "libphonenumber-js/min";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Regional-indicator flag emoji (renders as letters where flags aren't supported). */
export function flagEmoji(code: string): string {
  return code.replace(/./g, (c) => String.fromCodePoint(0x1f1a5 + c.charCodeAt(0)));
}

/** All countries, India first (primary market), then alphabetical by English name. */
export const COUNTRY_OPTIONS: readonly { code: string; name: string }[] = (() => {
  const all = getCountries()
    .map((code) => ({ code: code as string, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  const india = all.find((c) => c.code === "IN");
  return india ? [india, ...all.filter((c) => c.code !== "IN")] : all;
})();
