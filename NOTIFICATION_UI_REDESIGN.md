# Notification UI Redesign Plan

## New Compact Layout

### Row 1: Recipients (Horizontal Tabs)
```
[All Users] [Students ▼] [Courses ▼] [Programs ▼]
```

### Row 2: Content (Compact Grid - 2 columns on desktop)
```
┌─────────────────────┬─────────────────────┐
│ Category [▼]        │ Priority [▼]        │
├─────────────────────┴─────────────────────┤
│ Title [___________________________]       │
├───────────────────────────────────────────┤
│ Message [                                 │
│          Textarea - 3 rows                │
│         ]                                 │
└───────────────────────────────────────────┘
```

### Row 3: Channels (Inline Checkboxes)
```
Channels: [✓] Email (עברית▼)  [ ] SMS  [ ] Push
```

### Row 4: Advanced (Collapsible)
```
[▼ Advanced Options]
  - Action URL
  - Action Label
  - Expires At
```

### Row 5: Action
```
                              [Send to X recipients →]
```

## Multi-Selection Approach

Instead of dropdown multi-select, use **Popover with checkboxes**:

```
Recipients: [3 students selected ▼]
            ┌──────────────────────────┐
            │ □ Select All             │
            │ ─────────────────────    │
            │ ☑ John Doe               │
            │ ☑ Jane Smith             │
            │ ☑ Mike Johnson           │
            │ □ Sarah Williams         │
            └──────────────────────────┘
```

## Benefits
- Compact: Fits in ~400px height instead of 1000px
- Clear: Recipient count shown
- Flexible: Send to multiple users/courses/programs
- Fast: Less scrolling, better UX
