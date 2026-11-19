/**
 * PLACEHOLDER ARTICLES for the Home "Explore Kansai" slides (Human instruction
 * 2026-11-15): until enough real Connectrip Japan Select guides and Kansai
 * Travel Updates are published, these fill the strip accordion and the
 * auto-scrolling rail so the design can be judged with a realistic number of
 * articles. Preview only (getExploreHomeSlides adds them when V1_PREVIEW).
 *
 * To add / edit / remove a placeholder: change these arrays; nothing else
 * refers to them. To retire them all: empty both arrays. Real articles always
 * come first. Images are existing site photos (rights NOT_VERIFIED, as on the
 * rest of the preview).
 */
import type { UpdateCategory } from "./types";

export type SelectSample = {
  id: string;
  title: string;
  /** Short topic shown above the title (like a real Select guide's topic). */
  topic: string;
  area: string;
  summary: string;
  image: { src: string; alt: string };
};

export type UpdateSample = {
  id: string;
  title: string;
  category: UpdateCategory;
  area: string;
  /** ISO date shown on the card. */
  date: string;
  image: { src: string; alt: string };
};

export const SELECT_SAMPLES: SelectSample[] = [
  {
    id: "sample-kuromon-market",
    title: "Kuromon Market: How to Eat Your Way Through Osaka's Kitchen",
    topic: "Food",
    area: "Osaka",
    summary: "Grilled scallops, fresh tuna and fruit stalls: when to go, what to try first, and how to shop like a regular.",
    image: { src: "/images/v1/spots/osaka/kuromon-market.webp", alt: "Food stalls and shoppers in Kuromon Market, Osaka" },
  },
  {
    id: "sample-sumiyoshi-taisha",
    title: "Sumiyoshi Taisha: The Arched Bridge and Osaka's Oldest Shrine",
    topic: "Shrines",
    area: "Osaka",
    summary: "A quiet morning walk over the Sorihashi bridge to one of Japan's most important shrines, a short ride from Namba.",
    image: { src: "/images/v1/spots/osaka/sumiyoshi-taisha.webp", alt: "Sumiyoshi Taisha shrine, Osaka" },
  },
  {
    id: "sample-umeda-sky",
    title: "Umeda Sky Building at Dusk: Osaka's Best Night View",
    topic: "Views",
    area: "Osaka",
    summary: "Time your visit for sunset on the open-air Floating Garden and watch the city lights come on below.",
    image: { src: "/images/v1/spots/osaka/umeda-sky-building.webp", alt: "Umeda Sky Building, Osaka" },
  },
  {
    id: "sample-katsuoji",
    title: "Katsuo-ji: The Daruma Temple in the Hills of Minoh",
    topic: "Temples",
    area: "Osaka",
    summary: "Thousands of red daruma dolls, autumn maples and a mountain air, less than an hour from central Osaka.",
    image: { src: "/images/v1/spots/osaka/katsuoji.webp", alt: "Daruma dolls at Katsuo-ji temple, Minoh" },
  },
  {
    id: "sample-namba-yasaka",
    title: "Namba Yasaka Shrine: The Giant Lion Head Hidden in Namba",
    topic: "Hidden Gems",
    area: "Osaka",
    summary: "A twelve-metre lion head stage, a five-minute walk from the busiest streets of Minami.",
    image: { src: "/images/v1/spots/osaka/namba-yasaka-shrine.webp", alt: "Lion head stage at Namba Yasaka Shrine, Osaka" },
  },
  {
    id: "sample-shitennoji",
    title: "Shitennoji: A Walk Through Japan's First State Temple",
    topic: "History",
    area: "Osaka",
    summary: "Founded over 1,400 years ago: the five-storey pagoda, the stone torii and the monthly flea market.",
    image: { src: "/images/v1/spots/osaka/shitennoji.webp", alt: "Shitennoji temple, Osaka" },
  },
  {
    id: "sample-kiyomizu",
    title: "Kiyomizu-dera Before 8 a.m.: Kyoto Without the Crowds",
    topic: "Temples",
    area: "Kyoto",
    summary: "The wooden stage, the city below and the slopes of Higashiyama, while the lanes are still quiet.",
    image: { src: "/images/v1/journal/kiyomizu-dera-2000.webp", alt: "Kiyomizu-dera temple, Kyoto" },
  },
  {
    id: "sample-fushimi-inari",
    title: "Fushimi Inari: Walking the Thousand Torii at Golden Hour",
    topic: "Shrines",
    area: "Kyoto",
    summary: "How far to climb, where the crowds thin out, and the tea house with a view near the top.",
    image: { src: "/images/gallery/gallery-fushimi-inari.jpg", alt: "Torii gates of Fushimi Inari Taisha, Kyoto" },
  },
  {
    id: "sample-himeji",
    title: "Himeji Castle: An Easy Day Trip from Osaka",
    topic: "Day Trips",
    area: "Hyogo",
    summary: "Japan's most beautiful original castle, the Koko-en gardens next door, and how to fit it all into one day.",
    image: { src: "/images/gallery/gallery-himeji-castle.jpg", alt: "Himeji Castle, Hyogo" },
  },
  {
    id: "sample-arashiyama",
    title: "Arashiyama by Boat: Autumn on the Hozu River",
    topic: "Seasons",
    area: "Kyoto",
    summary: "Red maples from the water, the bamboo grove at opening time, and a riverside lunch in the west of Kyoto.",
    image: { src: "/images/v1/hero/kyoto/kyoto-arashiyama-boat.jpg", alt: "A covered boat on the river under red autumn maples, Arashiyama, Kyoto" },
  },
];

export const UPDATE_SAMPLES: UpdateSample[] = [
  {
    id: "sample-update-kyoto-autumn",
    title: "Autumn Colours in Kyoto: Where the Maples Turn First",
    category: "Seasonal Highlights",
    area: "Kyoto",
    date: "2026-11-12",
    image: { src: "/images/v1/hero/kyoto/kyoto-arashiyama-boat.jpg", alt: "Autumn maples over the river in Arashiyama, Kyoto" },
  },
  {
    id: "sample-update-icoca",
    title: "Getting Around Osaka: Paying for Trains and Buses with an IC Card",
    category: "Transportation Updates",
    area: "Osaka",
    date: "2026-11-08",
    image: { src: "/images/v1/hero/osaka/osaka-dojima-river-night.jpg", alt: "Dojima River at night, Osaka" },
  },
  {
    id: "sample-update-nara-morning",
    title: "Nara Park in the Early Morning: Meeting the Deer Before the Crowds",
    category: "Seasonal Highlights",
    area: "Nara",
    date: "2026-11-05",
    image: { src: "/images/v1/hero/nara/nara-deer.jpg", alt: "A deer on a tree-lined path in Nara" },
  },
  {
    id: "sample-update-kobe-night",
    title: "Kobe Harborland After Dark: Winter Lights by the Port Tower",
    category: "Events & Festivals",
    area: "Hyogo",
    date: "2026-11-02",
    image: { src: "/images/v1/hero/kobe/kobe-port-tower.jpg", alt: "Kobe Port Tower at night" },
  },
  {
    id: "sample-update-shinsekai",
    title: "Shinsekai Reopens Its Tsutenkaku Night Deck to Visitors",
    category: "Attraction Updates",
    area: "Osaka",
    date: "2026-10-28",
    image: { src: "/images/v1/hero/osaka/osaka-shinsekai-day.jpg", alt: "Tsutenkaku Tower above the shop signs of Shinsekai, Osaka" },
  },
  {
    id: "sample-update-kumano",
    title: "Nachi Falls and the Kumano Kodo: Planning a Wakayama Escape",
    category: "Seasonal Highlights",
    area: "Wakayama",
    date: "2026-10-24",
    image: { src: "/images/v1/hero/wakayama/wakayama-nachi-falls.jpg", alt: "Seiganto-ji pagoda with Nachi Falls behind it, Wakayama" },
  },
  {
    id: "sample-update-typhoon",
    title: "Weather Watch: How Autumn Storms Can Affect Kansai Rail Services",
    category: "Travel Advisories",
    area: "Kansai",
    date: "2026-10-20",
    image: { src: "/images/v1/hero/hyogo/hyogo-akashi-kaikyo-bridge.jpg", alt: "Akashi Kaikyo Bridge, Hyogo" },
  },
  {
    id: "sample-update-dotonbori",
    title: "Dotonbori River Cruises: New Evening Departures",
    category: "Attraction Updates",
    area: "Osaka",
    date: "2026-10-16",
    image: { src: "/images/v1/hero/osaka/osaka-dotonbori.jpg", alt: "Dotonbori canal at night, Namba, Osaka" },
  },
];
