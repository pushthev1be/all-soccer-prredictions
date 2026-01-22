import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Performance Audit Script
 * Analyzes CSS and generates performance metrics
 */

interface PerformanceMetrics {
  cssSize: number;
  jsSize: number;
  totalSize: number;
  cssRules: number;
  selectors: number;
  colorPalette: Set<string>;
  unusedSelectors: string[];
  timestamp: string;
}

function analyzeCSSFile(filePath: string): {
  size: number;
  rules: number;
  selectors: number;
  colors: Set<string>;
} {
  if (!fs.existsSync(filePath)) {
    return { size: 0, rules: 0, selectors: 0, colors: new Set() };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const size = Buffer.byteLength(content, "utf8");

  // Count CSS rules
  const rules = (content.match(/{/g) || []).length;

  // Count selectors
  const selectors = (content.match(/[,\n]\s*[.#\w]/g) || []).length;

  // Extract colors
  const colorRegex = /#[0-9A-Fa-f]{6}|rgba?\([^)]+\)|oklch\([^)]+\)/g;
  const colors = new Set(content.match(colorRegex) || []);

  return { size, rules, selectors, colors };
}

function generatePerformanceReport(): PerformanceMetrics {
  const srcDir = path.join(process.cwd(), "src");
  
  // Analyze CSS files
  const cssDir = path.join(srcDir, "styles");
  let totalCSSSize = 0;
  let totalRules = 0;
  let totalSelectors = 0;
  const allColors = new Set<string>();

  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));

    cssFiles.forEach((file) => {
      const result = analyzeCSSFile(path.join(cssDir, file));
      totalCSSSize += result.size;
      totalRules += result.rules;
      totalSelectors += result.selectors;
      result.colors.forEach((color) => allColors.add(color));
    });
  }

  // Estimate JS size (simplified)
  const jsSize = 0; // Would require bundling

  const metrics: PerformanceMetrics = {
    cssSize: totalCSSSize,
    jsSize,
    totalSize: totalCSSSize + jsSize,
    cssRules: totalRules,
    selectors: totalSelectors,
    colorPalette: allColors,
    unusedSelectors: [],
    timestamp: new Date().toISOString(),
  };

  return metrics;
}

function printReport(metrics: PerformanceMetrics): void {
  console.log("\n" + "=".repeat(60));
  console.log("📊 PERFORMANCE METRICS REPORT");
  console.log("=".repeat(60));

  console.log(`\n📦 File Sizes:`);
  console.log(`  CSS Size: ${(metrics.cssSize / 1024).toFixed(2)} KB`);
  console.log(`  Total Size: ${(metrics.totalSize / 1024).toFixed(2)} KB`);

  console.log(`\n🎨 CSS Metrics:`);
  console.log(`  CSS Rules: ${metrics.cssRules}`);
  console.log(`  Selectors: ${metrics.selectors}`);

  console.log(`\n🌈 Color Palette:`);
  console.log(`  Unique Colors: ${metrics.colorPalette.size}`);
  Array.from(metrics.colorPalette)
    .slice(0, 10)
    .forEach((color) => {
      console.log(`    - ${color}`);
    });

  if (metrics.colorPalette.size > 10) {
    console.log(`    ... and ${metrics.colorPalette.size - 10} more`);
  }

  console.log(`\n✅ Report generated at ${metrics.timestamp}`);
  console.log("=".repeat(60) + "\n");

  // Save report to file
  const reportPath = path.join(process.cwd(), ".performance-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
  console.log(`📁 Full report saved to: ${reportPath}`);
}

const metrics = generatePerformanceReport();
printReport(metrics);
