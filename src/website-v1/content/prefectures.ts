/**
 * Home "Kansai prefectures" scroll scene (Human instruction 2026-11-15): the
 * two urban prefectures (fu) and four prefectures (ken) of Kansai, each with
 * three sightseeing photos (left = large, right = two). Order = scroll order.
 *
 * To change a photo: edit `src` / `alt` here (files under public/images/...).
 * Licences:
 * - Hero / gallery photos: existing site photos (rights NOT_VERIFIED, as on the rest of the preview).
 * - public/images/v1/prefectures/*: Unsplash License (free for commercial use,
 *   no attribution required), downloaded 2026-11-15 and resized to 2200 px:
 *     shiga-shirahige-shrine   unsplash.com/photos/QP_CfOfoUG8  Shino Nakamura
 *     shiga-hikone-castle      unsplash.com/photos/k5jE3a6O10Y  Ryo Harianto
 *     shiga-omihachiman-canal  unsplash.com/photos/mHUaQivcYRI  Roméo A.
 *     nara-todaiji             unsplash.com/photos/_B4O5TnrApI  Hanna May
 *     nara-park-deer-lanterns  unsplash.com/photos/A7cZKS1Eqnc  Alex Wicks
 *     nara-kasuga-lanterns     unsplash.com/photos/ClNz7rT31G4  Alex Wicks
 *     wakayama-kumano-nachi    unsplash.com/photos/oFxhwXDHZUk  Red Shuheart
 *     wakayama-koyasan         unsplash.com/photos/-DuypEKh6gY  Samuel Berner
 *     wakayama-koyasan-okunoin unsplash.com/photos/rxo6TOS37vo  Caleb Jack
 */
export type PrefecturePhoto = { src: string; alt: string; focus?: string };
export type Prefecture = {
  key: string;
  name: string;
  /** Japanese name, shown small beside the active name. */
  kanji: string;
  photos: [PrefecturePhoto, PrefecturePhoto, PrefecturePhoto];
};

const P = "/images/v1/prefectures";
const H = "/images/v1/hero";

export const KANSAI_PREFECTURES: Prefecture[] = [
  {
    key: "osaka",
    name: "Osaka",
    kanji: "大阪府",
    photos: [
      { src: `${H}/osaka/osaka-dotonbori.jpg`, alt: "Dotonbori canal at night, Namba, Osaka", focus: "55% 55%" },
      { src: `${H}/osaka/osaka-castle.jpg`, alt: "Osaka Castle", focus: "38% 40%" },
      { src: `${H}/osaka/osaka-shinsekai-day.jpg`, alt: "Tsutenkaku Tower above the shop signs of Shinsekai, Osaka" },
    ],
  },
  {
    key: "kyoto",
    name: "Kyoto",
    kanji: "京都府",
    photos: [
      { src: `${H}/kyoto/kyoto-kinkakuji.jpg`, alt: "Kinkaku-ji, the Golden Pavilion, Kyoto" },
      { src: `${H}/kyoto/kyoto-yasaka-pagoda-night.jpg`, alt: "Yasaka Pagoda above a stone-paved street at night, Kyoto", focus: "66% 50%" },
      { src: `${H}/kyoto/kyoto-arashiyama-boat.jpg`, alt: "A covered boat under red autumn maples, Arashiyama, Kyoto" },
    ],
  },
  {
    key: "hyogo",
    name: "Hyogo",
    kanji: "兵庫県",
    photos: [
      { src: "/images/gallery/gallery-himeji-castle.jpg", alt: "Himeji Castle, Hyogo" },
      { src: `${H}/kobe/kobe-port-tower.jpg`, alt: "Kobe Port Tower at night", focus: "28% 50%" },
      { src: `${H}/hyogo/hyogo-akashi-kaikyo-bridge.jpg`, alt: "Akashi Kaikyo Bridge, Hyogo", focus: "60% 50%" },
    ],
  },
  {
    key: "shiga",
    name: "Shiga",
    kanji: "滋賀県",
    photos: [
      { src: `${P}/shiga/shiga-shirahige-shrine.jpg`, alt: "The torii of Shirahige Shrine standing in Lake Biwa, Shiga", focus: "62% 50%" },
      { src: `${P}/shiga/shiga-hikone-castle.jpg`, alt: "Hikone Castle above the Genkyu-en garden, Shiga" },
      { src: `${P}/shiga/shiga-omihachiman-canal.jpg`, alt: "Cherry blossom along the Omi-Hachiman canal, Shiga", focus: "50% 60%" },
    ],
  },
  {
    key: "nara",
    name: "Nara",
    kanji: "奈良県",
    photos: [
      { src: `${P}/nara/nara-todaiji.jpg`, alt: "The Great Buddha Hall of Todai-ji, Nara" },
      { src: `${P}/nara/nara-park-deer-lanterns.jpg`, alt: "A deer among moss-covered stone lanterns, Nara Park" },
      { src: `${P}/nara/nara-kasuga-lanterns.jpg`, alt: "Moss-covered stone lanterns in Nara Park" },
    ],
  },
  {
    key: "wakayama",
    name: "Wakayama",
    kanji: "和歌山県",
    photos: [
      { src: `${P}/wakayama/wakayama-kumano-nachi.jpg`, alt: "Seiganto-ji pagoda and Nachi Falls, Kumano, Wakayama" },
      { src: `${P}/wakayama/wakayama-koyasan.jpg`, alt: "Konpon Daito pagoda in the snow, Koyasan, Wakayama" },
      { src: `${P}/wakayama/wakayama-koyasan-okunoin.jpg`, alt: "The path through Okunoin cemetery, Koyasan, Wakayama" },
    ],
  },
];
