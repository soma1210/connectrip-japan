import { SELECT_DRAFTS } from "./selectDrafts";
import type { SelectArticle, Source } from "./types";

/**
 * Connectrip Japan Select articles. To add one: append a record here; the
 * lists, URL, sitemap entry and structured data follow from it.
 *
 * Facts: only what the spot's official website states, recorded per spot
 * with the date it was checked (`checkedAt`, `checkNote`). Opening hours and
 * fees are not given. No on-site research was done for these drafts, so
 * nothing claims it. Station routes come from the official access pages and
 * Osaka Metro's station guide (station codes give the order on each line).
 */
const CHECKED = "2026-11-14";
const NEXT_REVIEW = "2027-02-12"; // 90 days

const metro = (code: string, name: string): Source => ({
  name: `Osaka Metro station guide: ${name} (${code.split("/")[1].toUpperCase()})`,
  url: `https://subway.osakametro.co.jp/station_guide/${code}/`,
});

export const SELECT_ARTICLES: SelectArticle[] = [
  {
    kind: "select",
    slug: "osaka-best-places",
    title: "Connectrip Japan Select: 10 Best Places to Visit in Osaka",
    seoTitle: "10 Best Places to Visit in Osaka",
    description:
      "Ten places in Osaka recommended by Connectrip Japan, from Dotonbori, Umeda Sky Building and Osaka Castle to local shrines, markets and a mountain temple, with what makes each one worth a visit.",
    summary: "Ten places we recommend in Osaka, from the neon of Dotonbori and the Umeda Sky Building observatory to historic shrines, local markets and a mountain temple in Minoh.",
    topic: "Best places",
    area: "osaka",
    search: {
      intent: "Decide which places to see in Osaka, with a reason for each and practical points",
      primaryKeyword: "best places to visit in Osaka",
      secondaryKeywords: ["things to do in Osaka", "Osaka shrines and temples", "Osaka food market"],
    },
    status: "in_review",
    updatedAt: CHECKED,
    lastReviewedAt: CHECKED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Our ten picks are Katsuoji Temple, Namba Yasaka Shrine, Sumiyoshi Taisha, Osaka Tenmangu, Dotonbori, Kuromon Ichiba Market, Shinsekai, Umeda Sky Building, Osaka Castle and Shitennoji. On a first visit, Osaka Castle, Kuromon Ichiba Market, Shinsekai and Dotonbori fit into one day by Osaka Metro.",
    keyFacts: [
      { label: "Places", value: "10" },
      { label: "Where", value: "Osaka City and Minoh" },
      { label: "Includes", value: "Shrines and temples, a castle, an observatory, a food market, nightlife" },
      { label: "Good for", value: "Choosing what to see in Osaka" },
    ],
    intro: [
      "Osaka is a city of busy shopping streets, historic shrines and temples, and some of Japan's best-loved street food. These are ten places we recommend, from the lights of Dotonbori to a temple in the hills north of the city.",
      "Opening hours, fees and access change from time to time, so please check each place's official website before you go.",
    ],
    content: {
      type: "spots",
      spots: [
        {
          spotId: "katsuoji",
          bestFor: "A greener side of Osaka and its “victory” daruma",
          overview:
            "A temple in the hills of Minoh, north of central Osaka. Katsuoji is known as a temple of winning luck, where people pray for success, and it is temple No. 23 on the Saigoku Kannon pilgrimage. Its “victory” daruma dolls (kachi-daruma) are a well-known symbol of the temple.",
          whyWeRecommend: "It shows a quieter, greener side of Osaka, a long way from the neon of the city centre, and the daruma make it one of the most memorable temples in the region.",
          localTips: ["Pair it with Minoh Falls, also in the Minoh hills, for a day out of the city."],
          thingsToKnow: ["It is outside central Osaka, so allow extra travel time.", "Check visiting hours and access on the official website before you go."],
          checkedAt: CHECKED,
          checkNote: "Winning luck, Saigoku No. 23 and kachi-daruma: official website, 2026-11-14. Pairing with Minoh Falls: both are in Minoh (spot master); travel between them not checked.",
        },
        {
          spotId: "namba-yasaka-shrine",
          bestFor: "The giant lion-head stage, near Namba",
          overview:
            "A neighbourhood shrine in Naniwa Ward, close to the Namba area, famous for its Shishiden: a stage built in the shape of a giant lion's head, used for lion dances and performances at the shrine's summer festival.",
          whyWeRecommend: "The lion stage is one of the most striking sights in Osaka, and the shrine is easy to add to a day around Namba.",
          localTips: ["Combine it with Dotonbori and the Namba area."],
          thingsToKnow: ["It is a place of worship: keep your voice low and follow any signs about photography."],
          checkedAt: CHECKED,
          checkNote: "Shishiden (lion stage) and its use at the summer festival: official website, Shishiden page and festival page, 2026-11-14.",
        },
        {
          spotId: "sumiyoshi-taisha",
          bestFor: "Ancient shrine architecture and the arched bridge",
          overview:
            "The head shrine of about 2,300 Sumiyoshi shrines across Japan. Its four main halls are National Treasures that preserve an ancient style of shrine architecture, and the steep, arched Sorihashi bridge is the symbol of the shrine.",
          whyWeRecommend: "It is a calm, spacious shrine with an architectural style you can see up close, and a good reason to visit a part of Osaka most travellers skip.",
          localTips: ["Take your time on the grounds: the main halls and the Sorihashi bridge are the highlights."],
          thingsToKnow: ["More than two million people visit at New Year, so expect large crowds in early January."],
          checkedAt: CHECKED,
          checkNote: "Head shrine of about 2,300 shrines, four National Treasure halls, Sorihashi, 2M+ New Year visitors: official website, 2026-11-14.",
        },
        {
          spotId: "osaka-tenmangu",
          bestFor: "A shrine visit with a local shopping street",
          overview:
            "A shrine dedicated to Sugawara no Michizane, the Heian-period scholar and statesman. Many people come to pray for success in exams, and the shrine is the home of the Tenjin Matsuri festival.",
          whyWeRecommend: "It sits right beside Tenjinbashisuji Shopping Street, so it fits naturally into a walk through one of Osaka's most local neighbourhoods.",
          localTips: ["Combine it with Tenjinbashisuji Shopping Street, which starts next to the shrine."],
          thingsToKnow: ["It is a place of worship: dress and behave respectfully on the grounds."],
          checkedAt: CHECKED,
          checkNote: "Sugawara no Michizane, exam prayers, Tenjin Matsuri: official website, 2026-11-14. “Heian-period” is general knowledge, not from the site.",
        },
        {
          spotId: "dotonbori",
          bestFor: "Street food and the evening lights",
          overview: "Osaka's best-known entertainment district, along the Dotonbori canal, with giant illuminated signs, restaurants and street food such as takoyaki and okonomiyaki.",
          whyWeRecommend: "For many visitors the lights of Dotonbori are the image of Osaka, and it is the easiest place to try the city's favourite comfort food.",
          localTips: ["Come back after dark, when the signs along the canal are lit."],
          thingsToKnow: ["It is busiest in the evening and at weekends; keep an eye on your belongings in the crowds."],
          checkedAt: null,
          checkNote: "Description is general; not yet checked against the official website. Nearest stations: official access page, 2026-11-14.",
        },
        {
          spotId: "kuromon-market",
          bestFor: "Lunch and fresh food",
          overview: "A food market in Nippombashi known as “Osaka's kitchen”, with shops selling fresh fish, fugu (pufferfish), meat, fruit, sweets and ready-to-eat food.",
          whyWeRecommend: "It is a lively way to see what Osaka eats, and a good lunch stop on the way from Osaka Castle to Namba.",
          localTips: ["Make it your lunch stop and try a little from several shops."],
          thingsToKnow: ["Opening hours vary from shop to shop, so check before you plan a meal here."],
          checkedAt: CHECKED,
          checkNote: "“Osaka's kitchen”, shop categories (fish, fugu, meat, fruit, sweets, eateries) and access: official website, 2026-11-14.",
        },
        {
          spotId: "shinsekai",
          bestFor: "Old-Osaka atmosphere and kushikatsu",
          overview: "A retro district around Tsutenkaku Tower, home of the lucky Billiken figure. Its streets are lined with restaurants serving kushikatsu, deep-fried skewers.",
          whyWeRecommend: "It has an old-Osaka atmosphere that feels very different from Umeda or Namba.",
          localTips: ["Try kushikatsu: at many restaurants the shared dipping sauce is for one dip only."],
          thingsToKnow: ["Shitennoji Temple and the Tennoji area are close by."],
          checkedAt: null,
          checkNote: "Tsutenkaku, Shinsekai, Billiken and access: Tsutenkaku official website, 2026-11-14. Kushikatsu, the sauce rule and the distance to Shitennoji are general knowledge, not yet checked.",
        },
        {
          spotId: "umeda-sky-building",
          bestFor: "Panoramic views over the city",
          overview:
            "One of Osaka's best-known landmarks, consisting of Tower East and Tower West joined at the top by the Kuchu Teien Observatory (Floating Garden Observatory) across the 39th, 40th and rooftop floors. Its open-air rooftop deck offers 360-degree panoramic views over the Osaka cityscape.",
          whyWeRecommend:
            "The twin-tower architecture and the glass-enclosed escalators linking the upper floors make the ascent part of the experience, and the open-air rooftop deck gives an unobstructed view across northern Osaka and beyond.",
          localTips: [
            "Visit in the late afternoon to stay from daylight into evening views, or relax at cafe SKY 40 on the 40th floor (open 9:30 AM to 10:30 PM, last admission 10:00 PM).",
            "Allow roughly 45 to 60 minutes for the ascent, indoor gallery and rooftop deck, or longer if you plan to stop at the café or restaurants in the Showa-retro Takimikoji area (B1F–1F).",
          ],
          thingsToKnow: [
            "Admission to the observatory is 2,000 yen for adults, 500 yen for ages 4 to 12 and free for children under 4; Osaka Amazing Pass and Osaka e-Pass holders receive free admission from 9:30 AM to 3:00 PM and 10% off from 3:00 PM to 10:00 PM.",
            "Use the dedicated 3F Kuchu Teien Observatory entrance rather than the office elevators, and note that the rooftop may close in heavy rain or severe weather.",
          ],
          checkedAt: CHECKED,
          checkNote:
            "Kuchu Teien Observatory connecting Tower East and Tower West (39F, 40F, RF), 360-degree open-air rooftop, hours (9:30 AM–10:30 PM, last admission 10:00 PM), admission (2,000 yen adult / 500 yen ages 4–12), Osaka Amazing Pass / e-Pass discount, dedicated entrance, Takimikoji and weather closure: official English website (skybldg.co.jp/en/), 2026-11-14. Suggested duration (45–60 min) is general planning guidance.",
        },
        {
          spotId: "osaka-castle",
          bestFor: "History, stone walls and moats",
          overview:
            "Built by Toyotomi Hideyoshi, the castle fell in the Siege of Osaka and was rebuilt by the Tokugawa shogunate. Today's main tower is the third, restored in 1931 with donations from the people of Osaka, and it has been a museum ever since, with exhibits on Hideyoshi and the castle's history.",
          whyWeRecommend: "The stone walls, moats and park around the tower are worth the visit on their own, and the museum is a good introduction to Osaka's history.",
          localTips: ["Walk in through the park to see the stone walls and moats before the tower."],
          thingsToKnow: ["The castle grounds are large, so wear comfortable shoes.", "Check the museum's hours on the official website."],
          checkedAt: CHECKED,
          checkNote: "Hideyoshi, Siege of Osaka, Tokugawa rebuild, third tower restored 1931 with citizens' donations, museum since then, and access: official website, 2026-11-14.",
        },
        {
          spotId: "shitennoji",
          bestFor: "A calm temple with a very long history",
          overview: "A temple associated with Prince Shotoku, which describes itself as the first officially established Buddhist temple in Japan.",
          whyWeRecommend: "It is a peaceful contrast to lively Shinsekai nearby, and a place with a very long history in the middle of the city.",
          localTips: ["Visit it on the same day as Shinsekai."],
          thingsToKnow: ["It is a place of worship: keep your voice low on the grounds."],
          checkedAt: CHECKED,
          checkNote: "Prince Shotoku and “Japan's first official Buddhist temple”: official website, 2026-11-14. Distance to Shinsekai not checked.",
        },
      ],
    },
    faq: [
      {
        question: "Can I see all ten places in one day?",
        answer:
          "Not comfortably. They are spread across the city, from Katsuoji in the hills of Minoh to Sumiyoshi Taisha in the south. Group them by area instead: for example, Umeda Sky Building and Osaka Tenmangu in the north, or Kuromon Ichiba Market with Dotonbori, which are both reached from Nippombashi Station. For a ready-made first day, see our Osaka day trip itinerary.",
      },
      {
        question: "Where should I go for food in Osaka?",
        answer: "Kuromon Ichiba Market, known as “Osaka's kitchen”, for fresh fish, fruit, sweets and ready-to-eat food, and Dotonbori for street food such as takoyaki and okonomiyaki.",
      },
      {
        question: "Which of these places are outside central Osaka?",
        answer: "Katsuoji Temple is in the hills of Minoh, north of central Osaka, so allow extra travel time. Sumiyoshi Taisha is in the south of the city.",
      },
      {
        question: "Why doesn't this guide list opening hours and fees?",
        answer: "They change from time to time, and we only publish information we have checked. Each place has a link to its official website: please check it for the latest hours, fees and access before you go.",
      },
    ],
    cta: "featuredTour",
    related: ["osaka-day-trip"],
    editorialNotes: [
      "FAQ drafted from the checked article text (2026-11-14); the Dotonbori food answer shares the Dotonbori description's open check.",
      "Photos: Katsuoji, Namba Yasaka, Sumiyoshi Taisha, Kuromon, Umeda Sky Building and Shitennoji use photos supplied on 2026-11-15 (photographer, source and licence not confirmed); Osaka Castle, Dotonbori, Shinsekai and Osaka Tenmangu use current-site / Hero files. All ten: rights NOT_VERIFIED.",
      "Dotonbori and Shinsekai descriptions still need checking against official information.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },
  {
    kind: "select",
    slug: "osaka-day-trip",
    title: "Osaka Day Trip Itinerary: What to See in One Day",
    seoTitle: "Osaka in One Day: A Day Trip Itinerary",
    description:
      "A one-day Osaka plan for first-time visitors: Osaka Castle in the morning, lunch at Kuromon Ichiba Market, Shinsekai in the afternoon and Dotonbori in the evening, linked by Osaka Metro.",
    summary: "A first day in Osaka: the castle in the morning, Kuromon Ichiba Market for lunch, retro Shinsekai in the afternoon and Dotonbori's lights in the evening.",
    topic: "Day itinerary",
    area: "osaka",
    search: {
      intent: "Plan a realistic first day in Osaka, in a sensible order, with how to get between stops",
      primaryKeyword: "Osaka one day itinerary",
      secondaryKeywords: ["Osaka day trip", "what to see in Osaka in one day"],
    },
    status: "in_review",
    updatedAt: CHECKED,
    lastReviewedAt: CHECKED,
    nextReviewDue: NEXT_REVIEW,
    quickAnswer:
      "Start at Osaka Castle in the morning, have lunch at Kuromon Ichiba Market, explore Shinsekai in the afternoon and finish in Dotonbori in the evening. Osaka Metro links every stop, and the last three are all on the Sakaisuji Line.",
    keyFacts: [
      { label: "Stops", value: "4" },
      { label: "Getting around", value: "Osaka Metro (Tanimachi, Sennichimae and Sakaisuji lines)" },
      { label: "Good for", value: "A first day in Osaka" },
    ],
    intro: [
      "A first day in Osaka can take in a castle, a food market, a retro neighbourhood and the city's famous neon. This plan links four places from our Osaka Select guide in an order that avoids crossing the city twice, with Osaka Metro between each stop.",
    ],
    content: {
      type: "itinerary",
      whyThisOrder:
        "The route starts at the castle in the centre-east of the city, heads south to Kuromon Ichiba Market in Nippombashi and on to Shinsekai, then comes back to Nippombashi for Dotonbori in the evening, when the signs are lit. Kuromon, Shinsekai and Dotonbori are all on the Osaka Metro Sakaisuji Line.",
      thingsToKnow: [
        "Train times and how long to spend at each stop are not given here: check a route planner on the day and plan the stops at your own pace.",
        "Check the opening hours of the castle museum and of the market shops before you go.",
        "Tickets and passes are bought by travellers themselves.",
      ],
      stops: [
        {
          slot: "Morning",
          spotId: "osaka-castle",
          bestFor: "History and the castle park",
          plan: "Start at Osaka Castle: walk through the park and past the stone walls and moats to the main tower, and visit the museum inside.",
          stay: null,
          nextLeg: {
            text: "Osaka Metro Tanimachi Line from Tanimachi 4-chome to Tanimachi 9-chome (two stops), then the Sennichimae Line to Nippombashi (one stop). Kuromon Ichiba Market is about 5 minutes on foot from Exit 10.",
            sources: [metro("T/t23", "Tanimachi 4-chome"), metro("T/t25", "Tanimachi 9-chome"), metro("S/s18", "Tanimachi 9-chome"), metro("S/s17", "Nippombashi"), { name: "Kuromon Ichiba Market: Access", url: "https://kuromon.com/jp/access/" }],
            checkedAt: CHECKED,
          },
        },
        {
          slot: "Lunch",
          spotId: "kuromon-market",
          bestFor: "Lunch",
          plan: "Have lunch at Kuromon Ichiba Market, trying a little from several of the market's food shops.",
          stay: null,
          nextLeg: {
            text: "Osaka Metro Sakaisuji Line from Nippombashi to Ebisucho (the next stop). Tsutenkaku Tower is 3 minutes on foot from Exit 3.",
            sources: [metro("K/k17", "Nippombashi"), metro("K/k18", "Ebisucho"), { name: "Tsutenkaku Tower: Access", url: "https://www.tsutenkaku.co.jp/access/index.html" }],
            checkedAt: CHECKED,
          },
        },
        {
          slot: "Afternoon",
          spotId: "shinsekai",
          bestFor: "Retro streets and kushikatsu",
          plan: "Explore Shinsekai: see Tsutenkaku Tower and the retro streets around it, and try kushikatsu if you are hungry.",
          stay: null,
          nextLeg: {
            text: "Osaka Metro Sakaisuji Line from Ebisucho back to Nippombashi (one stop). Dotonbori is right outside Exit 2.",
            sources: [metro("K/k18", "Ebisucho"), metro("K/k17", "Nippombashi"), { name: "Dotonbori Shopping Association: Access", url: "https://www.dotonbori.or.jp/ja/access/index.html" }],
            checkedAt: CHECKED,
          },
        },
        {
          slot: "Evening",
          spotId: "dotonbori",
          bestFor: "Dinner and the canal-side lights",
          plan: "Finish in Dotonbori for dinner and a walk along the canal under the illuminated signs.",
          stay: null,
          nextLeg: null,
        },
      ],
    },
    closing: "Prefer not to plan the details yourself? A private guide can adjust the day to your pace and interests.",
    faq: [
      {
        question: "How do I get between the stops?",
        answer:
          "By Osaka Metro. From Tanimachi 4-chome near Osaka Castle, take the Tanimachi Line to Tanimachi 9-chome and change to the Sennichimae Line for Nippombashi, near Kuromon Ichiba Market. From Nippombashi the Sakaisuji Line goes one stop to Ebisucho for Shinsekai, and one stop back to Nippombashi for Dotonbori.",
      },
      {
        question: "How long should I spend at each stop?",
        answer: "We don't give fixed times, because they depend on your pace and on opening hours on the day. Use a route planner for train times, and check the castle museum's and market shops' hours before you go.",
      },
      {
        question: "Do I need a special ticket or pass?",
        answer: "The route uses Osaka Metro only. Tickets and passes are bought by travellers themselves; compare the options on Osaka Metro's official website before you go.",
      },
    ],
    cta: "privateGuide",
    related: ["osaka-best-places"],
    editorialNotes: [
      "Time at each stop is not verified (no official source), so it is not shown. Train journey times are not shown either; the article points readers to a route planner.",
      "Photos: Osaka Castle, Shinsekai and Dotonbori use files with rights NOT_VERIFIED; Kuromon uses a photo supplied on 2026-11-15, rights NOT_VERIFIED.",
      "Editorial review and approval by Connectrip Japan before publishing.",
    ],
  },
  // Draft guides (selectDrafts.ts, 2026-11-15): after the existing ones, so the existing order and links stay.
  ...SELECT_DRAFTS,
];
