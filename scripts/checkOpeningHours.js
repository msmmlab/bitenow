// scripts/checkOpeningHours.js
//
// ✅ Updates locations/<townSlug>.js IN-PLACE by adding/updating:
//    - google_place_id
//    - opening_hours_json
//    - internationalPhoneNumber
//    - rating
//    - userRatingCount
//    - primaryType
//    - businessStatus
//    - validationStatus ("Passed" | "Rejected")
//    - validationReason (why rejected / or "match_ok")
//    - googleMatchedName (for audits)
//    - googleMatchedAddress (for audits)
//
// ✅ PRESERVES formatting/comments using AST (recast)
// ✅ Avoids redundant calls:
//    - If google_place_id exists => details only
//    - Else => searchText + details, then saves google_place_id
// ✅ Skips API calls only if ALL exist (unless --force):
//    - opening_hours_json is non-empty
//    - internationalPhoneNumber exists
//    - rating exists
//    - userRatingCount exists
//    - primaryType exists
//    - businessStatus exists
//    - validationStatus exists
//
// Usage:
//   DEBUG_PLACES=1 node scripts/checkOpeningHours.js buderim 4
//   node scripts/checkOpeningHours.js buderim all
//   node scripts/checkOpeningHours.js buderim all --force
//
// Env (.env.local):
//   GOOGLE_PLACES_API_KEY=xxxx
// Optional:
//   DEBUG_PLACES=1  (prints extra details/logs)
//
const fs = require("fs");
const path = require("path");
const recast = require("recast");
const babelParser = require("@babel/parser");

/* -------------------- Validation rules -------------------- */

const DISALLOWED_TYPES = [
    "community_center",
    "shopping_mall",
    "church",
    "place_of_worship",
    "school",
    "university",
    "gym",
    "sports_complex",
    "health",
    "event_venue",
    "lodging",
];

// Primary types that are “food-first” businesses.
// If primaryType is one of these, we allow even if the place is inside a larger complex.
const FOOD_FIRST_PRIMARY_TYPES = [
    "cafe",
    "restaurant",
    "bar",
    "bakery",
    "meal_takeaway",
    "meal_delivery",
];

function validatePlaceDetailsForVenueMatch(details, venue) {
    const name = (details?.displayName?.text || "").toLowerCase().trim();
    const venueName = (venue?.name || "").toLowerCase().trim();

    const primaryType = (details?.primaryType || "").toLowerCase();
    const types = (details?.types || []).map((t) => (t || "").toLowerCase());

    const formattedAddress = (details?.formattedAddress || "").toLowerCase().trim();
    const venueAddress = (venue?.address || "").toLowerCase().trim();

    // --- A) Hard reject: disallowed types (with food-first escape hatch)
    const hasDisallowed = types.some((t) => DISALLOWED_TYPES.includes(t));
    const isFoodFirstPrimary = FOOD_FIRST_PRIMARY_TYPES.includes(primaryType);

    if (hasDisallowed && !isFoodFirstPrimary) {
        return {
            ok: false,
            reason: "disallowed_types",
            debug: { primaryType, types },
        };
    }

    // --- B) Name sanity check
    const venueTokens = venueName.split(/\s+/).filter(Boolean);
    const tokenHits = venueTokens.filter((tok) => tok.length >= 4 && name.includes(tok)).length;

    // Require at least 2 meaningful token hits (e.g. "goodlife" + "cafe")
    if (venueTokens.length >= 2 && tokenHits < 2) {
        return {
            ok: false,
            reason: "name_mismatch",
            debug: { name, venueName, tokenHits },
        };
    }

    // --- C) Address sanity check (fuzzy)
    const hasSomeAddressOverlap =
        !venueAddress ||
        !formattedAddress ||
        venueAddress.includes("marketplace") ||
        venueAddress.includes("shopping") ||
        formattedAddress.includes("marketplace") ||
        venueAddress.split(/\s+/).some((w) => w.length >= 5 && formattedAddress.includes(w));

    if (!hasSomeAddressOverlap) {
        return {
            ok: false,
            reason: "address_mismatch",
            debug: { formattedAddress, venueAddress },
        };
    }

    return {
        ok: true,
        reason: "match_ok",
        debug: { primaryType, types },
    };
}

/* -------------------- AST setup -------------------- */

const b = recast.types.builders;

function parseWithBabel(source) {
    return recast.parse(source, {
        parser: {
            parse(code) {
                return babelParser.parse(code, {
                    sourceType: "module",
                    plugins: [
                        "jsx",
                        "typescript",
                        "classProperties",
                        "objectRestSpread",
                        "optionalChaining",
                        "nullishCoalescingOperator",
                    ],
                    allowReturnOutsideFunction: true,
                });
            },
        },
    });
}

/* -------------------- Env loading -------------------- */

function loadEnv() {
    const envPath = path.join(__dirname, "../.env.local");
    if (!fs.existsSync(envPath)) return;

    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const idx = trimmed.indexOf("=");
        if (idx === -1) return;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (key) process.env[key] = value;
    });
}
loadEnv();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!GOOGLE_PLACES_API_KEY) {
    console.error("❌ Error: GOOGLE_PLACES_API_KEY is not set in .env.local");
    process.exit(1);
}

const LOCATIONS_DIR = path.join(__dirname, "../locations");

/* -------------------- Helpers -------------------- */

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function toSlug(townArg) {
    return String(townArg || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

// Hours schema
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DOW_TO_KEY = {
    MONDAY: "mon",
    TUESDAY: "tue",
    WEDNESDAY: "wed",
    THURSDAY: "thu",
    FRIDAY: "fri",
    SATURDAY: "sat",
    SUNDAY: "sun",
};

function hmToHHMM(h, m) {
    const hh = String(h ?? 0).padStart(2, "0");
    const mm = String(m ?? 0).padStart(2, "0");
    return `${hh}${mm}`;
}

function emptyHours() {
    return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

function dedupeSort(list) {
    const seen = new Set();
    const out = [];
    for (const p of list || []) {
        if (!p || !p.open || !p.close) continue;
        const key = `${p.open}-${p.close}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(p);
    }
    out.sort((a, b) => String(a.open).localeCompare(String(b.open)));
    return out;
}

/* -------------------- Normalize opening hours -------------------- */

function normalizeHoursFromPeriods(detailsJson) {
    const out = emptyHours();
    const periods = detailsJson?.regularOpeningHours?.periods || detailsJson?.currentOpeningHours?.periods;
    if (!Array.isArray(periods) || periods.length === 0) return null;

    for (const p of periods) {
        const open = p?.open;
        const close = p?.close;
        if (!open) continue;

        const dayKey = DOW_TO_KEY[open.day];
        if (!dayKey) continue;

        const openStr = hmToHHMM(open.hour, open.minute);
        const closeStr = close ? hmToHHMM(close.hour, close.minute) : "2359";

        out[dayKey].push({ open: openStr, close: closeStr });
    }

    for (const k of DAY_KEYS) out[k] = dedupeSort(out[k]);
    return DAY_KEYS.some((k) => out[k].length) ? out : null;
}

function parseWeekdayDescriptions(descArr) {
    if (!Array.isArray(descArr) || descArr.length === 0) return null;

    const out = emptyHours();
    const dayMap = {
        monday: "mon",
        tuesday: "tue",
        wednesday: "wed",
        thursday: "thu",
        friday: "fri",
        saturday: "sat",
        sunday: "sun",
    };

    function toHHMMSmart(timeStr, assumeSuffix) {
        const s = String(timeStr)
            .trim()
            .toLowerCase()
            .replace(/\u202f/g, " ")
            .replace(/\s+/g, " ");

        const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
        if (!m) return null;

        let h = parseInt(m[1], 10);
        const min = parseInt(m[2] || "00", 10);
        const suffix = (m[3] || assumeSuffix || "").toLowerCase();
        if (!suffix) return null;

        if (suffix === "pm" && h !== 12) h += 12;
        if (suffix === "am" && h === 12) h = 0;

        return String(h).padStart(2, "0") + String(min).padStart(2, "0");
    }

    for (const line of descArr) {
        const lineStr = String(line).replace(/\u202f/g, " ");
        const idx = lineStr.indexOf(":");
        if (idx === -1) continue;

        const dayName = lineStr.slice(0, idx).trim().toLowerCase();
        const dayKey = dayMap[dayName];
        if (!dayKey) continue;

        const rest = lineStr.slice(idx + 1).trim();
        if (!rest || /closed/i.test(rest)) continue;

        const ranges = rest
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);

        for (const r of ranges) {
            const m = r.match(/(.+?)[–—-](.+)/);
            if (!m) continue;

            const left = m[1].trim();
            const right = m[2].trim();

            const rightSuffixMatch = right.toLowerCase().match(/\b(am|pm)\b/);
            const inferredSuffix = rightSuffixMatch ? rightSuffixMatch[1] : null;

            const open = toHHMMSmart(left, inferredSuffix);
            const close = toHHMMSmart(right, inferredSuffix);

            if (open && close) out[dayKey].push({ open, close });
        }
    }

    for (const k of DAY_KEYS) out[k] = dedupeSort(out[k]);
    return DAY_KEYS.some((k) => out[k].length) ? out : null;
}

function normalizeHours(detailsJson) {
    return (
        normalizeHoursFromPeriods(detailsJson) ||
        parseWeekdayDescriptions(
            detailsJson?.regularOpeningHours?.weekdayDescriptions || detailsJson?.currentOpeningHours?.weekdayDescriptions
        )
    );
}

/* -------------------- Address scoring for searchText candidates -------------------- */

function scoreAddressMatch(venueAddress, candidateAddress) {
    if (!venueAddress || !candidateAddress) return 0;

    const a = venueAddress.toLowerCase();
    const b = candidateAddress.toLowerCase();
    let score = 0;

    const number = (a.match(/\b\d+\b/) || [])[0];
    if (number && b.includes(number)) score += 2;

    // (optional: tune per region; harmless if not present)
    const keyTokens = ["qld", "4551", "4556", "4557"];
    for (const t of keyTokens) if (a.includes(t) && b.includes(t)) score += 2;

    const tokens = a.split(/[^a-z0-9]+/).filter(Boolean);
    let hits = 0;
    for (const t of tokens) {
        if (t.length < 4) continue;
        if (b.includes(t)) hits++;
    }
    score += Math.min(hits, 6);

    return score;
}

function pickBestPlace(searchJson, venue) {
    const places = searchJson?.places;
    if (!Array.isArray(places) || places.length === 0) return null;

    let best = places[0];
    let bestScore = -1;

    for (const p of places) {
        const s = scoreAddressMatch(venue.address, p.formattedAddress);
        if (s > bestScore) {
            bestScore = s;
            best = p;
        }
    }
    return best;
}

/* -------------------- Google Places API -------------------- */

// Sunshine Coast bias
const DEFAULT_BIAS_CENTER = { lat: -26.7, lng: 153.1 };
const DEFAULT_BIAS_RADIUS_M = 45000;

async function placesSearchText(textQuery) {
    const url = "https://places.googleapis.com/v1/places:searchText";

    const body = {
        textQuery,
        locationBias: {
            circle: {
                center: {
                    latitude: DEFAULT_BIAS_CENTER.lat,
                    longitude: DEFAULT_BIAS_CENTER.lng,
                },
                radius: DEFAULT_BIAS_RADIUS_M,
            },
        },
        maxResultCount: 5,
        languageCode: "en-AU",
        regionCode: "AU",
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`places:searchText failed (${res.status}): ${text.slice(0, 400)}`);
    }
    return res.json();
}

async function placesGetDetails(placeId) {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask":
                "id,displayName,formattedAddress,internationalPhoneNumber,rating,userRatingCount,businessStatus,primaryType,types,regularOpeningHours.periods,regularOpeningHours.weekdayDescriptions,currentOpeningHours.periods,currentOpeningHours.weekdayDescriptions,utcOffsetMinutes",
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`places details failed (${res.status}): ${text.slice(0, 400)}`);
    }
    return res.json();
}

async function getBestPlaceForVenue(venue) {
    const town = "Sunshine Coast, QLD";
    const parts = [venue.name];
    if (venue.address) parts.push(venue.address);
    parts.push(town);

    const query = parts.join(", ");
    const searchJson = await placesSearchText(query);
    return pickBestPlace(searchJson, venue);
}

/* -------------------- AST helpers -------------------- */

function isIdentifierNamed(node, name) {
    return node && node.type === "Identifier" && node.name === name;
}

function isModuleExports(node) {
    return (
        node &&
        node.type === "MemberExpression" &&
        node.object &&
        node.property &&
        isIdentifierNamed(node.object, "module") &&
        isIdentifierNamed(node.property, "exports")
    );
}

function getPropKeyName(prop) {
    if (!prop) return null;
    const k = prop.key;
    if (!k) return null;
    if (k.type === "Identifier") return k.name;
    if (k.type === "StringLiteral" || k.type === "Literal") return String(k.value);
    return null;
}

function findObjectProperty(objExpr, propName) {
    if (!objExpr || objExpr.type !== "ObjectExpression") return null;
    return objExpr.properties.find((p) => getPropKeyName(p) === propName) || null;
}

function getStringValue(node) {
    if (!node) return null;
    if (node.type === "StringLiteral" || node.type === "Literal") return String(node.value);
    return null;
}

function getNumberValue(node) {
    if (!node) return null;
    if (node.type === "NumericLiteral") return node.value;
    if (node.type === "Literal" && typeof node.value === "number") return node.value;
    return null;
}

function objectLiteralFromHours(hours) {
    const dayProps = DAY_KEYS.map((day) => {
        const periods = Array.isArray(hours?.[day]) ? hours[day] : [];
        const arr = b.arrayExpression(
            periods.map((p) =>
                b.objectExpression([
                    b.property("init", b.identifier("open"), b.stringLiteral(p.open)),
                    b.property("init", b.identifier("close"), b.stringLiteral(p.close)),
                ])
            )
        );
        return b.property("init", b.identifier(day), arr);
    });

    return b.objectExpression(dayProps);
}

function extractVenuesFromAST(ast) {
    const body = ast.program.body;

    for (const stmt of body) {
        if (stmt.type !== "ExpressionStatement") continue;
        const expr = stmt.expression;
        if (!expr || expr.type !== "AssignmentExpression") continue;
        if (!isModuleExports(expr.left)) continue;

        const rhs = expr.right;
        if (!rhs || rhs.type !== "ObjectExpression") continue;

        const venuesProp = findObjectProperty(rhs, "venues");
        if (!venuesProp) return { venuesArrayExpr: null };

        const venuesVal = venuesProp.value;
        if (!venuesVal || venuesVal.type !== "ArrayExpression") return { venuesArrayExpr: null };

        return { venuesArrayExpr: venuesVal };
    }

    return { venuesArrayExpr: null };
}

function extractVenueMeta(venueObjExpr) {
    const nameProp = findObjectProperty(venueObjExpr, "name");
    const addrProp = findObjectProperty(venueObjExpr, "address");

    const hoursProp = findObjectProperty(venueObjExpr, "opening_hours_json");
    const placeIdProp = findObjectProperty(venueObjExpr, "google_place_id");

    const phoneProp = findObjectProperty(venueObjExpr, "internationalPhoneNumber");
    const ratingProp = findObjectProperty(venueObjExpr, "rating");

    const userRatingCountProp = findObjectProperty(venueObjExpr, "userRatingCount");
    const primaryTypeProp = findObjectProperty(venueObjExpr, "primaryType");
    const businessStatusProp = findObjectProperty(venueObjExpr, "businessStatus");
    const validationStatusProp = findObjectProperty(venueObjExpr, "validationStatus");

    const name = nameProp ? getStringValue(nameProp.value) : null;
    const address = addrProp ? getStringValue(addrProp.value) : null;
    const google_place_id = placeIdProp ? getStringValue(placeIdProp.value) : null;

    const internationalPhoneNumber = phoneProp ? getStringValue(phoneProp.value) : null;
    const rating = ratingProp ? getNumberValue(ratingProp.value) : null;

    const userRatingCount = userRatingCountProp ? getNumberValue(userRatingCountProp.value) : null;
    const primaryType = primaryTypeProp ? getStringValue(primaryTypeProp.value) : null;
    const businessStatus = businessStatusProp ? getStringValue(businessStatusProp.value) : null;
    const validationStatus = validationStatusProp ? getStringValue(validationStatusProp.value) : null;

    let hasNonEmptyHours = false;
    if (hoursProp && hoursProp.value && hoursProp.value.type === "ObjectExpression") {
        for (const p of hoursProp.value.properties) {
            const k = getPropKeyName(p);
            if (k && DAY_KEYS.includes(k) && p.value && p.value.type === "ArrayExpression") {
                if ((p.value.elements || []).length > 0) {
                    hasNonEmptyHours = true;
                    break;
                }
            }
        }
    }

    const hasPhone = !!(internationalPhoneNumber && String(internationalPhoneNumber).trim());
    const hasRating = typeof rating === "number" && Number.isFinite(rating);

    const hasUserRatingCount = typeof userRatingCount === "number" && Number.isFinite(userRatingCount);
    const hasPrimaryType = !!(primaryType && String(primaryType).trim());
    const hasBusinessStatus = !!(businessStatus && String(businessStatus).trim());
    const hasValidationStatus = !!(validationStatus && String(validationStatus).trim());

    return {
        name,
        address,
        google_place_id,
        hasNonEmptyHours,
        hasPhone,
        hasRating,
        hasUserRatingCount,
        hasPrimaryType,
        hasBusinessStatus,
        hasValidationStatus,
    };
}

function upsertStringProperty(objExpr, propName, value) {
    if (value == null || value === "") return;
    const existing = findObjectProperty(objExpr, propName);
    const newProp = b.property("init", b.identifier(propName), b.stringLiteral(String(value)));

    if (existing) {
        existing.value = newProp.value;
        return;
    }
    objExpr.properties.push(newProp);
}

function upsertNumberProperty(objExpr, propName, value) {
    if (value == null || !Number.isFinite(value)) return;
    const existing = findObjectProperty(objExpr, propName);
    const newProp = b.property("init", b.identifier(propName), b.numericLiteral(value));

    if (existing) {
        existing.value = newProp.value;
        return;
    }
    objExpr.properties.push(newProp);
}

function upsertHoursProperty(venueObjExpr, hoursObjLiteralExpr) {
    const existing = findObjectProperty(venueObjExpr, "opening_hours_json");
    if (existing) {
        existing.value = hoursObjLiteralExpr;
        return;
    }
    venueObjExpr.properties.push(b.property("init", b.identifier("opening_hours_json"), hoursObjLiteralExpr));
}

/* -------------------- Main -------------------- */

async function run() {
    const townArg = process.argv[2];
    const countArg = process.argv[3];
    const force = process.argv.includes("--force");

    if (!townArg || !countArg) {
        console.error("Usage: node scripts/checkOpeningHours.js <Town> <all|N> [--force]");
        process.exit(1);
    }

    const townSlug = toSlug(townArg);
    const filePath = path.join(LOCATIONS_DIR, `${townSlug}.js`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    const source = fs.readFileSync(filePath, "utf8");
    const ast = parseWithBabel(source);

    const { venuesArrayExpr } = extractVenuesFromAST(ast);
    if (!venuesArrayExpr) {
        console.error("❌ Could not find module.exports.venues array in file (AST parse).");
        process.exit(1);
    }

    const venueNodes = venuesArrayExpr.elements
        .filter(Boolean)
        .filter((n) => n.type === "ObjectExpression");

    let limit;
    if (String(countArg).toLowerCase() === "all") {
        limit = venueNodes.length;
    } else {
        const n = Number(countArg);
        if (!Number.isFinite(n) || n <= 0) {
            console.error(`❌ Invalid count "${countArg}". Use "all" or a positive number.`);
            process.exit(1);
        }
        limit = Math.min(n, venueNodes.length);
    }

    console.log(`\n🔍 ${townSlug.toUpperCase()} — checking data for ${limit}/${venueNodes.length} venues (Google Places)`);
    console.log("------------------------------------------------------------");

    let updated = 0;
    let skipped = 0;
    let detailsOnly = 0;
    let searched = 0;

    for (let i = 0; i < limit; i++) {
        const venueObjExpr = venueNodes[i];
        const meta = extractVenueMeta(venueObjExpr);
        const displayName = meta.name || `(venue #${i + 1})`;

        // ✅ Skip only if ALL are present (unless --force)
        const isComplete =
            meta.hasNonEmptyHours &&
            meta.hasPhone &&
            meta.hasRating &&
            meta.hasUserRatingCount &&
            meta.hasPrimaryType &&
            meta.hasBusinessStatus &&
            meta.hasValidationStatus;

        if (!force && isComplete) {
            skipped++;
            console.log(`⏭️  [${i + 1}/${limit}] ${displayName}... (skipped; all fields already present)`);
            continue;
        }

        process.stdout.write(`📡 [${i + 1}/${limit}] ${displayName}... `);

        try {
            let placeId = meta.google_place_id || null;

            if (!placeId) {
                const best = await getBestPlaceForVenue({
                    name: meta.name || "",
                    address: meta.address || "",
                });
                if (!best?.id) {
                    console.log("❌ Not Found");
                    // mark as rejected audit (no match)
                    upsertStringProperty(venueObjExpr, "validationStatus", "Rejected");
                    upsertStringProperty(venueObjExpr, "validationReason", "not_found");
                    updated++;
                    continue;
                }
                placeId = best.id;
                searched++;

                console.log(`\n    ↳ matched: ${best.displayName?.text || "(no name)"} | ${best.formattedAddress || "(no address)"} | ${placeId}`);

                upsertStringProperty(venueObjExpr, "google_place_id", placeId);
            } else {
                detailsOnly++;
                console.log(`\n    ↳ using google_place_id: ${placeId}`);
            }

            const details = await placesGetDetails(placeId);

            const venue = {
                name: meta.name || "",
                address: meta.address || "",
            };

            const verdict = validatePlaceDetailsForVenueMatch(details, venue);

            // Persist audit info no matter what (helps debugging)
            upsertStringProperty(venueObjExpr, "googleMatchedName", details?.displayName?.text || "");
            upsertStringProperty(venueObjExpr, "googleMatchedAddress", details?.formattedAddress || "");

            if (!verdict.ok) {
                upsertStringProperty(venueObjExpr, "validationStatus", "Rejected");
                upsertStringProperty(venueObjExpr, "validationReason", verdict.reason);

                if (process.env.DEBUG_PLACES === "1") {
                    console.log(`❌ Reject match for "${venue.name}" → "${details?.displayName?.text}"`, verdict);
                } else {
                    console.log(`❌ Rejected (${verdict.reason})`);
                }
                updated++;
                continue; // ✅ reject but continue processing next venues
            }

            // ✅ accepted
            upsertStringProperty(venueObjExpr, "validationStatus", "Passed");
            upsertStringProperty(venueObjExpr, "validationReason", "match_ok");

            // --- Persist “metadata” fields
            const userRatingCount = typeof details?.userRatingCount === "number" ? details.userRatingCount : null;
            const primaryType = typeof details?.primaryType === "string" ? details.primaryType : null;
            const businessStatus = typeof details?.businessStatus === "string" ? details.businessStatus : null;

            if (userRatingCount != null) upsertNumberProperty(venueObjExpr, "userRatingCount", userRatingCount);
            if (primaryType) upsertStringProperty(venueObjExpr, "primaryType", primaryType);
            if (businessStatus) upsertStringProperty(venueObjExpr, "businessStatus", businessStatus);

            if (process.env.DEBUG_PLACES === "1") {
                console.log("✅ Accepted Google match", {
                    venue: venue.name,
                    googleName: details.displayName?.text,
                    rating: details.rating,
                    userRatingCount: details.userRatingCount,
                    primaryType: details.primaryType,
                    businessStatus: details.businessStatus,
                });
            }

            // hours (only update if missing OR --force)
            const needHours = force || !meta.hasNonEmptyHours;
            if (needHours) {
                const rawPeriods = details?.regularOpeningHours?.periods || details?.currentOpeningHours?.periods;
                if (rawPeriods) console.log(`    ↳ raw periods count: ${rawPeriods.length}`);

                const hours = normalizeHours(details);
                if (hours) {
                    upsertHoursProperty(venueObjExpr, objectLiteralFromHours(hours));
                    console.log(`    ✅ opening_hours_json updated`);
                } else {
                    console.log("    ⚠️ No opening hours fields (periods/weekdayDescriptions)");
                }
            } else {
                console.log("    ⏭️  opening_hours_json already present (not forcing)");
            }

            // phone + rating (fill if missing OR refresh if --force)
            const phone = details?.internationalPhoneNumber || null;
            const rating = typeof details?.rating === "number" ? details.rating : null;

            const needPhone = force || !meta.hasPhone;
            const needRating = force || !meta.hasRating;

            if (needPhone && phone) {
                upsertStringProperty(venueObjExpr, "internationalPhoneNumber", phone);
                console.log(`    ✅ internationalPhoneNumber updated`);
            } else if (!needPhone) {
                console.log("    ⏭️  internationalPhoneNumber already present (not forcing)");
            } else {
                console.log("    ⚠️ No internationalPhoneNumber in details");
            }

            if (needRating && rating != null) {
                upsertNumberProperty(venueObjExpr, "rating", rating);
                console.log(`    ✅ rating updated`);
            } else if (!needRating) {
                console.log("    ⏭️  rating already present (not forcing)");
            } else {
                console.log("    ⚠️ No rating in details");
            }

            updated++;
        } catch (err) {
            console.log(`\n    ❌ Error: ${err.message}`);
            // audit failure
            upsertStringProperty(venueObjExpr, "validationStatus", "Rejected");
            upsertStringProperty(venueObjExpr, "validationReason", "api_error");
            updated++;
        }

        await sleep(150);
    }

    console.log("------------------------------------------------------------");
    console.log(`✨ Done. Updated ${updated}/${limit}. Skipped ${skipped}. (searchText=${searched}, detailsOnly=${detailsOnly})\n`);

    // Always write file (even if some venues rejected)
    fs.copyFileSync(filePath, `${filePath}.bak`);
    const newSource = recast.print(ast, { quote: "double" }).code;
    fs.writeFileSync(filePath, newSource, "utf8");

    console.log(`📝 Saved updates to: ${filePath}`);
    console.log(`🛟 Backup: ${filePath}.bak`);
}

run().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
});
