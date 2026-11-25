export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  hasPortfolioBonus: boolean;
  explanation: string;
}

export function computeSkillMatch(
  candidateSkills: string[],
  requiredSkills: string[],
  hasPortfolio = false,
): MatchResult {
  const norm = (list: string[]) =>
    Array.from(new Set(list.map((s) => s.trim().toLowerCase()).filter(Boolean)));
  const candSet = new Set(norm(candidateSkills));
  const req = requiredSkills.map((s) => s.trim()).filter(Boolean);

  if (req.length === 0) {
    const base = hasPortfolio ? 85 : 70;
    return {
      score: base,
      matchedSkills: [],
      missingSkills: [],
      hasPortfolioBonus: hasPortfolio,
      explanation: hasPortfolio
        ? "Open to all backgrounds; your portfolio strengthens this match."
        : "Open to all backgrounds; add portfolio links to boost your profile.",
    };
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const skill of req) {
    if (candSet.has(skill.toLowerCase())) matchedSkills.push(skill);
    else missingSkills.push(skill);
  }

  const ratio = matchedSkills.length / req.length;
  const portfolioBonus = hasPortfolio ? 10 : 0;
  const score = Math.min(100, Math.round(ratio * 90 + portfolioBonus));

  const parts: string[] = [];
  if (matchedSkills.length > 0) {
    parts.push(`Matches ${matchedSkills.length}/${req.length} required skills (${matchedSkills.join(", ")})`);
  } else {
    parts.push(`No direct overlap yet with ${req.length} required skills`);
  }
  if (hasPortfolio) parts.push("+10% portfolio bonus");
  if (missingSkills.length > 0 && missingSkills.length <= 3) {
    parts.push(`Consider building: ${missingSkills.join(", ")}`);
  }

  return { score, matchedSkills, missingSkills, hasPortfolioBonus: hasPortfolio, explanation: parts.join(" · ") };
}

export function parseCommaList(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export const ME_TARGETS = {
  participants: 300,
  mentorships: 300,
  placements: 150,
  employers: 30,
  matches: 200,
  employment: 100,
} as const;