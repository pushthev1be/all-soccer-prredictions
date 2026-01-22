/**
 * Performance Budget Configuration
 * Defines acceptable limits for bundle sizes and performance metrics
 */

export const performanceBudget = {
  // Bundle Size Limits (in KB)
  bundles: {
    css: {
      max: 50,
      warn: 35,
      description: "Total CSS size across all files",
    },
    javascript: {
      max: 250,
      warn: 200,
      description: "Total JavaScript bundle size",
    },
    html: {
      max: 100,
      warn: 75,
      description: "HTML page size",
    },
  },

  // Performance Metrics
  metrics: {
    firstContentfulPaint: {
      max: 1500, // milliseconds
      warn: 1000,
      description: "Time to first contentful paint",
    },
    largestContentfulPaint: {
      max: 2500,
      warn: 2000,
      description: "Time to largest contentful paint",
    },
    cumulativeLayoutShift: {
      max: 0.1,
      warn: 0.05,
      description: "Cumulative layout shift score",
    },
    totalBlockingTime: {
      max: 300, // milliseconds
      warn: 200,
      description: "Total blocking time",
    },
  },

  // CSS Metrics
  css: {
    maxRules: {
      max: 5000,
      warn: 4000,
      description: "Maximum CSS rules allowed",
    },
    maxSelectors: {
      max: 10000,
      warn: 8000,
      description: "Maximum CSS selectors allowed",
    },
    maxColors: {
      max: 50,
      warn: 30,
      description: "Maximum unique colors in design system",
    },
  },

  // Resource Counts
  resources: {
    stylesheets: {
      max: 5,
      warn: 3,
      description: "Number of external stylesheets",
    },
    scripts: {
      max: 10,
      warn: 5,
      description: "Number of external scripts",
    },
    images: {
      max: 50,
      warn: 30,
      description: "Number of images on page",
    },
  },
};

// Helper function to check if metric is within budget
export function checkBudget(
  category: string,
  metric: string,
  value: number
): { status: "pass" | "warn" | "fail"; message: string } {
  const budgetItem = (performanceBudget as any)[category]?.[metric];

  if (!budgetItem) {
    return { status: "pass", message: "No budget configured" };
  }

  if (value > budgetItem.max) {
    return {
      status: "fail",
      message: `❌ FAILED: ${metric} is ${value} (max: ${budgetItem.max}) - ${budgetItem.description}`,
    };
  }

  if (value > budgetItem.warn) {
    return {
      status: "warn",
      message: `⚠️  WARNING: ${metric} is ${value} (warn: ${budgetItem.warn}) - ${budgetItem.description}`,
    };
  }

  return {
    status: "pass",
    message: `✅ PASS: ${metric} is ${value} (max: ${budgetItem.max})`,
  };
}
