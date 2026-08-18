/**
 * Sanitizes markdown content to convert stray LaTeX notation into clean Unicode
 * notation, preventing unrendered LaTeX syntax from appearing in student-facing text.
 */
export function sanitizeMathContent(content: string): string {
  if (!content || typeof content !== "string") return "";

  let sanitized = content;

  // 1. Replace common LaTeX fraction macro \frac{num}{den} -> (num)/(den)
  // Repeat to handle nested fractions if any
  for (let i = 0; i < 3; i++) {
    sanitized = sanitized.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  }

  // 2. Replace \lim_{...} or \lim
  sanitized = sanitized.replace(/\\lim_\{([^}]+)\}/g, "lim($1)");
  sanitized = sanitized.replace(/\\lim\b/g, "lim");

  // 3. Replace \sqrt{...} -> √(...)
  sanitized = sanitized.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");

  // 4. Common symbols and operators
  sanitized = sanitized
    .replace(/\\(?:to|rightarrow)\b/g, "→")
    .replace(/\\leftarrow\b/g, "←")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mp\b/g, "∓")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\(?:le|leq)\b/g, "≤")
    .replace(/\\(?:ge|geq)\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\partial\b/g, "∂")
    .replace(/\\nabla\b/g, "∇")
    .replace(/\\int\b/g, "∫")
    .replace(/\\sum\b/g, "∑")
    .replace(/\\prod\b/g, "∏")
    .replace(/\\pi\b/g, "π")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\chi\b/g, "χ");

  // 5. Clean up simple inline dollar-wrapped variables and numbers:
  // e.g. $x$, $y$, $0/0$, $(x-3)$, $y = 6$, $(x-3)^2$
  sanitized = sanitized.replace(/\$([a-zA-Z0-9\s()\/+\-=\^.]+)\$/g, (match, inner) => {
    return inner.trim();
  });

  return sanitized;
}
