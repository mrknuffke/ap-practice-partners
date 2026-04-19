// Shared system-prompt fragments reused across generation routes.
// Edit here; changes propagate everywhere automatically.

export const FORMATTING_RULES = `FORMATTING RULES — MANDATORY:
- NEVER use LaTeX (dollar signs $, $$, or backslash-escaped symbols like \\\\chi, \\\\alpha, \\\\frac). Use unicode directly: χ², α, β, Δ, μ, ≤, ≥, →, ∑, ×, ÷, π, σ, λ.
- Do NOT include raw backslashes in any JSON string value — they will break JSON parsing.
- For fractions, write inline: (observed − expected)² / expected, not \\\\frac{...}{...}.`;

export const STIMULUS_RULES = `STIMULUS RULES — MANDATORY:
- Every stimulus MUST contain actual rendered content. ABSOLUTELY FORBIDDEN: "imagine a graph", "consider a table", "suppose you are given", or any placeholder language. Render the actual data or diagram inline.
- Use a markdown table with explicit data points for numerical/experimental data, or a \`\`\`mermaid xychart-beta block for trends and graphs.
- NEVER use Mermaid flowcharts or diagrams to attempt to depict physical objects, biological structures (like cells), or experimental apparatuses—they look horrendous and confuse students. If a visual is needed, describe the observations textually, or provide a markdown table of experimental results.
- The stimulus alone must provide all information needed to answer the question.`;

export const CED_SCOPE_RULES = `CED ALIGNMENT (CRITICAL):
- Before generating any content, verify that the requested unit/topic appears in the CED unit list provided. If it does not match exactly, generate content for the closest matching CED unit and note the substitution.
- Do NOT generate questions testing content outside the unit/topic scope listed in the CED data above.`;
