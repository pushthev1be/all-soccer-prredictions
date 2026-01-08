/**
 * Free design tokens importer - no Figma plugin needed!
 * 
 * Reads tokens from tokens/tokens.json and generates:
 * 1. CSS variables in src/styles/tokens.css
 * 2. TypeScript utilities in src/lib/tokens.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const repoRoot = process.cwd();
const tokensPath = join(repoRoot, "tokens", "tokens.json");
const cssOutputPath = join(repoRoot, "src", "styles", "tokens.css");
const tsOutputPath = join(repoRoot, "src", "lib", "tokens.ts");

try {
  console.log("🎨 Processing design tokens...");
  
  const tokensData = readFileSync(tokensPath, "utf8");
  const tokens = JSON.parse(tokensData);
  
  let cssVariables = "/* Auto-generated from tokens/tokens.json - Edit tokens and run: npm run tokens:build */\n\n:root {\n";
  
  // Process colors
  if (tokens.color) {
    cssVariables += "  /* Color Tokens */\n";
    Object.entries(tokens.color).forEach(([category, values]) => {
      if (typeof values === "object" && !Array.isArray(values)) {
        Object.entries(values as Record<string, string>).forEach(([name, value]) => {
          if (typeof value === "string") {
            cssVariables += `  --color-${category}-${name}: ${value};\n`;
          }
        });
      } else if (typeof values === "string") {
        cssVariables += `  --color-${category}: ${values};\n`;
      }
    });
  }
  
  // Process spacing
  if (tokens.spacing) {
    cssVariables += "\n  /* Spacing Tokens */\n";
    Object.entries(tokens.spacing).forEach(([size, value]) => {
      cssVariables += `  --spacing-${size}: ${value};\n`;
    });
  }
  
  // Process radius
  if (tokens.radius) {
    cssVariables += "\n  /* Radius Tokens */\n";
    Object.entries(tokens.radius).forEach(([size, value]) => {
      cssVariables += `  --radius-${size}: ${value};\n`;
    });
  }
  
  // Process typography
  if (tokens.typography) {
    cssVariables += "\n  /* Typography Tokens */\n";
    if (tokens.typography.fontFamily) {
      Object.entries(tokens.typography.fontFamily).forEach(([name, value]) => {
        cssVariables += `  --font-${name}: ${value};\n`;
      });
    }
    if (tokens.typography.fontSize) {
      Object.entries(tokens.typography.fontSize).forEach(([size, value]) => {
        cssVariables += `  --text-${size}: ${value};\n`;
      });
    }
    if (tokens.typography.fontWeight) {
      Object.entries(tokens.typography.fontWeight).forEach(([weight, value]) => {
        cssVariables += `  --font-${weight}: ${value};\n`;
      });
    }
  }
  
  cssVariables += "}\n";
  
  // Ensure output directory exists
  mkdirSync(join(repoRoot, "src", "styles"), { recursive: true });
  writeFileSync(cssOutputPath, cssVariables);
  console.log(`✅ Generated ${cssOutputPath}`);
  
  // Generate TypeScript utilities
  const tsContent = `// Auto-generated design tokens - DO NOT EDIT
// Edit tokens/tokens.json and run: npm run tokens:build

export const tokens = ${JSON.stringify(tokens, null, 2)} as const;

/**
 * Get token value by dot notation
 * Example: getToken('color.soccer.grass') → '#22c55e'
 */
export function getToken(path: string): string {
  const parts = path.split('.');
  let current: any = tokens;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      console.warn(\`Token not found: \${path}\`);
      return '';
    }
    current = current[part];
  }
  
  return typeof current === 'string' ? current : '';
}

/**
 * Prediction status colors from tokens
 */
export const statusColors = {
  pending: tokens.color.status.pending,
  processing: tokens.color.status.processing,
  completed: tokens.color.status.completed,
  failed: tokens.color.status.failed,
} as const;

/**
 * Soccer theme colors
 */
export const soccerColors = {
  grass: tokens.color.soccer.grass,
  pitch: tokens.color.soccer.pitch,
  goal: tokens.color.soccer.goal,
  card: tokens.color.soccer.card,
  referee: tokens.color.soccer.referee,
} as const;
`;
  
  mkdirSync(join(repoRoot, "src", "lib"), { recursive: true });
  writeFileSync(tsOutputPath, tsContent);
  console.log(`✅ Generated ${tsOutputPath}`);
  
  console.log("\n🎉 Design tokens built successfully!");
  console.log("\nYour tokens are ready:");
  console.log("  ✅ Soccer-themed colors");
  console.log("  ✅ Status colors (pending, processing, completed, failed)");
  console.log("  ✅ Spacing & radius tokens");
  console.log("  ✅ Typography tokens");
  console.log("  ✅ TypeScript utilities");
  
} catch (error) {
  console.error("❌ Error processing tokens:", error);
  process.exit(1);
}
