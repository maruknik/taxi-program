import { customArray } from "country-codes-list";

export interface Country {
  name: string;
  flag: string;
  code: string;
}

const rawCountries = customArray({
  name: "{countryNameEn}",
  localName: "{countryNameLocal}",
  flag: "{flag}",
  code: "+{countryCallingCode}",
});

export const COUNTRIES: Country[] = rawCountries
  .map((c: any) => {
    const local = c.localName ? c.localName.split(",")[0] : "";
    const displayName =
      local && local !== c.name ? `${c.name} (${local})` : c.name;
    return { ...c, name: displayName } as Country;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.name.includes("Ukraine")) || COUNTRIES[0];
