# Theme Customization Guide

This guide explains how to customize the visual appearance of the platform using CSS custom properties (variables).

## Overview

The platform uses a comprehensive theme system built on CSS custom properties. All colors, spacing, and visual elements can be customized by editing the `src/app/globals.css` file.

## Color System

### How Colors Work

Colors are defined using HSL (Hue, Saturation, Lightness) format:
```css
--primary: 221.2 83.2% 53.3%;
```

This translates to:
- **Hue**: 221.2 (blue)
- **Saturation**: 83.2%
- **Lightness**: 53.3%

### Available Color Tokens

#### Base Colors
```css
--background       /* Main background color */
--foreground       /* Main text color */
--card             /* Card background */
--card-foreground  /* Card text color */
```

**Usage in components:**
```tsx
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
```

#### Brand Colors
```css
--primary                 /* Primary brand color (buttons, links) */
--primary-foreground      /* Text on primary color */
--secondary               /* Secondary brand color */
--secondary-foreground    /* Text on secondary color */
```

**Usage in components:**
```tsx
<button className="bg-primary text-primary-foreground">
<div className="bg-secondary text-secondary-foreground">
```

#### Feedback Colors
```css
--destructive             /* Danger/error color */
--destructive-foreground  /* Text on destructive */
--success                 /* Success color */
--success-foreground      /* Text on success */
--warning                 /* Warning color */
--warning-foreground      /* Text on warning */
--info                    /* Info color */
--info-foreground         /* Text on info */
```

**Usage in components:**
```tsx
<div className="bg-destructive text-destructive-foreground">Error!</div>
<div className="bg-success text-success-foreground">Success!</div>
<div className="bg-warning text-warning-foreground">Warning!</div>
<div className="bg-info text-info-foreground">Info</div>
```

#### Audit & Security Colors
```css
--risk-critical    /* Critical risk level */
--risk-high        /* High risk level */
--risk-medium      /* Medium risk level */
--risk-low         /* Low risk level */

--status-success   /* Successful action */
--status-failure   /* Failed action */
--status-partial   /* Partially successful */
```

**Usage in components:**
```tsx
<span className="text-risk-critical">Critical Risk</span>
<span className="text-risk-high">High Risk</span>
<span className="text-risk-medium">Medium Risk</span>
<span className="text-risk-low">Low Risk</span>

<div className="bg-status-success">Success</div>
<div className="bg-status-failure">Failed</div>
<div className="bg-status-partial">Partial</div>
```

#### Sidebar Colors
```css
--sidebar-background         /* Sidebar background */
--sidebar-foreground         /* Sidebar text */
--sidebar-border            /* Sidebar borders */
--sidebar-active            /* Active menu item */
--sidebar-active-foreground /* Active menu text */
```

**Usage in components:**
```tsx
<nav className="bg-sidebar text-sidebar-foreground border-sidebar-border">
  <a className="bg-sidebar-active text-sidebar-active-foreground">Active</a>
</nav>
```

#### Table Colors
```css
--table-header-bg     /* Table header background */
--table-header-fg     /* Table header text */
--table-row-hover     /* Hover state for rows */
--table-border        /* Table borders */
```

**Usage in components:**
```tsx
<thead className="bg-table-header-bg text-table-header-fg">
<tr className="hover:bg-table-row-hover border-table-border">
```

#### Neutral Colors
```css
--muted                /* Muted backgrounds */
--muted-foreground     /* Muted text */
--accent               /* Accent backgrounds */
--accent-foreground    /* Accent text */
```

**Usage in components:**
```tsx
<div className="bg-muted text-muted-foreground">
<div className="bg-accent text-accent-foreground">
```

#### UI Element Colors
```css
--border    /* Default border color */
--input     /* Input field borders */
--ring      /* Focus ring color */
```

**Usage in components:**
```tsx
<input className="border-border focus:ring-ring">
<div className="border border-border">
```

## Customization Examples

### Example 1: Change Primary Brand Color

To change the primary brand color to green:

```css
/* In src/app/globals.css */
:root {
  --primary: 142.1 76.2% 45.3%; /* Green */
}

.dark {
  --primary: 142.1 70.6% 50.3%; /* Lighter green for dark mode */
}
```

### Example 2: Customize Risk Level Colors

To use different colors for risk levels:

```css
:root {
  --risk-critical: 0 100% 50%;      /* Bright red */
  --risk-high: 30 100% 50%;         /* Orange-red */
  --risk-medium: 60 100% 50%;       /* Yellow-orange */
  --risk-low: 120 100% 40%;         /* Green */
}
```

### Example 3: Create a Custom Color Scheme

To create a purple-themed admin panel:

```css
:root {
  --primary: 270 70% 50%;                /* Purple */
  --primary-foreground: 0 0% 100%;       /* White */
  --sidebar-background: 270 30% 15%;     /* Dark purple */
  --sidebar-active: 270 70% 50%;         /* Bright purple */
}
```

### Example 4: Adjust Dark Mode Colors

To make dark mode less intense:

```css
.dark {
  --background: 220 15% 12%;      /* Softer dark background */
  --card: 220 15% 15%;            /* Slightly lighter cards */
  --border: 220 15% 25%;          /* Lighter borders */
}
```

## Complete Theme Template

Here's a complete theme you can copy and customize:

```css
:root {
  /* Base - Light Mode */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  /* Brand */
  --primary: 221.2 83.2% 53.3%;        /* Blue */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  /* Feedback */
  --destructive: 0 84.2% 60.2%;        /* Red */
  --success: 142.1 76.2% 36.3%;        /* Green */
  --warning: 38 92% 50%;               /* Orange */
  --info: 199 89% 48%;                 /* Blue */

  /* Audit */
  --risk-critical: 0 84.2% 60.2%;
  --risk-high: 25 95% 53%;
  --risk-medium: 48 96% 53%;
  --risk-low: 142.1 76.2% 36.3%;

  /* Sidebar */
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 222.2 84% 4.9%;
  --sidebar-active: 221.2 83.2% 53.3%;

  /* Table */
  --table-header-bg: 210 40% 98%;
  --table-row-hover: 210 40% 98%;
}

.dark {
  /* Base - Dark Mode */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  /* Brand */
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;

  /* Feedback */
  --destructive: 0 62.8% 30.6%;
  --success: 142.1 70.6% 45.3%;
  --warning: 48 96% 53%;
  --info: 199 89% 48%;

  /* Sidebar */
  --sidebar-background: 217.2 32.6% 12%;
  --sidebar-active: 217.2 91.2% 59.8%;

  /* Table */
  --table-header-bg: 217.2 32.6% 12%;
  --table-row-hover: 217.2 32.6% 15%;
}
```

## Testing Your Changes

1. **Edit** `src/app/globals.css`
2. **Save** the file
3. **Refresh** your browser (the dev server will hot-reload)
4. **Toggle** between light and dark mode to test both themes
5. **Check** different pages: dashboard, audit trail, settings

## Tips for Creating Custom Themes

### 1. Maintain Contrast Ratios
Ensure text is readable by maintaining good contrast:
- Light mode: Dark text on light backgrounds
- Dark mode: Light text on dark backgrounds

### 2. Use HSL for Easy Adjustments
- **Hue**: Change the color (0-360)
- **Saturation**: Make it more/less vibrant (0-100%)
- **Lightness**: Make it darker/lighter (0-100%)

### 3. Test Both Modes
Always test your changes in both light and dark mode.

### 4. Use Semantic Colors
Match colors to their meaning:
- Red for errors/critical
- Green for success/low risk
- Yellow/Orange for warnings
- Blue for information

### 5. Keep Consistency
Use the same color family across related elements.

## Color Picker Tool

Use this HSL format in your browser console to test colors:
```javascript
// Convert RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [
    Math.round(h * 360),
    Math.round(s * 100),
    Math.round(l * 100)
  ];
}

// Example: Convert RGB(59, 130, 246) to HSL
console.log(rgbToHsl(59, 130, 246)); // [217, 91, 60]
// Use as: --primary: 217 91% 60%;
```

## Common Issues

### Colors Not Updating
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check for typos in CSS syntax

### Dark Mode Not Working
- Verify `.dark` class is being applied to `<html>` element
- Check that both `:root` and `.dark` have the same variable names

### Colors Look Wrong
- Verify HSL values are in correct format (no `%` or `deg` units)
- Check that all three values are present (hue saturation lightness)
- Ensure values are space-separated, not comma-separated

## Support

For more help with theming:
1. Check the [Tailwind CSS documentation](https://tailwindcss.com/docs/customizing-colors)
2. Use browser DevTools to inspect elements and see which CSS variables they use
3. Review `tailwind.config.ts` to see all available color classes

---

**Last Updated**: 2025-01-04
