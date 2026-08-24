// Shared system-prompt fragments reused across generation routes.
// Edit here; changes propagate everywhere automatically.

export const FORMATTING_RULES = `FORMATTING RULES — MANDATORY:
- NEVER use LaTeX markup, dollar signs ($ or $$), or LaTeX command macros (\\frac, \\lim, \\int, \\sqrt, \\cdot, \\alpha, \\beta, \\chi, etc.).
- Write all mathematical expressions inline using standard Unicode characters, superscripts/subscripts, and clean plain-text notation:
  * Fractions: Write inline with parentheses and slashes: e.g. (x² − 9)/(x − 3) or (observed − expected)² / expected. NEVER write \\frac{...}{...}.
  * Limits: Write cleanly as: lim(x → 3) f(x) = 6 or lim(x → 0⁺) g(x). NEVER write \\lim_{...}.
  * Variables & Values: Write plain text: y = 6, f(x), x = 3, indeterminate form 0/0. NEVER wrap variables or numbers in dollar signs (no $x$, no $y$, no $0/0$).
  * Exponents & Subscripts: Use unicode or <sup>/<sub> tags: x², x³, x⁻¹, 10⁻³, f'(x), f''(x), H₂O, CO₂.
  * NEVER write a variable name with a literal underscore for a subscript (e.g., T_m, K_m, v_max, x_1). Always convert to tags or unicode instead: T<sub>m</sub>, K<sub>m</sub>, v<sub>max</sub>, x₁.
  * Standard Symbols: Use direct unicode symbols: ±, ×, ÷, ·, √, ∛, ∫, ∑, ∏, ∞, ≈, ≠, ≤, ≥, →, Δ, π, θ, μ, σ, χ².
  * Multi-step calculations: Present as a clean numbered list with one operation per line.
- Do NOT include raw backslashes in any JSON string value — they will break JSON parsing.
- SCIENTIFIC TYPOGRAPHY: Wrap the following in markdown italics using single asterisks so they render in italics:
  * Binomial scientific names (genus + species): *Enhydra lutris*, *Homo sapiens*, *Escherichia coli*
  * Gene symbols: *BRCA1*, *TP53*, *lacZ*
  * Virus names when conventionally italicized in scientific literature
  * Foreign-language terms used in their original form (e.g., *in vivo*, *in vitro*, *a priori*)
  * Titles of published works (books, long-form journal/paper titles)
  Do NOT italicize common names (e.g., "sea otter" stays plain). Do NOT italicize chemical formulas or element symbols.`;

export const STIMULUS_RULES = `STIMULUS RULES — MANDATORY:
- Every stimulus MUST contain actual rendered content. ABSOLUTELY FORBIDDEN: "imagine a graph", "consider a table", "suppose you are given", or any placeholder language. Render the actual data or diagram inline.
- Use a markdown table with explicit data points for numerical/experimental data, or a \`\`\`mermaid xychart-beta block for trends and graphs.
- NEVER use Mermaid flowcharts or diagrams to attempt to depict physical objects, biological structures (like cells), or experimental apparatuses—they look horrendous and confuse students. If a visual is needed, describe the observations textually, or provide a markdown table of experimental results.
- The stimulus alone must provide all information needed to answer the question.`;

export const CED_SCOPE_RULES = `CED ALIGNMENT (CRITICAL):
- Before generating any content, verify that the requested unit/topic appears in the CED unit list provided. If it does not match exactly, generate content for the closest matching CED unit and note the substitution.
- Do NOT generate questions testing content outside the unit/topic scope listed in the CED data above.`;
