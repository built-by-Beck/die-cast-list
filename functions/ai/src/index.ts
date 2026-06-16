import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { initializeApp, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (getApps().length === 0) initializeApp();

const googleAiKey = defineSecret("GOOGLE_GENAI_API_KEY");
const functionsRegion = "us-central1";

let _ai: ReturnType<typeof genkit> | null = null;
function getAi() {
  if (!_ai) {
    _ai = genkit({
      plugins: [googleAI({ apiKey: googleAiKey.value() })],
    });
  }
  return _ai;
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

async function assertPremium(uid: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) throw new HttpsError("not-found", "User not found.");
  const data = snap.data() as {
    plan?: string;
    subscriptionStatus?: string;
    lifetimeAccess?: boolean;
  };
  const isLifetime = data.lifetimeAccess === true;
  const status = data.subscriptionStatus ?? "";
  const paidActive = status === "active" || status === "trialing";
  const plan = isLifetime || paidActive ? (data.plan ?? "basic") : "free";
  if (!isLifetime && plan !== "premium") {
    throw new HttpsError(
      "permission-denied",
      "AI features require a Pro subscription.",
    );
  }
}

async function assertAdmin(uid: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) throw new HttpsError("not-found", "User not found.");
  const data = snap.data() as { role?: string };
  if (data.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}

// ─── Shared schemas ───────────────────────────────────────────────────────────

const ChecklistItemSchema = z.object({
  toyNumber: z.string().default(""),
  collectorNumber: z.string().default(""),
  modelName: z.string(),
  seriesName: z.string().default(""),
  seriesNumber: z.string().default(""),
  variationLabel: z.string().default(""),
  rarityType: z
    .enum([
      "Mainline",
      "Treasure Hunt",
      "Super Treasure Hunt",
      "Premium",
      "Regular",
      "Chase",
      "Limited Edition",
      "Unknown",
    ])
    .default("Mainline"),
  notes: z.string().default(""),
});

const ParsedChecklistSchema = z.object({
  items: z.array(ChecklistItemSchema),
});

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─── Shared wiki import logic ─────────────────────────────────────────────────

interface WikiImportParams {
  wikiUrl: string;
  name: string;
  year: number;
  brand?: string;
  category?: string;
  createdByUid: string;
}

interface WikiImportResult {
  checklistId: string;
  name: string;
  totalCars: number;
  sourceUrl: string;
  note: string;
}

async function importFromWikiUrl(
  params: WikiImportParams,
): Promise<WikiImportResult> {
  const { wikiUrl, name, year, brand, category, createdByUid } = params;
  const db = getFirestore();
  const ai = getAi();

  const domain = new URL(wikiUrl).hostname;
  const pageName = decodeURIComponent(
    wikiUrl.replace(`https://${domain}/wiki/`, "").split("?")[0],
  );
  const apiUrl = `https://${domain}/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json`;

  let wikitext: string;
  try {
    const resp = await fetch(apiUrl, {
      headers: { "User-Agent": "DieCastList/1.0 (https://diecastlist.com)" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = (await resp.json()) as {
      parse?: { wikitext?: { "*": string } };
      error?: { info: string };
    };
    if (json.error) throw new Error(json.error.info);
    wikitext = json.parse?.wikitext?.["*"] ?? "";
    if (!wikitext) throw new Error("Empty wikitext");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new HttpsError("unavailable", `Could not fetch wiki page: ${msg}`);
  }

  const MAX_CHARS = 150_000;
  if (wikitext.length > MAX_CHARS) wikitext = wikitext.slice(0, MAX_CHARS);

  const { output } = await ai.generate({
    model: googleAI.model("gemini-2.0-flash"),
    prompt: `You are parsing a diecast car collector checklist from MediaWiki markup.

Extract every car entry from the wiki table(s) below and return a structured list. For each car:
- toyNumber: toy/item number (e.g. "001", "TH1") — empty string if absent
- collectorNumber: collector number (e.g. "1/250") — empty string if absent
- modelName: the car model name — required
- seriesName: series name (e.g. "HW Dream Garage") — empty string if absent
- seriesNumber: series position (e.g. "1/10") — empty string if absent
- variationLabel: color or variant description — empty string if absent
- rarityType: one of Mainline | Treasure Hunt | Super Treasure Hunt | Premium | Regular | Chase | Limited Edition | Unknown
- notes: any extra info — empty string if absent

Return ONLY the structured data.

Wiki markup:
${wikitext}`,
    output: { schema: ParsedChecklistSchema },
  });

  if (!output?.items?.length) {
    throw new HttpsError(
      "internal",
      "AI could not parse any items from this wiki page. Check that the URL points directly to a checklist page.",
    );
  }

  const resolvedBrand = brand ?? "Hot Wheels";
  const checklistId = `${year}-${toSlug(name.trim())}`;
  const checklistRef = db.collection("checklists").doc(checklistId);
  const uniqueSeries = [
    ...new Set(output.items.map((it) => it.seriesName).filter(Boolean)),
  ];

  await checklistRef.set(
    {
      id: checklistId,
      name: name.trim(),
      brand: resolvedBrand,
      brandId: toSlug(resolvedBrand),
      brandName: resolvedBrand,
      year,
      category: category ?? "Mainline",
      description: "",
      sourceName: "Hot Wheels Wiki",
      sourceUrl: wikiUrl,
      sourceLicense: "CC-BY-SA",
      sourceAttribution: `Content from ${domain} (${wikiUrl}), licensed under CC-BY-SA.`,
      totalCars: output.items.length,
      uniqueSeries,
      isPublic: false,
      createdBy: createdByUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      archivedAt: null,
    },
    { merge: true },
  );

  const itemsRef = checklistRef.collection("items");
  const BATCH_SIZE = 500;
  for (let i = 0; i < output.items.length; i += BATCH_SIZE) {
    const batch = db.batch();
    output.items.slice(i, i + BATCH_SIZE).forEach((item, localIdx) => {
      const globalIdx = i + localIdx;
      const itemId =
        [
          String(year),
          toSlug(item.toyNumber || "no-toy"),
          toSlug(item.collectorNumber || "no-col"),
          toSlug(item.modelName || "unknown").slice(0, 30),
          toSlug(item.variationLabel || "").slice(0, 20),
        ]
          .filter(Boolean)
          .join("-")
          .slice(0, 120) || `item-${globalIdx}`;

      batch.set(
        itemsRef.doc(itemId),
        {
          id: itemId,
          year,
          toyNumber: item.toyNumber,
          collectorNumber: item.collectorNumber,
          modelName: item.modelName,
          seriesName: item.seriesName,
          seriesNumber: item.seriesNumber,
          variationLabel: item.variationLabel,
          rarityType: item.rarityType,
          notes: item.notes,
          photoUrl: null,
          imageRef: null,
          sortOrder: globalIdx,
          normalizedSearchText: [
            item.modelName,
            item.seriesName,
            item.toyNumber,
            item.collectorNumber,
          ]
            .join(" ")
            .toLowerCase(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
    await batch.commit();
  }

  return {
    checklistId,
    name: name.trim(),
    totalCars: output.items.length,
    sourceUrl: wikiUrl,
    note: "Saved as draft — publish it in Admin Checklists when ready.",
  };
}

// ─── suggestCarSeries ─────────────────────────────────────────────────────────

const SeriesSuggestion = z.object({
  seriesName: z.string(),
  year: z.number().optional(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
});

const SuggestCarSeriesOutput = z.object({
  suggestions: z.array(SeriesSuggestion),
});

export const suggestCarSeries = onCall(
  { region: functionsRegion, secrets: [googleAiKey] },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    await assertPremium(request.auth.uid);

    const { carName, brand, year } = (request.data ?? {}) as {
      carName?: string;
      brand?: string;
      year?: number;
    };
    if (!carName?.trim()) {
      throw new HttpsError("invalid-argument", "carName is required.");
    }

    const ai = getAi();
    const { output } = await ai.generate({
      model: googleAI.model("gemini-2.0-flash"),
      prompt: `You are an expert on diecast car collections — Hot Wheels, Matchbox, and similar brands.

A collector wants to know which official series or checklist this car belongs to:
- Name: ${carName.trim()}${brand ? `\n- Brand: ${brand}` : ""}${year ? `\n- Year: ${year}` : ""}

Return up to 3 suggestions. For each, provide the series name, the model year if known, your confidence level, and any helpful notes.`,
      output: { schema: SuggestCarSeriesOutput },
    });

    if (!output) throw new HttpsError("internal", "AI returned no output.");
    return output;
  },
);

// ─── importChecklistFromWiki (Pro users) ──────────────────────────────────────

export const importChecklistFromWiki = onCall(
  {
    region: functionsRegion,
    secrets: [googleAiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    await assertPremium(request.auth.uid);

    const { wikiUrl, name, year, brand, category } = (request.data ??
      {}) as {
      wikiUrl?: string;
      name?: string;
      year?: number;
      brand?: string;
      category?: string;
    };

    if (
      !wikiUrl?.startsWith("https://hotwheels.fandom.com/wiki/") &&
      !wikiUrl?.startsWith("https://matchbox.fandom.com/wiki/")
    ) {
      throw new HttpsError(
        "invalid-argument",
        "wikiUrl must be a hotwheels.fandom.com or matchbox.fandom.com wiki URL.",
      );
    }
    if (!name?.trim()) {
      throw new HttpsError("invalid-argument", "name is required.");
    }
    if (!year || year < 1968 || year > 2100) {
      throw new HttpsError(
        "invalid-argument",
        "year must be a valid model year.",
      );
    }

    return importFromWikiUrl({
      wikiUrl,
      name,
      year,
      brand,
      category,
      createdByUid: request.auth.uid,
    });
  },
);

// ─── importChecklistAdmin (admin-only, no Pro requirement) ────────────────────

export const importChecklistAdmin = onCall(
  {
    region: functionsRegion,
    secrets: [googleAiKey],
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    await assertAdmin(request.auth.uid);

    const { wikiUrl, name, year, brand, category } = (request.data ??
      {}) as {
      wikiUrl?: string;
      name?: string;
      year?: number;
      brand?: string;
      category?: string;
    };

    if (!wikiUrl?.trim()) {
      throw new HttpsError("invalid-argument", "wikiUrl is required.");
    }
    if (!name?.trim()) {
      throw new HttpsError("invalid-argument", "name is required.");
    }
    if (!year || year < 1968 || year > 2100) {
      throw new HttpsError(
        "invalid-argument",
        "year must be a valid model year.",
      );
    }

    return importFromWikiUrl({
      wikiUrl,
      name,
      year,
      brand,
      category,
      createdByUid: request.auth.uid,
    });
  },
);

// ─── fetchFandomChecklistHtml (admin-only, returns rendered HTML, no write) ───
// Safely fetches a Fandom list page server-side (bypassing browser CORS) and
// returns the rendered HTML so the admin client can parse + preview it through
// the same import flow as a manual paste. This function never writes to
// Firestore — the client decides what to import after reviewing the preview.

export const fetchFandomChecklistHtml = onCall(
  {
    region: functionsRegion,
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    await assertAdmin(request.auth.uid);

    const { url } = (request.data ?? {}) as { url?: string };
    if (!url?.trim()) {
      throw new HttpsError("invalid-argument", "url is required.");
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      throw new HttpsError("invalid-argument", "That doesn't look like a valid web address.");
    }
    if (!/\.fandom\.com$/i.test(parsed.hostname) && !/\.wikia\.\w+$/i.test(parsed.hostname)) {
      throw new HttpsError(
        "invalid-argument",
        "Please paste a Hot Wheels Fandom (fandom.com) list page link.",
      );
    }

    const domain = parsed.hostname;
    const pageName = decodeURIComponent(
      parsed.pathname.replace(/^\/wiki\//, ""),
    );
    if (!pageName) {
      throw new HttpsError("invalid-argument", "The link is missing a page name.");
    }

    const apiUrl = `https://${domain}/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=text&format=json`;

    let html: string;
    let title = pageName;
    try {
      const resp = await fetch(apiUrl, {
        headers: { "User-Agent": "DieCastList/1.0 (https://diecastlist.com)" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = (await resp.json()) as {
        parse?: { title?: string; text?: { "*": string } };
        error?: { info: string };
      };
      if (json.error) throw new Error(json.error.info);
      html = json.parse?.text?.["*"] ?? "";
      title = json.parse?.title ?? pageName;
      if (!html) throw new Error("Empty page");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new HttpsError("unavailable", `Could not read that page: ${msg}`);
    }

    const MAX_CHARS = 1_200_000;
    if (html.length > MAX_CHARS) html = html.slice(0, MAX_CHARS);

    return { html, sourceUrl: url.trim(), title };
  },
);

// ─── askAI (Pro-only conversational assistant) ────────────────────────────────

const IntentSchema = z.object({
  intent: z.enum([
    "find_list",
    "billing_help",
    "collection_advice",
    "general",
  ]),
  year: z.number().optional(),
  brand: z.string().optional(),
  keywords: z.array(z.string()).default([]),
});

const ReplySchema = z.object({ reply: z.string() });

export const askAI = onCall(
  {
    region: functionsRegion,
    secrets: [googleAiKey],
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    await assertPremium(request.auth.uid);

    const { message, userContext } = (request.data ?? {}) as {
      message?: string;
      userContext?: { plan: string; trackedListIds: string[]; trackedCount: number };
    };

    if (!message?.trim()) {
      throw new HttpsError("invalid-argument", "message is required.");
    }

    const ai = getAi();
    const db = getFirestore();

    // Step 1: Classify intent and extract entities
    const { output: intentOutput } = await ai.generate({
      model: googleAI.model("gemini-2.0-flash"),
      prompt: `Classify this message from a diecast car collector app user.
Message: "${message.trim()}"

intent options:
- find_list: user wants to find, track, or get a specific checklist/set/series
- billing_help: questions about plans, pricing, upgrading, subscription
- collection_advice: advice about collecting, finding cars, rarity, values, storage
- general: general chat or anything else

If intent is find_list, also extract:
- year: the model year if mentioned (number like 2025)
- brand: the brand if mentioned ("Hot Wheels", "Matchbox", etc.)
- keywords: 2-4 important words from the list name that would help find it`,
      output: { schema: IntentSchema },
    });

    const intent = intentOutput?.intent ?? "general";

    // Step 2: Search Firestore for matching lists if intent is find_list
    type MatchedList = {
      id: string;
      name: string;
      year: number;
      brand: string;
      category: string;
      totalCars: number;
    };
    let matchedLists: MatchedList[] = [];

    if (intent === "find_list") {
      const snap = await db
        .collection("checklists")
        .where("isPublic", "==", true)
        .limit(60)
        .get();

      type ListRow = {
        id: string;
        name: string;
        year: number;
        brand: string;
        category: string;
        totalCars: number;
        score: number;
      };

      const queryYear = intentOutput?.year;
      const queryKeywords = (intentOutput?.keywords ?? []).map((k) =>
        k.toLowerCase(),
      );
      const msgLower = message.toLowerCase();

      const scored: ListRow[] = snap.docs.map((d) => {
        const data = d.data() as {
          name?: string;
          year?: number;
          brand?: string;
          category?: string;
          totalCars?: number;
        };
        const nameLower = (data.name ?? "").toLowerCase();
        let score = 0;
        if (queryYear && data.year === queryYear) score += 10;
        for (const kw of queryKeywords) {
          if (nameLower.includes(kw)) score += 3;
        }
        for (const word of msgLower.split(/\s+/)) {
          if (word.length > 3 && nameLower.includes(word)) score += 1;
        }
        return {
          id: d.id,
          name: data.name ?? "",
          year: data.year ?? 0,
          brand: data.brand ?? "Hot Wheels",
          category: data.category ?? "",
          totalCars: data.totalCars ?? 0,
          score,
        };
      });

      matchedLists = scored
        .filter((l) => l.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ score: _s, ...rest }) => rest);
    }

    // Step 3: Build context string for final reply
    const planContext = userContext?.plan ?? "Pro";
    const trackedCount = userContext?.trackedCount ?? 0;

    const listContext =
      matchedLists.length > 0
        ? `\nMatching lists found in the database:\n${matchedLists.map((l) => `- ${l.name} (${l.year}, ${l.totalCars} cars)`).join("\n")}`
        : intent === "find_list"
          ? "\nNo matching published checklists were found in the database."
          : "";

    const billingBlurb =
      intent === "billing_help"
        ? `\nPlan details for reference:
- Free: browse all checklists, no tracking
- Basic ($7/mo): 1 tracked list, 10 inventory cars
- Pro ($22/mo): 25 tracked lists, 5000 inventory cars, marketplace, AI assistant, wiki import`
        : "";

    const autoTrackNote =
      matchedLists.length > 0 && intent === "find_list"
        ? " The best matching list has been automatically added to their tracked lists."
        : "";

    const noListNote =
      intent === "find_list" && matchedLists.length === 0
        ? " Suggest they use the AI Import panel in Choose Lists to import a list from a Hot Wheels wiki URL, or ask an admin to add it."
        : "";

    const { output: replyOutput } = await ai.generate({
      model: googleAI.model("gemini-2.0-flash"),
      prompt: `You are a friendly AI assistant inside Die Cast List (diecastlist.com), a diecast car collection tracker for Hot Wheels, Matchbox, and similar collectors.

User plan: ${planContext}
User's tracked lists: ${trackedCount}
${listContext}${billingBlurb}

User message: "${message.trim()}"
${autoTrackNote}${noListNote}

Write a helpful, friendly reply in 2-4 sentences. Be enthusiastic about diecast collecting. Plain text only, no markdown.`,
      output: { schema: ReplySchema },
    });

    return {
      reply:
        replyOutput?.reply ??
        "I'm here to help with your diecast collection! Ask me anything.",
      matchedLists: matchedLists.length > 0 ? matchedLists : undefined,
      intent,
    };
  },
);
