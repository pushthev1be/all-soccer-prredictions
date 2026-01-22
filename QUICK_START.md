# 🚀 Quick Start - Frontend Optimization Toolkit

## 5-Minute Setup

You're all set! The toolkit is fully integrated into your project.

---

## Start Using Now

### 1. Utility Classes (in any component)

```tsx
// Layout
<div className="flex items-center justify-between gap-4">

// Spacing
<div className="p-6 m-4">

// Text
<h1 className="text-2xl font-bold text-primary">

// Colors
<div className="bg-subtle border border-default rounded-lg">

// Responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

### 2. Component Classes

```tsx
// Button
<button className="btn btn-primary">Click</button>

// Card
<div className="card">
  <div className="card-header">Title</div>
  <div className="card-body">Content</div>
</div>

// Input
<input className="input" type="text" />

// Badge
<span className="badge badge-success">Active</span>

// Alert
<div className="alert alert-info">Message</div>
```

### 3. Design Tokens (in CSS)

```css
color: var(--color-text-primary);
background: var(--color-background-default);
padding: var(--spacing-4);
font-size: var(--text-lg);
border-radius: var(--radius-lg);
```

---

## Check Performance

```bash
# Analyze CSS
npm run perf:analyze

# Get recommendations
npm run perf:optimize

# Run both
npm run perf:check
```

---

## Key Files

| File | Purpose | Read Time |
|------|---------|-----------|
| FRONTEND_OPTIMIZATION_GUIDE.md | Complete guide | 20 min |
| DESIGN_SYSTEM_REFERENCE.md | Visual reference | 10 min |
| OPTIMIZATION_SUMMARY.md | Overview | 5 min |
| IMPLEMENTATION_CHECKLIST.md | Verification | 5 min |

---

## Most Used Utilities

```
Spacing:    p-1 p-2 p-4 p-6  m-2 m-4 gap-4
Text:       text-sm text-lg font-bold text-primary
Layout:     flex flex-col grid grid-cols-2 grid-cols-3
Alignment:  items-center justify-between justify-end
Colors:     bg-default bg-muted border-default
Rounded:    rounded-md rounded-lg rounded-full
Shadow:     shadow-sm shadow-md shadow-lg
```

---

## Copy-Paste Examples

### Header Section
```tsx
<div className="bg-default border-b border-default p-4">
  <div className="container flex items-center justify-between">
    <h1 className="text-2xl font-bold">Title</h1>
    <button className="btn btn-primary">Action</button>
  </div>
</div>
```

### Card Grid
```tsx
<div className="container my-8">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map(item => (
      <div key={item.id} className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-secondary text-sm">{item.description}</p>
        </div>
      </div>
    ))}
  </div>
</div>
```

### Form
```tsx
<div className="card max-w-md mx-auto">
  <div className="card-header">
    <h2>Form</h2>
  </div>
  <div className="card-body space-y-4">
    <div className="form-group">
      <label className="form-label">Email</label>
      <input className="input" type="email" />
    </div>
    <div className="form-group">
      <label className="form-label">Message</label>
      <textarea className="input min-h-32"></textarea>
    </div>
  </div>
  <div className="card-footer flex justify-end gap-2">
    <button className="btn btn-secondary">Cancel</button>
    <button className="btn btn-primary">Submit</button>
  </div>
</div>
```

### Alert with Icon
```tsx
<div className="alert alert-success flex gap-3">
  <span className="text-lg">✓</span>
  <div>
    <strong>Success!</strong>
    <p className="text-sm text-secondary">Your changes have been saved.</p>
  </div>
</div>
```

---

## Common Patterns

### Responsive Grid
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Flexbox Container
```tsx
className="flex items-center justify-between gap-4"
```

### Centered Container
```tsx
className="container mx-auto px-4"
```

### Button Group
```tsx
className="flex gap-2 justify-end"
```

### Badge Cluster
```tsx
className="flex gap-2 flex-wrap"
```

---

## Color Reference

```
Text:        text-primary text-secondary text-muted
Background:  bg-default bg-muted bg-subtle
Border:      border-default
```

---

## Size Reference

```
xs:   0.75rem (12px)
sm:   0.875rem (14px)
base: 1rem (16px)
lg:   1.125rem (18px)
xl:   1.25rem (20px)
2xl:  1.5rem (24px)
3xl:  1.875rem (30px)
```

---

## Spacing Reference

```
p-1: 0.25rem (4px)
p-2: 0.5rem (8px)
p-4: 1rem (16px)      ⭐ Most common
p-6: 1.5rem (24px)    ⭐ Most common
p-8: 2rem (32px)
```

---

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:all          # Dev + worker

# Build
npm run build            # Build with optimization

# Performance
npm run perf:analyze     # View CSS metrics
npm run perf:optimize    # Get recommendations
npm run perf:check       # Run both
```

---

## When Stuck

1. Check: DESIGN_SYSTEM_REFERENCE.md
2. Look for: Class name in that file
3. Or run: `npm run perf:analyze`
4. Review: Component examples in guide

---

## Pro Tips

✅ Use utilities for quick development
✅ Use components for complex UI
✅ Use tokens for all colors
✅ Follow spacing scale
✅ Use responsive utilities
✅ Check performance regularly

❌ Don't inline styles
❌ Don't hardcode colors
❌ Don't break spacing scale
❌ Don't ignore warnings

---

## You're All Set!

The toolkit is:
- ✅ Fully integrated
- ✅ Ready to use
- ✅ Well documented
- ✅ Performance optimized

**Start building!** 🎉

