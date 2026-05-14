import type { Service } from "@/app/types"
import type { TranslationKey } from "@/app/i18n"

export type ServiceCategory = {
  slug: string
  labelKey: TranslationKey
  shortLabel: string
  descriptionKey: TranslationKey
  keywords: string[]
}

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "cleaning",
    labelKey: "categoryCleaning",
    shortLabel: "CL",
    descriptionKey: "categoryCleaningDesc",
    keywords: ["clean", "reinig", "putz", "wohnung", "house", "office"],
  },
  {
    slug: "repair",
    labelKey: "categoryRepair",
    shortLabel: "RP",
    descriptionKey: "categoryRepairDesc",
    keywords: ["repair", "repar", "fix", "handwerk", "montage", "install"],
  },
  {
    slug: "moving",
    labelKey: "categoryMoving",
    shortLabel: "MV",
    descriptionKey: "categoryMovingDesc",
    keywords: ["move", "moving", "umzug", "transport", "carry", "tragen"],
  },
  {
    slug: "tutoring",
    labelKey: "categoryTutoring",
    shortLabel: "TU",
    descriptionKey: "categoryTutoringDesc",
    keywords: ["tutor", "nachhilfe", "lesson", "language", "schule", "lernen"],
  },
  {
    slug: "wellness",
    labelKey: "categoryWellness",
    shortLabel: "WE",
    descriptionKey: "categoryWellnessDesc",
    keywords: ["fitness", "beauty", "wellness", "pflege", "coach", "training"],
  },
  {
    slug: "it",
    labelKey: "categoryIt",
    shortLabel: "IT",
    descriptionKey: "categoryItDesc",
    keywords: ["it", "computer", "software", "web", "smart", "technik"],
  },
  {
    slug: "first-aid",
    labelKey: "categoryFirstAid",
    shortLabel: "FA",
    descriptionKey: "categoryFirstAidDesc",
    keywords: [
      "erste hilfe",
      "ersthelfer",
      "notfall",
      "cpr",
      "wiederbelebung",
      "first aid",
      "emergency",
      "kurs",
      "course",
    ],
  },
  {
    slug: "volunteer",
    labelKey: "categoryVolunteer",
    shortLabel: "EH",
    descriptionKey: "categoryVolunteerDesc",
    keywords: [
      "ehrenamt",
      "freiwillig",
      "kostenfrei",
      "einkaufshilfe",
      "senior",
      "handicap",
      "assistenz",
      "volunteer",
      "community",
    ],
  },
]

export const categoryBySlug = new Map(
  serviceCategories.map(category => [category.slug, category])
)

export function getServiceCategory(service: Service) {
  if (service.is_volunteer) {
    return categoryBySlug.get("volunteer") ?? serviceCategories[0]
  }

  const text = `${service.title} ${service.description ?? ""}`.toLowerCase()

  return (
    serviceCategories.find(category =>
      category.keywords.some(keyword => text.includes(keyword))
    ) ?? serviceCategories[0]
  )
}
