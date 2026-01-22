# 📱 Mobile Optimization - Quick Reference Card

## Immediate Use - Copy These

### **Responsive Heading**
```tsx
<h1 className="text-fluid-xl font-bold text-wrap">
  Mobile-First Heading
</h1>
```

### **Responsive Paragraph**
```tsx
<p className="text-fluid-base text-wrap">
  This text adapts to all screen sizes
</p>
```

### **Mobile Container**
```tsx
<div className="mobile-container">
  {/* Automatically handles width/padding */}
</div>
```

### **No Horizontal Scroll**
```tsx
<body className="no-scroll-x">
  {/* Page won't scroll horizontally */}
</body>
```

### **Scrollable Section (iOS smooth)**
```tsx
<div className="scroll-smooth-mobile scrollable-y max-h-96">
  {/* Content scrolls smoothly on iOS */}
</div>
```

### **Touch Button**
```tsx
<button className="btn btn-primary touch-target">
  Tap Me (44x44px minimum)
</button>
```

### **Form Input (Won't zoom iOS)**
```tsx
<input 
  className="input input-mobile" 
  type="text"
  placeholder="16px font prevents zoom"
/>
```

### **Fixed Header + Content**
```tsx
<header className="fixed-header">Nav</header>
<main className="with-fixed-header">
  {/* Proper spacing below header */}
</main>
```

### **Full Screen Mobile**
```tsx
<div className="mobile-full-height flex flex-col">
  <header>Top</header>
  <main className="flex-1 scroll-smooth-mobile">
    Content
  </main>
</div>
```

### **Responsive Grid**
```tsx
<div className="grid grid-auto-fit gap-4">
  {/* Auto-responsive grid */}
</div>
```

---

## Text Sizing Reference

| Class | Mobile | Desktop | Use Case |
|-------|--------|---------|----------|
| `.text-fluid-sm` | 0.875rem | 1rem | Small text |
| `.text-fluid-base` | 1rem | 1.125rem | Body text |
| `.text-fluid-lg` | 1.125rem | 1.5rem | Subheading |
| `.text-fluid-xl` | 1.5rem | 2rem | Main heading |

---

## Common Issues & Fixes

| Issue | Fix | Class |
|-------|-----|-------|
| Text squeezed | Use fluid text | `.text-fluid-*` |
| Text overflows | Add wrapping | `.text-wrap` |
| H-scroll | Prevent overflow | `.no-scroll-x` |
| Fixed header hides content | Padding | `.with-fixed-header` |
| Jerky iOS scroll | Momentum | `.scroll-smooth-mobile` |
| Button hard to tap | Min size | `.touch-target` |
| Input zooms iOS | 16px font | `.input-mobile` |
| 100vh broken | Dynamic height | `.mobile-full-height` |

---

## All Mobile Utilities

**Text Wrapping:**
```
.text-wrap          .text-nowrap          .text-break
```

**Responsive Text:**
```
.text-fluid-sm      .text-fluid-base      .text-fluid-lg      .text-fluid-xl
```

**Touch:**
```
.touch-target       .touch-tap
```

**Scrolling:**
```
.scroll-smooth-mobile       .scrollable-y       .hide-scrollbar
```

**Safe Areas:**
```
.safe-area-top      .safe-area-bottom     .safe-area-all
```

**Layout:**
```
.mobile-container   .no-scroll-x          .flex-item-safe
```

**Images:**
```
.img-responsive
```

**Forms:**
```
.input-mobile
```

**Visibility:**
```
.hidden-mobile      .visible-mobile
```

---

## Testing Checklist

- [ ] Text readable without zoom
- [ ] No horizontal scrolling
- [ ] Buttons 44x44px+ tappable
- [ ] Scrolling smooth (especially iOS)
- [ ] Fixed headers don't hide content
- [ ] Images responsive
- [ ] Forms don't zoom on input focus
- [ ] Safe areas (notches) respected

---

## File Locations

```
Mobile CSS:     src/styles/mobile.css
Mobile Utils:   src/styles/utilities.css (updated)
Main CSS:       src/app/globals.css (updated)
Guide:          MOBILE_OPTIMIZATION.md
Quick Ref:      MOBILE_OPTIMIZATION_SUMMARY.md
```

---

## DevTools Testing

1. Press `F12`
2. Press `Ctrl+Shift+M` (Mac: `Cmd+Shift+M`)
3. Select device from dropdown
4. Test in portrait and landscape

---

## Performance

- Mobile CSS: 10 KB
- Mobile Utilities: Added to existing utilities
- Total impact: 28.8 KB total CSS (still excellent)

---

## Documentation

- **Complete Guide:** [MOBILE_OPTIMIZATION.md](MOBILE_OPTIMIZATION.md)
- **Quick Examples:** [QUICK_START.md](QUICK_START.md)
- **System Reference:** [DESIGN_SYSTEM_REFERENCE.md](DESIGN_SYSTEM_REFERENCE.md)

---

**Status: ✅ Ready to Use**

