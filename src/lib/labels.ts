import { getTranslations } from "next-intl/server";
import { BILLING_MODES, KINDS, LOCATIONS, PLATFORMS, SUBJECTS } from "./constants";

export async function choiceOptions() {
  const subjects = await getTranslations("subjects");
  const platforms = await getTranslations("platforms");
  const locations = await getTranslations("locations");
  const billing = await getTranslations("billing");
  const kind = await getTranslations("kind");

  return {
    subjects: SUBJECTS.map((id) => ({ value: id, label: subjects(id) })),
    platforms: PLATFORMS.map((id) => ({ value: id, label: platforms(id) })),
    locations: LOCATIONS.map((id) => ({ value: id, label: locations(id) })),
    billing: BILLING_MODES.map((id) => ({ value: id, label: billing(id) })),
    kinds: KINDS.map((id) => ({ value: id, label: kind(id) })),
  };
}

export function labelOf(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}
