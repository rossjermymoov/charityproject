import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Extract meaningful text from HTML
function extractText(html: string): string {
  // Remove scripts, styles, nav, header, footer
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Extract text from important elements
  const titles: string[] = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;
  while ((match = headingRegex.exec(text)) !== null) {
    titles.push(match[1].replace(/<[^>]*>/g, "").trim());
  }

  // Get meta description
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDesc = metaMatch ? metaMatch[1] : "";

  // Get paragraph text
  const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  while ((match = paraRegex.exec(text)) !== null) {
    const clean = match[1].replace(/<[^>]*>/g, "").trim();
    if (clean.length > 20) paragraphs.push(clean);
  }

  // Build a summary from the extracted content
  const parts: string[] = [];
  if (metaDesc) parts.push(`About: ${metaDesc}`);
  if (titles.length > 0) parts.push(`Key areas: ${titles.slice(0, 10).join(", ")}`);
  if (paragraphs.length > 0) parts.push(`Content: ${paragraphs.slice(0, 15).join(" ")}`);

  return parts.join("\n\n").slice(0, 3000);
}

// Analyse website content and produce a structured summary for letter generation
function summariseForLetters(rawText: string, url: string): string {
  // Extract key themes
  const lower = rawText.toLowerCase();

  const themes: string[] = [];

  // Check for common charity activities
  const checks: [RegExp, string][] = [
    [/food\s*bank|food\s*parc|hunger|meals/i, "providing food support to families in need"],
    [/mental\s*health|wellbeing|counselling|therapy/i, "supporting mental health and wellbeing"],
    [/youth|young\s*people|children|kids/i, "working with young people and children"],
    [/elderly|older\s*people|seniors|age\s*uk/i, "supporting elderly and vulnerable adults"],
    [/homeless|housing|shelter|rough\s*sleep/i, "tackling homelessness and housing issues"],
    [/education|training|skills|learning/i, "providing education and training opportunities"],
    [/community|neighbourhood|local|together/i, "building stronger local communities"],
    [/disability|accessible|inclusion|support/i, "supporting people with disabilities"],
    [/crisis|emergency|hardship|poverty/i, "helping people in crisis and hardship"],
    [/volunteer|donation|fundrais|support\s*us/i, "relying on community generosity and volunteers"],
    [/family|families|parent|carer/i, "supporting families and carers"],
    [/health|medical|hospital|NHS/i, "improving health outcomes in the community"],
    [/environment|green|sustainable|eco/i, "championing environmental sustainability"],
    [/art|music|culture|creative/i, "enriching lives through arts and culture"],
    [/sport|fitness|exercise|active/i, "promoting sport and active lifestyles"],
    [/animal|pet|wildlife|rescue/i, "caring for animals and wildlife"],
    [/hospice|palliative|end\s*of\s*life/i, "providing hospice and palliative care"],
    [/bereavement|grief|loss/i, "supporting people through bereavement"],
    [/addiction|recovery|substance|alcohol/i, "supporting addiction recovery"],
    [/domestic\s*abuse|violence|safe/i, "helping those affected by domestic abuse"],
  ];

  for (const [regex, desc] of checks) {
    if (regex.test(rawText)) themes.push(desc);
  }

  // Build summary
  const summary: string[] = [];
  summary.push(`Website: ${url}`);
  if (themes.length > 0) {
    summary.push(`This charity is dedicated to ${themes.slice(0, 5).join(", ")}.`);
  }

  // Extract any specific numbers/stats mentioned
  const statMatches = rawText.match(/\b(\d[\d,]+)\s*(people|families|meals|children|young|volunteer|community|beneficiar)/gi);
  if (statMatches && statMatches.length > 0) {
    summary.push(`Impact highlights: ${statMatches.slice(0, 4).join("; ")}`);
  }

  return summary.join("\n");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Normalise URL
  let fullUrl = url.trim();
  if (!fullUrl.startsWith("http")) fullUrl = `https://${fullUrl}`;

  // Fetch the website
  let html = "";
  try {
    const res = await fetch(fullUrl, {
      headers: { "User-Agent": "DeepCharity/1.0 (Letter Generator)" },
      signal: AbortSignal.timeout(10000),
    });
    html = await res.text();
  } catch (e: any) {
    return NextResponse.json({ error: `Could not fetch website: ${e.message}` }, { status: 400 });
  }

  // Extract and summarise
  const rawText = extractText(html);
  const summary = summariseForLetters(rawText, fullUrl);

  // Save to settings
  await prisma.systemSettings.update({
    where: { id: "default" },
    data: {
      charityWebsite: fullUrl,
      charityWebsiteSummary: summary,
    },
  });

  return NextResponse.json({ url: fullUrl, summary });
}
