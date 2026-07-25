export type Lang = "en" | "te";

export type MunicipalChannel = {
  id: string;
  department: string;
  departmentTe: string;
  scope: string;
  phone: string;
  url: string;
  categories: string[];
};

/** Real civic complaint channels for Hyderabad. */
export const MUNICIPAL_CHANNELS: MunicipalChannel[] = [
  {
    id: "hmwssb",
    department: "HMWSSB (Water Board)",
    departmentTe: "హెచ్‌ఎం‌డబ్ల్యూ‌ఎస్‌ఎస్‌బీ (జల మండలి)",
    scope: "Water leakage, pipeline bursts, no supply, contaminated water, sewerage overflow",
    phone: "155313",
    url: "https://www.hyderabadwater.gov.in/en/complaint-registration",
    categories: ["water_leak", "water_shortage", "water_quality", "sewerage"],
  },
  {
    id: "ghmc",
    department: "GHMC My-GHMC Grievance",
    departmentTe: "జీహెచ్‌ఎం‌సీ ఫిర్యాదు",
    scope: "Garbage accumulation, uncleared bins, dead animals, sanitation, potholes, streetlights",
    phone: "040-21111111",
    url: "https://www.ghmc.gov.in/Grievance.aspx",
    categories: ["garbage", "sanitation", "roads", "streetlight", "other"],
  },
  {
    id: "swm",
    department: "GHMC Solid Waste Management",
    departmentTe: "జీహెచ్‌ఎం‌సీ ఘన వ్యర్థాల నిర్వహణ",
    scope: "Bulk garbage dumps, construction debris, black spots, missed door-to-door collection",
    phone: "1800-425-0111",
    url: "https://www.ghmc.gov.in/SWM.aspx",
    categories: ["garbage", "debris", "blackspot"],
  },
  {
    id: "tspcb",
    department: "Telangana Pollution Control Board",
    departmentTe: "తెలంగాణ కాలుష్య నియంత్రణ మండలి",
    scope: "Industrial effluent, burning of waste, sewage into lakes",
    phone: "040-23887500",
    url: "https://tspcb.cgg.gov.in/",
    categories: ["pollution", "effluent"],
  },
];

export function channelForCategory(category: string): MunicipalChannel {
  return (
    MUNICIPAL_CHANNELS.find((c) => c.categories.includes(category)) ?? MUNICIPAL_CHANNELS[1]
  );
}

export const HYDERABAD_AREAS = [
  "Abids", "Ameerpet", "Attapur", "Bachupally", "Banjara Hills", "Begumpet",
  "Bowenpally", "Chandanagar", "Charminar / Old City", "Dilsukhnagar", "ECIL",
  "Gachibowli", "Habsiguda", "HITEC City", "Jubilee Hills", "Kompally", "Kondapur",
  "Koti", "Kukatpally", "LB Nagar", "Madhapur", "Malakpet", "Manikonda", "Mehdipatnam",
  "Miyapur", "Moosapet", "Nacharam", "Nallakunta", "Nampally", "Narayanguda",
  "Nizampet", "Panjagutta", "Patancheru", "Ramanthapur", "RC Puram", "Sainikpuri",
  "Secunderabad", "Serilingampally", "Shamshabad", "Sanathnagar", "Tarnaka",
  "Toli Chowki", "Uppal", "Vanasthalipuram", "Yousufguda",
];

export const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_LABEL: Record<string, { en: string; te: string }> = {
  critical: { en: "Critical", te: "అత్యవసరం" },
  high: { en: "High", te: "అధికం" },
  medium: { en: "Medium", te: "మధ్యస్థం" },
  low: { en: "Low", te: "తక్కువ" },
};