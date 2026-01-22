import * as fs from "fs";
import * as path from "path";

/**
 * CSS Optimization Report
 * Identifies optimization opportunities
 */

interface OptimizationIssue {
  type: "warning" | "error" | "info";
  rule: string;
  count: number;
  recommendation: string;
}

function analyzeCSS(filePath: string): OptimizationIssue[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const issues: OptimizationIssue[] = [];

  // Check for high specificity selectors
  const highSpecificity = (content.match(/\.[a-z]+ \.[a-z]+ \.[a-z]+ \{/g) || []).length;
  if (highSpecificity > 0) {
    issues.push({
      type: "warning",
      rule: "High Specificity",
      count: highSpecificity,
      recommendation: "Consider simplifying selectors to reduce specificity wars",
    });
  }

  // Check for !important usage
  const importantCount = (content.match(/!important/g) || []).length;
  if (importantCount > 0) {
    issues.push({
      type: "error",
      rule: "!important Usage",
      count: importantCount,
      recommendation: "Reduce usage of !important; use proper CSS hierarchy instead",
    });
  }

  // Check for duplicate colors
  const colorRegex = /#[0-9A-Fa-f]{6}/g;
  const colors = content.match(colorRegex) || [];
  const duplicateColors = new Map<string, number>();
  colors.forEach((color) => {
    duplicateColors.set(color, (duplicateColors.get(color) || 0) + 1);
  });

  const duplicates = Array.from(duplicateColors.entries()).filter(([_, count]) => count > 3);
  if (duplicates.length > 0) {
    issues.push({
      type: "warning",
      rule: "Duplicate Colors",
      count: duplicates.length,
      recommendation: "Use CSS variables or tokens instead of hardcoded colors",
    });
  }

  // Check for unused units
  const unusedUnits = (content.match(/px\s*;\s*\/\//g) || []).length;
  if (unusedUnits > 0) {
    issues.push({
      type: "info",
      rule: "Zero Values with Units",
      count: unusedUnits,
      recommendation: "Use '0' without units (0px can be just 0)",
    });
  }

  // Check for inline styles mixed with classes
  if (content.includes("style=") && content.includes("className=")) {
    issues.push({
      type: "warning",
      rule: "Mixed Styling Approaches",
      count: 1,
      recommendation: "Use consistent approach - prefer className with CSS files",
    });
  }

  return issues;
}

function generateOptimizationReport(): void {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 CSS OPTIMIZATION ANALYSIS");
  console.log("=".repeat(70));

  const stylesDir = path.join(process.cwd(), "src", "styles");
  if (!fs.existsSync(stylesDir)) {
    console.log("⚠️  Styles directory not found");
    return;
  }

  const cssFiles = fs.readdirSync(stylesDir).filter((f) => f.endsWith(".css"));
  const allIssues: Map<string, OptimizationIssue[]> = new Map();

  cssFiles.forEach((file) => {
    const filePath = path.join(stylesDir, file);
    const issues = analyzeCSS(filePath);
    if (issues.length > 0) {
      allIssues.set(file, issues);
    }
  });

  if (allIssues.size === 0) {
    console.log("✅ No optimization issues found!");
    console.log("=".repeat(70) + "\n");
    return;
  }

  allIssues.forEach((issues, file) => {
    console.log(`\n📄 ${file}`);
    console.log("-".repeat(70));

    issues.forEach((issue) => {
      const icon =
        issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️ " : "ℹ️ ";
      console.log(`${icon} ${issue.rule} (${issue.count} occurrences)`);
      console.log(`   💡 ${issue.recommendation}\n`);
    });
  });

  console.log("=".repeat(70));
  console.log("✨ Tips:");
  console.log("  • Use design tokens for colors, spacing, and typography");
  console.log("  • Extract reusable component styles into separate files");
  console.log("  • Use CSS custom properties for theming and consistency");
  console.log("  • Consider using CSS-in-JS or utility frameworks for scalability");
  console.log("=".repeat(70) + "\n");
}

generateOptimizationReport();
