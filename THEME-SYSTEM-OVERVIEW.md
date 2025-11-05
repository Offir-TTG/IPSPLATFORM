# Theme System Overview

## What Was Done

The platform now has a comprehensive, customizable theme system that provides control over:
- ✅ Colors (backgrounds, text, borders, icons)
- ✅ Brand colors (primary, secondary)
- ✅ Feedback colors (success, error, warning, info)
- ✅ Audit-specific colors (risk levels, status indicators)
- ✅ Component-specific colors (sidebar, tables)
- ✅ Light and dark mode support
- ✅ Semantic naming for easy customization

## Architecture

### 1. CSS Custom Properties ([src/app/globals.css](src/app/globals.css))
Defines all color tokens using HSL format:
```css
:root {
  --primary: 221.2 83.2% 53.3%;      /* Light mode */
}

.dark {
  --primary: 217.2 91.2% 59.8%;      /* Dark mode */
}
```

### 2. Tailwind Configuration ([tailwind.config.ts](tailwind.config.ts))
Maps CSS variables to Tailwind utility classes:
```typescript
colors: {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  risk: {
    critical: "hsl(var(--risk-critical))",
    high: "hsl(var(--risk-high))",
    medium: "hsl(var(--risk-medium))",
    low: "hsl(var(--risk-low))",
  },
}
```

### 3. Component Usage
Components use semantic Tailwind classes:
```tsx
<button className="bg-primary text-primary-foreground">
<span className="text-risk-critical">Critical</span>
<div className="bg-card text-card-foreground">
```

## Color Categories

### 1. Base Colors
- `background` / `foreground` - Main page colors
- `card` / `card-foreground` - Card containers
- `popover` / `popover-foreground` - Popover elements

### 2. Brand Colors
- `primary` / `primary-foreground` - Primary actions, links
- `secondary` / `secondary-foreground` - Secondary actions

### 3. Feedback Colors
- `destructive` / `destructive-foreground` - Errors, dangerous actions
- `success` / `success-foreground` - Success messages
- `warning` / `warning-foreground` - Warnings
- `info` / `info-foreground` - Information messages

### 4. Audit & Security
- `risk-critical`, `risk-high`, `risk-medium`, `risk-low` - Risk indicators
- `status-success`, `status-failure`, `status-partial` - Action status

### 5. Component-Specific
- `sidebar-*` - Sidebar navigation colors
- `table-*` - Table header, rows, borders
- `muted-*` - Muted/subdued elements
- `accent-*` - Accent/highlight elements

### 6. UI Elements
- `border` - Default borders
- `input` - Input field borders
- `ring` - Focus indicators

## How to Customize

### Quick Customization
Edit [src/app/globals.css](src/app/globals.css) and change color values:

```css
:root {
  /* Change primary color to green */
  --primary: 142.1 76.2% 45.3%;

  /* Change risk colors */
  --risk-critical: 0 100% 50%;
  --risk-high: 30 100% 50%;
}
```

### Full Theme Creation
See [THEME-CUSTOMIZATION.md](THEME-CUSTOMIZATION.md) for:
- Complete theme templates
- HSL color guide
- Testing procedures
- Best practices
- Common issues and solutions

## Component Examples

### Using Risk Colors
```tsx
// Old way (hardcoded)
<span className="text-red-600">Critical</span>
<span className="text-orange-500">High</span>

// New way (themeable)
<span className="text-risk-critical">Critical</span>
<span className="text-risk-high">High</span>
```

### Using Status Colors
```tsx
// Old way
<div className="bg-green-600 text-white">Success</div>

// New way
<div className="bg-status-success text-white">Success</div>
```

### Using Sidebar Colors
```tsx
// Navigation
<nav className="bg-sidebar text-sidebar-foreground border-sidebar-border">
  <a className="hover:bg-accent">Item</a>
  <a className="bg-sidebar-active text-sidebar-active-foreground">Active</a>
</nav>
```

### Using Table Colors
```tsx
<table>
  <thead className="bg-table-header-bg text-table-header-fg">
    <tr><th>Header</th></tr>
  </thead>
  <tbody>
    <tr className="hover:bg-table-row-hover border-table-border">
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

## Benefits

### 1. Centralized Control
- Change colors in ONE place (globals.css)
- Affects ALL components automatically
- No need to search/replace hardcoded values

### 2. Dark Mode Support
- Each color has light and dark variants
- Automatic switching when theme changes
- Consistent dark mode experience

### 3. Semantic Naming
- Colors match their purpose
- Easy to understand intent
- Self-documenting code

### 4. Maintainability
- Easy to rebrand
- Simple to create themes
- Scalable as project grows

### 5. Accessibility
- Consistent contrast ratios
- Proper color relationships
- WCAG compliance support

## Migration Guide

### For Existing Components

**Before:**
```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
```

**After:**
```tsx
<div className="bg-card text-card-foreground border-border">
```

**Before:**
```tsx
<span className="text-red-600 dark:text-red-400">Error</span>
```

**After:**
```tsx
<span className="text-destructive">Error</span>
```

### Migration Benefits
- Fewer classes per element
- Automatic dark mode
- Easier to read
- Themeable without code changes

## Current Implementation Status

### ✅ Implemented
- CSS custom properties with comprehensive tokens
- Tailwind configuration with all color categories
- Light and dark mode support
- Documentation (this file + THEME-CUSTOMIZATION.md)

### 🔄 In Progress
Components still using hardcoded colors should be migrated to use theme tokens. Examples:
- Audit components (filters, tables)
- Admin layout
- Dashboard components

### 📋 Migration Checklist
When updating components, replace:
- [ ] `bg-white dark:bg-gray-800` → `bg-card`
- [ ] `text-gray-900 dark:text-white` → `text-card-foreground`
- [ ] `border-gray-200 dark:border-gray-700` → `border-border`
- [ ] `bg-blue-600` → `bg-primary`
- [ ] `text-red-600` → `text-destructive`
- [ ] `text-green-600` → `text-success`
- [ ] `text-yellow-600` → `text-warning`

## Testing

### Test Light Mode
1. Set theme to "light"
2. Check all pages render correctly
3. Verify colors match design
4. Test contrast and readability

### Test Dark Mode
1. Set theme to "dark"
2. Check all pages render correctly
3. Verify colors are properly inverted
4. Test contrast and readability

### Test System Mode
1. Set theme to "system"
2. Change OS theme preference
3. Verify app follows OS setting
4. Check smooth transitions

### Test Custom Theme
1. Edit globals.css
2. Change color values
3. Verify changes appear
4. Test in both modes

## Performance

### Advantages
- ✅ No runtime JavaScript for colors
- ✅ CSS variables are hardware-accelerated
- ✅ Minimal CSS overhead
- ✅ Efficient theme switching

### Best Practices
- Use semantic tokens, not direct colors
- Avoid inline styles with theme colors
- Let Tailwind handle the compilation
- Test with different themes

## Future Enhancements

### Potential Additions
- [ ] Multiple theme presets (blue, green, purple)
- [ ] User-selectable accent colors
- [ ] High contrast mode
- [ ] Reduced motion mode
- [ ] Color blind friendly palettes
- [ ] Admin UI for theme customization
- [ ] Theme export/import
- [ ] Per-component theme overrides

### Advanced Features
- [ ] Theme builder interface
- [ ] Real-time preview
- [ ] Theme marketplace
- [ ] A/B testing different themes
- [ ] Analytics on theme preferences

## Related Files

- [src/app/globals.css](src/app/globals.css) - Color definitions
- [tailwind.config.ts](tailwind.config.ts) - Tailwind integration
- [src/context/AppContext.tsx](src/context/AppContext.tsx) - Theme state management
- [src/components/ThemeToggle.tsx](src/components/ThemeToggle.tsx) - Theme switcher UI
- [THEME-CUSTOMIZATION.md](THEME-CUSTOMIZATION.md) - Customization guide

## Support

For questions or issues:
1. Check THEME-CUSTOMIZATION.md for common issues
2. Review this document for architecture details
3. Inspect elements in browser DevTools to see applied variables
4. Test changes in both light and dark mode

---

**Version**: 2.0
**Last Updated**: 2025-01-04
**Status**: Production Ready
