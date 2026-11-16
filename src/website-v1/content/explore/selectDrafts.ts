import type { GuideImage, SelectArticle } from "./types";

/**
 * DRAFT Connectrip Japan Select articles (Human instruction 2026-11-15): six
 * guides that complete the eight cards of the Home "Connectrip Japan Select"
 * slide. All are `status: "draft"`: preview only, noindex, never in the
 * sitemap, not shown publicly until a person approves them (rules.ts, the
 * publish gate, still applies).
 *
 * Writing rules followed here:
 * - Real places only. Descriptions keep to widely documented facts; nothing
 *   was checked against official websites yet, so every place is marked
 *   "not checked" and the open points are listed in `editorialNotes`.
 * - No opening hours, fees, journey times or prices.
 * - No claim of on-site research.
 * - Photos are existing site files whose rights are NOT_VERIFIED (preview only).
 *
 * The three Osaka guides use places from the spot master (map, official links);
 * the Kyoto and Kobe guides use the "guide" format, since those places are not
 * in a spot master yet.
 *
 * 2026-11-15 (article layout without photo slots): text shortened to a short
 * intro, 2–3 sentences per place and at most three points; "Best for" lines
 * for the comparison table; guide sections that repeated the quick answer
 * moved into `practical`. Photo fields stay (list cards and Home use the hero).
 */
const DRAFTED = "2026-11-15";
const NEXT_REVIEW = "2027-02-13"; // 90 days
const NOT_CHECKED = "Not yet checked against the official website (draft, 2026-11-15).";

const img = (src: string, alt: string, width: number, height: number, position?: string): GuideImage => ({
  src,
  alt,
  width,
  height,
  rightsConfirmed: false,
  ...(position ? { position } : {}),
});

export const SELECT_DRAFTS: SelectArticle[] = [
  // ---------------------------------------------------------------- 03 Food · Osaka
  {
    kind: "select",
    slug: "osaka-food-guide",
    title: "What to Eat in Osaka: A Local Food Guide",
    seoTitle: "What to Eat in Osaka: A Food Guide",
    description:
      "What to eat in Osaka and where to find it: takoyaki and okonomiyaki in Dotonbori, seafood at Kuromon Ichiba Market, kushikatsu in Shinsekai and neighbourhood food along Tenjinbashisuji.",
    summary: "Takoyaki, okonomiyaki and kushikatsu, and the four places where Osaka's food culture is easiest to enjoy: Dotonbori, Kuromon Ichiba Market, Shinsekai and Tenjinbashisuji.",
    topic: "Food",
    area: "osaka",
    search: {
      intent: "Know which Osaka dishes to try and where to eat them",
      primaryKeyword: "what to eat in Osaka",
      secondaryKeywords: ["Osaka food guide", "Osaka street food", "takoyaki Osaka"],
    },
    status: "draft",
    updatedAt: DRAFTED,
    lastReviewedAt: DRAFTED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Start with Osaka's three classics: takoyaki, okonomiyaki and kushikatsu. Dotonbori is the easiest place for the first two, Shinsekai is the home of kushikatsu, Kuromon Ichiba Market is best for seafood and snacks, and Tenjinbashisuji Shopping Street shows how locals eat day to day.",
    keyFacts: [
      { label: "Area", value: "Minami, Shinsekai and Tenma (Osaka City)" },
      { label: "Best for", value: "A first taste of Osaka food" },
      { label: "Dishes to try", value: "Takoyaki, okonomiyaki, kushikatsu" },
      { label: "Places", value: "4" },
    ],
    intro: [
      "Osaka has long been called “the nation's kitchen”, and food is one of the best reasons to visit. Here are the dishes to try first and four places where they are easy to find.",
    ],
    content: {
      type: "spots",
      spots: [
        {
          spotId: "dotonbori",
          bestFor: "Takoyaki and okonomiyaki on a first evening",
          overview: "Osaka's best-known entertainment district, along the Dotonbori canal, lined with restaurants and food stands under giant illuminated signs.",
          whyWeRecommend: "It is the easiest place to try takoyaki and okonomiyaki, and the lights after dark are part of the experience.",
          localTips: ["Takoyaki come straight from the griddle and are very hot inside: let them cool for a moment.", "Walk a street or two back from the canal for quieter restaurants."],
          thingsToKnow: ["It is busiest in the evening and at weekends."],
          checkedAt: null,
          checkNote: NOT_CHECKED,
        },
        {
          spotId: "kuromon-market",
          bestFor: "Seafood, fruit and snacks for lunch",
          overview: "A covered market near Nippombashi known as “Osaka's kitchen”, with fishmongers, fruit sellers and food stalls. Many stalls cook seafood to order.",
          whyWeRecommend: "It is an easy way to try fresh seafood and seasonal fruit in one short walk.",
          localTips: ["Go earlier in the day, when the choice is widest.", "Eat at or next to the stall where you bought the food."],
          thingsToKnow: ["Some stalls close early or on certain days: check before you go."],
          checkedAt: null,
          checkNote: NOT_CHECKED,
        },
        {
          spotId: "shinsekai",
          bestFor: "Kushikatsu in an old-Osaka setting",
          overview: "A retro district around Tsutenkaku tower, known for kushikatsu: breaded, deep-fried skewers of meat, seafood and vegetables.",
          whyWeRecommend: "It is the classic place to try kushikatsu, in streets that keep the feel of old Osaka.",
          localTips: ["In shared sauce pots, dip each skewer only once: use the cabbage to add more sauce."],
          thingsToKnow: ["Many restaurants are small; expect to wait at busy times."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} The no-double-dipping custom is widely described; confirm wording with a restaurant or the area's official information.`,
        },
        {
          spotId: "tenjinbashisuji",
          bestFor: "Everyday local food away from the main sights",
          overview: "One of the longest covered shopping streets in Japan, running north from Osaka Tenmangu Shrine, with small eateries, delis and snack shops.",
          whyWeRecommend: "It shows how people in Osaka eat day to day.",
          localTips: ["Start near Osaka Tenmangu Shrine and walk north, trying a snack or two along the way."],
          thingsToKnow: ["Shops set their own hours; many close one day a week."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Length (about 2.6 km) is from the spot master note, not yet confirmed with the shopping street's official information.`,
        },
      ],
    },
    closing: "Want help choosing where to eat? A private guide can plan a food walk around your tastes and any dietary needs.",
    faq: [
      {
        question: "Which Osaka dishes should I try first?",
        answer: "Takoyaki, okonomiyaki and kushikatsu are Osaka's best-known dishes and a good place to start.",
      },
      {
        question: "Where is the best place to try kushikatsu?",
        answer: "Shinsekai, the district around Tsutenkaku tower, is the best-known place for kushikatsu in Osaka.",
      },
    ],
    cta: "featuredTour",
    related: ["osaka-hidden-gems", "osaka-day-trip", "osaka-best-places"],
    editorialNotes: [
      "DRAFT: no place has been checked against its official website yet (overview facts, closing days, stall practices).",
      "“The nation's kitchen” nickname for Osaka and “Osaka's kitchen” for Kuromon: confirm with official tourism or market sources.",
      "Photo missing: Tenjinbashisuji Shopping Street (no photo in the spot master). Other photos: rights NOT_VERIFIED.",
      "Dietary information (vegetarian, halal, allergies) is not covered; decide whether to add a section after research.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },

  // ---------------------------------------------------------------- 04 Hidden gems · Osaka
  {
    kind: "select",
    slug: "osaka-hidden-gems",
    title: "Hidden Gems in Osaka Beyond the Tourist Spots",
    seoTitle: "Hidden Gems in Osaka Beyond the Tourist Spots",
    description:
      "Quieter places in Osaka beyond the main sights: the lion-head stage of Namba Yasaka Shrine, Sumiyoshi Taisha's arched bridge, the riverside island of Nakanoshima and the forest walk to Minoh Falls.",
    summary: "Four quieter places that most first-time visitors miss, from a giant lion head near Namba to a forest waterfall in the hills north of the city.",
    topic: "Hidden gems",
    area: "osaka",
    search: {
      intent: "Find less crowded, lesser-known places to visit in Osaka",
      primaryKeyword: "hidden gems in Osaka",
      secondaryKeywords: ["off the beaten path Osaka", "quiet places in Osaka", "Osaka beyond the tourist spots"],
    },
    status: "draft",
    updatedAt: DRAFTED,
    lastReviewedAt: DRAFTED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Namba Yasaka Shrine and its lion-head stage are a short walk from Namba; Sumiyoshi Taisha is a calm, historic shrine in the south of the city; Nakanoshima is a riverside island of parks and early-20th-century buildings; and Minoh Falls is reached by a forest walk in the hills north of Osaka.",
    keyFacts: [
      { label: "Area", value: "Osaka City and Minoh" },
      { label: "Best for", value: "A second day in Osaka, or travellers who prefer quiet" },
      { label: "Highlights", value: "Shrines, a riverside park, a waterfall walk" },
      { label: "Places", value: "4" },
    ],
    intro: [
      "Osaka's best-known sights are busy for good reason, but the city also has places where you can slow down. These four each show a different, quieter side of Osaka.",
    ],
    content: {
      type: "spots",
      spots: [
        {
          spotId: "namba-yasaka-shrine",
          bestFor: "A surprising sight close to Namba",
          overview: "A neighbourhood shrine near Namba whose Shishiden, a stage in the shape of a giant lion's head, is one of the most striking sights in the city.",
          whyWeRecommend: "Few places in Osaka surprise visitors as much, and it is only a short detour from Namba.",
          localTips: ["Visit on your way to or from Dotonbori and the Namba area."],
          thingsToKnow: ["It is a place of worship: keep your voice low and follow any signs about photography."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} The Shishiden facts match the checked text in “10 Best Places to Visit in Osaka” (2026-11-14).`,
        },
        {
          spotId: "sumiyoshi-taisha",
          bestFor: "A calm, historic shrine",
          overview: "The head shrine of the Sumiyoshi shrines across Japan, in the south of Osaka, known for its arched Sorihashi bridge and main halls in an ancient style.",
          whyWeRecommend: "It is spacious and calm, with architecture unlike most shrines visitors see.",
          localTips: ["The Sorihashi bridge is steep: take your time crossing."],
          thingsToKnow: ["It is south of the city centre, so plan it as a separate outing or combine it with a day in Tennoji."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Head-shrine status and the bridge match the checked text in “10 Best Places to Visit in Osaka” (2026-11-14).`,
        },
        {
          spotId: "nakanoshima",
          bestFor: "An easy riverside walk in the city centre",
          overview: "A long, narrow island between two rivers in central Osaka, with riverside parks, a rose garden and early-20th-century buildings such as the red-brick public hall.",
          whyWeRecommend: "It is the easiest walk by the water in central Osaka.",
          localTips: ["Walk the island from end to end and cross back over one of the bridges.", "Come back after dark, when the riverside is lit."],
          thingsToKnow: ["The rose garden is at its best in season; check the park's official information for the timing."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Rose garden and the red-brick public hall (Osaka City Central Public Hall) to confirm with official park and hall information.`,
        },
        {
          spotId: "minoh-falls",
          bestFor: "A forest walk out of the city",
          overview: "A waterfall in the forested hills of Minoh, north of Osaka, reached by a walking path along a mountain stream. It is especially popular for its autumn colours.",
          whyWeRecommend: "It is an easy way to swap the city for a forest walk, and pairs well with Katsuoji Temple, also in Minoh.",
          localTips: ["Try momiji tempura, deep-fried maple leaves, sold along the path.", "Wear comfortable shoes: the path is uphill most of the way."],
          thingsToKnow: ["It is outside central Osaka, so allow extra travel time."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Walking path, autumn colours and momiji tempura to confirm with Minoh City's official tourism information.`,
        },
      ],
    },
    closing: "Would you like to see these places with someone who knows the way? A private guide can build a quieter Osaka day around your interests.",
    faq: [
      {
        question: "Are these places far from central Osaka?",
        answer: "Namba Yasaka Shrine and Nakanoshima are in the city centre. Sumiyoshi Taisha is in the south of the city, and Minoh Falls is in the hills north of Osaka, so allow extra travel time for those two.",
      },
      {
        question: "When is the best time to visit Minoh Falls?",
        answer: "The area is best known for its autumn colours. It is also pleasant in other seasons, and quieter outside autumn weekends.",
      },
    ],
    cta: "privateGuide",
    related: ["osaka-local-culture", "osaka-best-places", "osaka-food-guide"],
    editorialNotes: [
      "DRAFT: no place has been checked against its official website yet.",
      "Photos missing: Nakanoshima and Minoh Falls (no photo in the spot master). Other photos: rights NOT_VERIFIED.",
      "Namba Yasaka Shrine and Sumiyoshi Taisha also appear in “10 Best Places to Visit in Osaka”; consider whether to swap one for a place not covered elsewhere.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },

  // ---------------------------------------------------------------- 05 Culture · Osaka
  {
    kind: "select",
    slug: "osaka-local-culture",
    title: "Discover Osaka's Local Culture",
    seoTitle: "Discover Osaka's Local Culture: Temples, Shrines and History",
    description:
      "Four places to understand Osaka's culture and history: Shitennoji, one of Japan's oldest temples; Osaka Tenmangu, home of the Tenjin Matsuri; Osaka Castle; and Tsutenkaku in Shinsekai.",
    summary: "From one of Japan's oldest temples to the shrine behind one of its great summer festivals: four places that tell Osaka's story.",
    topic: "Culture",
    area: "osaka",
    search: {
      intent: "Understand Osaka's history and culture through places to visit",
      primaryKeyword: "Osaka culture",
      secondaryKeywords: ["Osaka history", "temples and shrines in Osaka", "Tenjin Matsuri"],
    },
    status: "draft",
    updatedAt: DRAFTED,
    lastReviewedAt: DRAFTED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Shitennoji is one of the oldest temples in Japan; Osaka Tenmangu is the shrine behind the Tenjin Matsuri, one of Japan's great summer festivals; Osaka Castle tells the story of the city's rise in the late 16th century; and Tsutenkaku is the symbol of Shinsekai, the retro district built in the early 20th century.",
    keyFacts: [
      { label: "Area", value: "Osaka City" },
      { label: "Best for", value: "Travellers interested in history and traditions" },
      { label: "Highlights", value: "A temple, a shrine, a castle and a landmark tower" },
      { label: "Places", value: "4" },
    ],
    intro: [
      "Osaka is known as a lively merchant city, proud of its food and its festivals. These four places, all within the city, show the long history behind that character.",
    ],
    content: {
      type: "spots",
      spots: [
        {
          spotId: "shitennoji",
          bestFor: "The early history of Buddhism in Japan",
          overview: "One of the oldest temples in Japan, traditionally said to have been founded by Prince Shotoku. Its pagoda and main hall stand in a line, in a very early temple layout.",
          whyWeRecommend: "It links modern Osaka to the earliest days of Buddhism in Japan.",
          localTips: ["Combine it with Shinsekai and Tsutenkaku, which are nearby."],
          thingsToKnow: ["It is an active temple: follow the signs about where photography is allowed."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Founding tradition (Prince Shotoku) and the layout of the central precinct to confirm with the temple's official website.`,
        },
        {
          spotId: "osaka-tenmangu",
          bestFor: "Festival tradition and a local neighbourhood",
          overview: "A shrine dedicated to Sugawara no Michizane, honoured as a god of learning, and home of the Tenjin Matsuri, one of Japan's best-known summer festivals.",
          whyWeRecommend: "It is a living centre of Osaka tradition at the start of Tenjinbashisuji Shopping Street.",
          localTips: ["Visit with Tenjinbashisuji Shopping Street, which starts right next to the shrine."],
          thingsToKnow: ["During the Tenjin Matsuri the area is extremely busy; check the festival dates on the shrine's official website."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Deity and Tenjin Matsuri to confirm with the shrine's official website.`,
        },
        {
          spotId: "osaka-castle",
          bestFor: "How Osaka became a great city",
          overview: "The castle built by Toyotomi Hideyoshi in the late 16th century. Today's main tower is a 20th-century reconstruction that houses a museum, surrounded by stone walls, moats and a large park.",
          whyWeRecommend: "It is the clearest introduction to Osaka's history, and the grounds are pleasant to walk.",
          localTips: ["Walk around the outer moat for views of the stone walls."],
          thingsToKnow: ["The park is large: allow time to walk from the nearest station to the main tower."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Builder, period and reconstruction to confirm with Osaka Castle's official website.`,
        },
        {
          spotId: "tsutenkaku",
          bestFor: "Osaka's playful, down-to-earth side",
          overview: "The tower at the heart of Shinsekai, a district laid out in the early 20th century. Inside is Billiken, a smiling figure many visitors greet for good luck.",
          whyWeRecommend: "It is a symbol of Osaka's playful side, in streets full of character.",
          localTips: ["Pair it with kushikatsu in Shinsekai and a visit to Shitennoji."],
          thingsToKnow: ["Check the observation deck's opening details on the official website before you go."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} District history, tower dates and Billiken to confirm with Tsutenkaku's official website.`,
        },
      ],
    },
    closing: "For the stories behind these places, a private guide can take you through Osaka's history at your own pace.",
    faq: [
      {
        question: "What is the Tenjin Matsuri?",
        answer: "It is the summer festival of Osaka Tenmangu Shrine, one of Japan's best-known festivals, with processions on land and on the river. Check the dates on the shrine's official website.",
      },
      {
        question: "Can I visit Shitennoji and Tsutenkaku on the same day?",
        answer: "Yes. Both are in the Tennoji area, close to each other.",
      },
    ],
    cta: "featuredTour",
    related: ["osaka-hidden-gems", "osaka-best-places", "osaka-food-guide"],
    editorialNotes: [
      "DRAFT: no place has been checked against its official website yet (founding tradition, deity, festival, castle history, tower dates).",
      "Photo missing: Tsutenkaku (no photo in the spot master). Other photos: rights NOT_VERIFIED.",
      "Shitennoji, Osaka Tenmangu and Osaka Castle also appear in “10 Best Places to Visit in Osaka”; the angle here is history and culture.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },

  // ---------------------------------------------------------------- 06 Temples · Kyoto
  {
    kind: "select",
    slug: "kyoto-kiyomizu-dera-early-morning",
    title: "Kiyomizu-dera Before 8 a.m.",
    seoTitle: "Kiyomizu-dera Before 8 a.m.: Kyoto's Famous Temple Without the Crowds",
    description:
      "How to see Kiyomizu-dera in the early morning: the wooden stage and the view over Kyoto, the Otowa waterfall, and the quiet slopes of Sannenzaka and Ninenzaka on the walk down to Yasaka Pagoda.",
    summary: "The wooden stage, the city below and the stone-paved slopes of Higashiyama, while the lanes are still quiet.",
    topic: "Temples",
    area: "kyoto",
    search: {
      intent: "Plan an early-morning visit to Kiyomizu-dera and avoid the crowds",
      primaryKeyword: "Kiyomizu-dera early morning",
      secondaryKeywords: ["Kiyomizu-dera without crowds", "best time to visit Kiyomizu-dera", "Higashiyama walk"],
    },
    status: "draft",
    updatedAt: DRAFTED,
    lastReviewedAt: DRAFTED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Kiyomizu-dera opens early in the morning, long before the tour groups arrive. Go up the hill first thing, see the wooden stage and the Otowa waterfall, then walk down through Sannenzaka and Ninenzaka to Yasaka Pagoda while the streets are still calm. Check the temple's official website for the current opening time.",
    keyFacts: [
      { label: "Area", value: "Higashiyama, Kyoto" },
      { label: "Best time", value: "Early morning" },
      { label: "Best for", value: "Photography and a quiet first visit" },
      { label: "Route", value: "Kiyomizu-dera → Sannenzaka and Ninenzaka → Yasaka Pagoda" },
    ],
    intro: [
      "By mid-morning, Kiyomizu-dera and the lanes below it can be very crowded. Arrive early and you get soft light, quiet streets and room on the famous wooden stage.",
    ],
    content: {
      type: "guide",
      hero: img("/images/v1/journal/kiyomizu-dera-2000.webp", "The vermilion three-storey pagoda of Kiyomizu-dera above the trees, with Kyoto in the distance", 2000, 1500, "50% 40%"),
      sections: [
        {
          id: "why-early",
          heading: "Why go early",
          paragraphs: [
            "The temple is reached by steep, shop-lined streets. Early in the day those streets are quiet, most shops are still closed, and you can take in the views at your own pace, with soft light and no crowds in your photos.",
          ],
        },
      ],
      places: [
        {
          id: "kiyomizu-dera",
          name: "Kiyomizu-dera",
          nameJa: "清水寺",
          locality: "Higashiyama Ward, Kyoto",
          bestFor: "The wooden stage and the view over Kyoto",
          text: "Part of the Historic Monuments of Ancient Kyoto, a UNESCO World Heritage Site. Its main hall has a wooden stage built out over the hillside on tall pillars, and below it the Otowa waterfall, which gives the temple its name, “clear water”, falls in three streams.",
          tips: ["Walk to the far side of the grounds for the classic view of the wooden stage.", "Visitors drink from the Otowa waterfall with long-handled cups."],
          official: { name: "Kiyomizu-dera (official website)", url: "https://www.kiyomizudera.or.jp/en/" },
          image: img("/images/v1/trail/kyoto-kiyomizudera-night.jpg", "The main hall and wooden stage of Kiyomizu-dera lit up among autumn trees at night", 2400, 1594),
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Opening time, UNESCO listing, the stage, the Otowa waterfall and the name's meaning to confirm on the official website. The photo shows a night illumination, not the morning.`,
        },
        {
          id: "sannenzaka-ninenzaka",
          name: "Sannenzaka and Ninenzaka",
          nameJa: "三年坂・二年坂",
          locality: "Higashiyama Ward, Kyoto",
          bestFor: "Old Kyoto streets before the shops open",
          text: "Two stone-paved slopes lined with traditional wooden houses, leading down from the temple towards Yasaka Pagoda. Early in the day they are among the most atmospheric streets in Kyoto.",
          tips: ["Look back up the slopes for the best views.", "Come back later if you want to browse the shops."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} No single official website; confirm with Kyoto City's official tourism information.`,
        },
        {
          id: "yasaka-pagoda",
          name: "Yasaka Pagoda (Hokan-ji)",
          nameJa: "八坂の塔（法観寺）",
          locality: "Higashiyama Ward, Kyoto",
          bestFor: "The classic Higashiyama photograph",
          text: "A five-storey pagoda rising above the rooftops of Higashiyama, one of the best-known views in Kyoto, and a natural end to the walk down from Kiyomizu-dera.",
          tips: ["The view up the lane towards the pagoda is quietest early in the morning."],
          image: img("/images/v1/hero/kyoto/kyoto-yasaka-pagoda-night.jpg", "Yasaka Pagoda above a quiet stone-paved street at night, Kyoto", 2400, 1600, "66% 50%"),
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Confirm the pagoda details and visiting information with Kyoto City's official tourism information. The photo is a night view.`,
        },
      ],
      tips: [
        "Check the temple's opening time on its official website the day before; it can change for special openings.",
        "The approach is a steep uphill walk: wear comfortable shoes.",
        "Kiyomizu-dera is an active temple: keep your voice low and follow the signs about photography.",
      ],
    },
    practical: [{ heading: "Getting there", items: ["Use a route planner for buses or trains to Higashiyama. The area can also be reached on foot from Gion."] }],
    closing: "Would you like to explore Higashiyama with a guide? We can plan an early start around the places you most want to see.",
    faq: [
      {
        question: "What time does Kiyomizu-dera open?",
        answer: "It opens early in the morning, but times can change for special openings. Check the official website before you go.",
      },
      {
        question: "What is the best route after visiting Kiyomizu-dera?",
        answer: "Walk down through Sannenzaka and Ninenzaka to Yasaka Pagoda. It is a short, pleasant walk through the old streets of Higashiyama.",
      },
    ],
    cta: "privateGuide",
    related: ["kyoto-beyond-the-crowds", "kobe-day-trip", "osaka-best-places"],
    editorialNotes: [
      "DRAFT: nothing checked against official websites yet. The title says “Before 8 a.m.”: confirm the temple's year-round opening time supports it before publishing.",
      "Photos: hero (journal photo) and place photos are existing files with rights NOT_VERIFIED. Both place photos are night views; morning photos would suit the article better. Photo missing: Sannenzaka and Ninenzaka.",
      "Kyoto places are not in a spot master yet, so the article has no map.",
      "Official website links were written from memory: open each one and confirm it before publishing.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },

  // ---------------------------------------------------------------- 07 Hidden gems · Kyoto
  {
    kind: "select",
    slug: "kyoto-beyond-the-crowds",
    title: "Kyoto Beyond the Crowds",
    seoTitle: "Kyoto Beyond the Crowds: Quieter Places to Visit",
    description:
      "Quieter ways to see Kyoto: the upper trails of Fushimi Inari, the Philosopher's Path, Tofuku-ji outside the autumn rush and the rural valley of Ohara.",
    summary: "Four ways to enjoy Kyoto's temples, gardens and walks at a slower pace, away from the busiest spots.",
    topic: "Hidden gems",
    area: "kyoto",
    search: {
      intent: "Find quieter places and less crowded ways to see Kyoto",
      primaryKeyword: "Kyoto without crowds",
      secondaryKeywords: ["quiet places in Kyoto", "hidden gems Kyoto", "Kyoto off the beaten path"],
    },
    status: "draft",
    updatedAt: DRAFTED,
    lastReviewedAt: DRAFTED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Climb past the first torii gates at Fushimi Inari, where the crowds thin out on the upper trails; walk the Philosopher's Path along its canal; visit Tofuku-ji outside the peak autumn weekends; or spend a day in Ohara, a rural valley north of the city.",
    keyFacts: [
      { label: "Area", value: "Kyoto City" },
      { label: "Best for", value: "A second or third day in Kyoto" },
      { label: "Highlights", value: "A mountain shrine trail, a canal-side walk, a Zen temple, a rural valley" },
      { label: "Places", value: "4" },
    ],
    intro: [
      "Kyoto's famous sights are busy for much of the year, but a short walk beyond the main gates is often enough to find calm. These four places are well known; the trick is when and where you go.",
    ],
    content: {
      type: "guide",
      hero: img("/images/v1/sections/kyoto-fushimi-inari-torii.jpg", "Rows of vermilion torii gates along a path at Fushimi Inari Taisha, Kyoto", 2400, 1611),
      sections: [],
      places: [
        {
          id: "fushimi-inari-upper-trails",
          name: "Fushimi Inari Taisha: the upper trails",
          nameJa: "伏見稲荷大社",
          locality: "Fushimi Ward, Kyoto",
          bestFor: "Torii gates without the crowds",
          text: "The head shrine of the Inari shrines, famous for thousands of vermilion torii gates up Mount Inari. Most visitors turn back near the start; keep climbing and the trails become much quieter.",
          tips: ["Go early, or keep climbing past the first viewpoints.", "The full trail is a mountain walk with many steps: wear comfortable shoes."],
          official: { name: "Fushimi Inari Taisha (official website)", url: "https://inari.jp/en/" },
          image: img("/images/gallery/gallery-fushimi-inari.jpg", "Torii gates of Fushimi Inari Taisha, Kyoto", 1600, 1200),
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Head-shrine status and trail description to confirm on the official website.`,
        },
        {
          id: "philosophers-path",
          name: "The Philosopher's Path",
          nameJa: "哲学の道",
          locality: "Sakyo Ward, Kyoto",
          bestFor: "A gentle walk linking temples",
          text: "A stone path along a small canal in eastern Kyoto, lined with cherry trees and running between the Ginkaku-ji and Nanzen-ji areas. It is an easy way to link several temples on foot.",
          tips: ["Walk it early, especially in the cherry-blossom season.", "Detour to the smaller temples along the way."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Route, cherry trees and naming to confirm with Kyoto City's official tourism information.`,
        },
        {
          id: "tofuku-ji",
          name: "Tofuku-ji",
          nameJa: "東福寺",
          locality: "Higashiyama Ward, Kyoto",
          bestFor: "Zen gardens outside the autumn rush",
          text: "A large Zen temple in south-east Kyoto, known for its gardens and a wooden covered bridge over a valley of maples. It is very busy in autumn but calm for much of the year.",
          tips: ["Visit outside the peak autumn weekends for a quiet walk through the grounds.", "Combine it with Fushimi Inari, which is close by."],
          official: { name: "Tofuku-ji (official website)", url: "https://tofukuji.jp/" },
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Gardens, bridge and seasonal crowds to confirm on the official website.`,
        },
        {
          id: "ohara",
          name: "Ohara",
          nameJa: "大原",
          locality: "Sakyo Ward, Kyoto",
          bestFor: "Countryside temples and a slower pace",
          text: "A rural valley in the hills north of Kyoto, with farmland, small villages and temples such as Sanzen-in, known for its moss garden. It feels far from the city.",
          tips: ["Plan it as its own outing: it takes time to reach from central Kyoto.", "Bring layers; the valley can be cooler than the city."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Confirm Sanzen-in details on its official website and the area description with Kyoto City's official tourism information.`,
        },
      ],
      tips: [
        "Explore one area on foot instead of crossing the city several times a day.",
        "Check opening hours on each place's official website; some temples close earlier than you might expect.",
      ],
    },
    practical: [
      {
        heading: "Best time to visit",
        items: ["Start early: most places are quietest in the first hours after they open.", "Avoid the peak cherry-blossom and autumn-colour weekends if you can."],
      },
    ],
    closing: "If you would like a Kyoto day planned around quieter places, a private guide can shape it around your pace and interests.",
    faq: [
      {
        question: "Is Fushimi Inari crowded?",
        answer: "The lower part near the main gate is usually busy. The upper trails on Mount Inari are much quieter, and early mornings are calmer everywhere.",
      },
      {
        question: "When is Tofuku-ji busiest?",
        answer: "In the autumn colour season, especially at weekends. It is calm for much of the rest of the year.",
      },
    ],
    cta: "privateGuide",
    related: ["kyoto-kiyomizu-dera-early-morning", "kobe-day-trip", "osaka-hidden-gems"],
    editorialNotes: [
      "DRAFT: nothing checked against official websites yet.",
      "Photos: hero and Fushimi Inari use existing files with rights NOT_VERIFIED. Photos missing: the Philosopher's Path, Tofuku-ji and Ohara.",
      "Kyoto places are not in a spot master yet, so the article has no map.",
      "Official website links were written from memory: open each one and confirm it before publishing.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },

  // ---------------------------------------------------------------- 08 Day trips · Hyogo (Kobe)
  {
    kind: "select",
    slug: "kobe-day-trip",
    title: "A Perfect Day Trip to Kobe",
    seoTitle: "A Perfect Day Trip to Kobe from Osaka",
    description:
      "A day in Kobe from Osaka: the Western-style houses of Kitano, Ikuta Shrine, Nankinmachi Chinatown and the harbour at Meriken Park, with ideas for Kobe beef and an evening by the water.",
    summary: "Kobe's hillside foreign quarter, an ancient shrine, Chinatown and the harbour: an easy day out from Osaka.",
    topic: "Day trips",
    area: "kobe",
    areaLabel: "Hyogo",
    search: {
      intent: "Plan a one-day trip to Kobe from Osaka",
      primaryKeyword: "Kobe day trip from Osaka",
      secondaryKeywords: ["things to do in Kobe", "Kobe one day itinerary", "Kitano Ijinkan"],
    },
    status: "draft",
    updatedAt: DRAFTED,
    lastReviewedAt: DRAFTED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Start in Kitano among the Western-style houses of the former foreign quarter, walk down to Ikuta Shrine, have lunch in Nankinmachi Chinatown, and finish at the harbour around Meriken Park and Harborland. Kobe is linked to Osaka by several rail lines; use a route planner for times and fares.",
    keyFacts: [
      { label: "Area", value: "Central Kobe, Hyogo Prefecture" },
      { label: "Duration", value: "One day" },
      { label: "From Osaka", value: "JR, Hankyu and Hanshin trains" },
      { label: "Highlights", value: "Foreign quarter, shrine, Chinatown, harbour" },
    ],
    intro: [
      "Kobe sits between the Rokko mountains and the sea, and its history as an international port gives it a character of its own. Its main sights are close together, so one day from Osaka is enough to see them.",
    ],
    content: {
      type: "guide",
      hero: img("/images/v1/hero/kobe/kobe-port-tower.jpg", "Kobe Port Tower and the harbour lit up at night", 2400, 1600, "28% 50%"),
      sections: [],
      places: [
        {
          id: "kitano-ijinkan",
          name: "Kitano Ijinkan-gai",
          nameJa: "北野異人館街",
          locality: "Chuo Ward, Kobe",
          bestFor: "Morning: Western-style houses on the hill",
          text: "A hillside district of Western-style houses built for foreign residents after the port of Kobe opened to international trade. Several houses are open to visitors.",
          tips: ["Go in the morning, before the streets get busy.", "The district is on a slope: wear comfortable shoes."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} History and visiting information to confirm with Kobe City's official tourism information. Which houses are open, and their fees, are not given.`,
        },
        {
          id: "ikuta-shrine",
          name: "Ikuta Shrine",
          nameJa: "生田神社",
          locality: "Chuo Ward, Kobe",
          bestFor: "A quiet moment in the city centre",
          text: "One of the oldest shrines in Japan, in the middle of busy Sannomiya. Behind the main hall, a small grove of trees offers a quiet break.",
          tips: ["It is on the way from Kitano down to the shopping streets of Sannomiya and Motomachi."],
          official: { name: "Ikuta Shrine (official website)", url: "https://ikutajinja.or.jp/" },
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Age of the shrine and the grove to confirm on the official website.`,
        },
        {
          id: "nankinmachi",
          name: "Nankinmachi (Kobe Chinatown)",
          nameJa: "南京町",
          locality: "Chuo Ward, Kobe",
          bestFor: "A casual street-food lunch",
          text: "Kobe's compact Chinatown near Motomachi, with street food stalls, restaurants and colourful gates.",
          tips: ["Try a few dishes from different stalls instead of one big meal.", "It is busiest at lunchtime and at weekends."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Confirm with Nankinmachi's official information and Kobe City's official tourism information.`,
        },
        {
          id: "meriken-park-harborland",
          name: "Meriken Park and Harborland",
          nameJa: "メリケンパーク・ハーバーランド",
          locality: "Chuo Ward, Kobe",
          bestFor: "Evening: the harbour and its lights",
          text: "Kobe's waterfront, with the red lattice of Kobe Port Tower and the shops of Harborland across the harbour. Meriken Park preserves a section of quay damaged in the 1995 Great Hanshin-Awaji Earthquake as a memorial.",
          tips: ["Stay until after sunset, when the harbour is lit up.", "Take a moment at the earthquake memorial to learn about the city's recovery."],
          checkedAt: null,
          checkNote: `${NOT_CHECKED} Port Tower, the earthquake memorial and Harborland to confirm with Kobe City's official tourism information. The hero photo shows this area.`,
        },
      ],
      tips: ["Check opening hours and any fees on each place's official website before you go."],
    },
    practical: [
      {
        heading: "Getting there",
        items: [
          "Kobe is linked to Osaka by JR, Hankyu and Hanshin trains; the Sannomiya area is the natural starting point.",
          "Times and fares depend on the line and your starting station: check a route planner.",
          "Central Kobe is compact: walk the day downhill, from Kitano in the north to the harbour in the south.",
        ],
      },
      { heading: "Food", items: ["Kobe is known for Kobe beef. If you would like to try it, plan it for lunch or dinner and book ahead where you can."] },
    ],
    closing: "Would you like a guide for your day in Kobe? We can plan the route around your interests, from the foreign quarter to the harbour.",
    faq: [
      {
        question: "How do I get to Kobe from Osaka?",
        answer: "By JR, Hankyu or Hanshin trains. Times and fares depend on your line and starting station; check a route planner before you go.",
      },
      {
        question: "Is one day enough for Kobe?",
        answer: "One day is enough for the central sights in this guide: Kitano, Ikuta Shrine, Nankinmachi and the harbour.",
      },
    ],
    cta: "privateGuide",
    related: ["kyoto-beyond-the-crowds", "osaka-day-trip", "osaka-best-places"],
    editorialNotes: [
      "DRAFT: nothing checked against official websites yet (history of Kitano, Ikuta Shrine, Nankinmachi, the earthquake memorial).",
      "Area: Kobe (Explore area), labelled “Hyogo” on cards and labels as requested.",
      "Photos: hero (Kobe Port Tower) uses an existing file with rights NOT_VERIFIED. Photos missing: Kitano Ijinkan-gai, Ikuta Shrine, Nankinmachi, and a daytime harbour photo for Meriken Park.",
      "Kobe places are not in a spot master yet, so the article has no map.",
      "Official website links were written from memory: open each one and confirm it before publishing.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },
];
