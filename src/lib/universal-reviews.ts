
export const REVIEW_NAMES = [
    "Michael T.", "Sarah L.", "David R.", "James M.", "Jennifer K.",
    "Robert B.", "Lisa P.", "William H.", "Elizabeth S.", "John D.",
    "TechSolutions Inc.", "Datacenter Ops", "CloudNine Systems",
    "NetSecure LLC", "Alpha Servers", "Omega Corp", "SysAdmin Pro"
];

export const TECH_TITLES = [
    "IT Manager", "Senior DevOps Engineer", "CTO", "System Administrator",
    "Data Center Technician", "Network Engineer", "Infrastructure Lead",
    "Procurement Manager", "IT Director", "Solutions Architect"
];

const REVIEW_TEMPLATES = [
    "Excellent condition for a refurbished unit. Worked perfectly out of the box.",
    "Fast shipping and great packaging. The drive arrived safe and sound.",
    "Saved us 40% compared to buying new. Performance is indistinguishable.",
    "Great customer service when we had questions about compatibility.",
    "Genuine OEM part as described. Passed all our internal diagnostics.",
    "Will definitely order from here again. Reliable and cost-effective.",
    "Quick delivery saved our project timeline. Thanks!",
    "Hard to find legacy parts in this condition. A lifesaver.",
    "Seamless plug-and-play installation. Zero issues so far.",
    "Top notch quality. Clean serials and proper ESD packaging."
];

export const generateUniversalReviews = (count: number) => {
    return Array.from({ length: count }).map((_, i) => {
        const name = REVIEW_NAMES[Math.floor(Math.random() * REVIEW_NAMES.length)];
        const title = TECH_TITLES[Math.floor(Math.random() * TECH_TITLES.length)];
        const body = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];

        // Random date within last 6 months
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 180));
        const dateStr = date.toISOString().split('T')[0];

        return {
            author: `${name} - ${title}`,
            reviewBody: body,
            ratingValue: "5",
            datePublished: dateStr,
            source: 'universal'
        };
    });
};
