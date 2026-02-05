"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRedirects = loadRedirects;
exports.legacyRedirectMiddleware = legacyRedirectMiddleware;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const redirects = new Map();
function safeDecode(input) {
    try {
        return decodeURIComponent(input || "");
    }
    catch (_a) {
        return input || "";
    }
}
function stripQueryHash(p) {
    return (p || "").split("?")[0].split("#")[0].trim();
}
function ensureLeadingSlash(p) {
    if (!p)
        return "";
    return p.startsWith("/") ? p : `/${p}`;
}
function stripTrailingSlash(p) {
    return (p || "").replace(/\/+$/, "");
}
function normalizeKeyPath(p) {
    const decoded = safeDecode(p);
    const clean = stripQueryHash(decoded);
    if (!clean)
        return "";
    const withSlash = ensureLeadingSlash(clean);
    return stripTrailingSlash(withSlash).toLowerCase();
}
function normalizeTargetPath(p) {
    const decoded = safeDecode(p);
    const clean = stripQueryHash(decoded);
    if (!clean)
        return "";
    const withSlash = ensureLeadingSlash(clean);
    return stripTrailingSlash(withSlash);
}
function resolveFinalTarget(startKeyLower, maxHops = 15) {
    const seen = new Set();
    let key = startKeyLower;
    for (let i = 0; i < maxHops; i++) {
        if (seen.has(key))
            return null;
        seen.add(key);
        const next = redirects.get(key);
        if (!next)
            return null;
        const nextKeyLower = normalizeKeyPath(next);
        if (!redirects.has(nextKeyLower))
            return next;
        key = nextKeyLower;
    }
    return null;
}
async function loadRedirects() {
    const filePath = path_1.default.join(process.cwd(), "redirects.csv");
    if (!fs_1.default.existsSync(filePath)) {
        console.log("[legacy-redirects] CSV not found at:", filePath);
        return;
    }
    return new Promise((resolve, reject) => {
        let count = 0;
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on("data", (row) => {
            const oldUrlRaw = (row["old url"] || row["oldUrl"] || "").toString().trim();
            const redirectToRaw = (row["redirectTo"] || row["redirect_to"] || "").toString().trim();
            if (!oldUrlRaw || !redirectToRaw)
                return;
            const fromKey = normalizeKeyPath(oldUrlRaw);
            const toPath = normalizeTargetPath(redirectToRaw);
            if (!fromKey || !toPath.startsWith("/"))
                return;
            if (fromKey === normalizeKeyPath(toPath))
                return;
            redirects.set(fromKey, toPath);
            count++;
        })
            .on("end", () => {
            console.log(`[legacy-redirects] Loaded ${count} redirects from ${filePath}`);
            resolve();
        })
            .on("error", (err) => {
            console.error("[legacy-redirects] Failed to load CSV", err);
            reject(err);
        });
    });
}
function legacyRedirectMiddleware(req, res, next) {
    if (process.env.ENABLE_LEGACY_REDIRECTS !== "true")
        return next();
    const raw = String(req.originalUrl || req.url || req.path || "");
    const incomingPath = stripTrailingSlash(ensureLeadingSlash(stripQueryHash(raw)));
    const incomingKey = normalizeKeyPath(raw);
    const directTarget = redirects.get(incomingKey);
    if (!directTarget)
        return next();
    const directTargetPathOnly = stripTrailingSlash(stripQueryHash(directTarget));
    const directTargetKey = normalizeKeyPath(directTargetPathOnly);
    const qIndex = raw.indexOf("?");
    const query = qIndex !== -1 ? raw.slice(qIndex) : "";
    if (incomingPath.toLowerCase() === directTargetPathOnly.toLowerCase())
        return next();
    const back = redirects.get(directTargetKey);
    if (back) {
        const backPathOnly = stripTrailingSlash(stripQueryHash(back));
        if (backPathOnly.toLowerCase() === incomingPath.toLowerCase()) {
            return next();
        }
    }
    const finalTarget = resolveFinalTarget(incomingKey) || directTarget;
    const finalPathOnly = stripTrailingSlash(stripQueryHash(finalTarget));
    if (incomingPath.toLowerCase() === finalPathOnly.toLowerCase())
        return next();
    return res.redirect(301, finalTarget + query);
}
//# sourceMappingURL=legacy-redirects.js.map