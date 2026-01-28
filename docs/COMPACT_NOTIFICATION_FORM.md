# Compact Notification Form Design

## Current Issues:
- Form takes ~800 lines of code
- Too much vertical scrolling
- Delivery channels section is large
- Advanced options (action URL, expiration) add unnecessary height

## Proposed Compact Layout:

```tsx
<CardContent className="space-y-4">
  {/* Row 1: Recipients - Single row with inline selection */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Select scope>...</Select>
    {/* Conditional based on scope */}
    {scope specific selects}
  </div>

  {/* Row 2: Category & Priority - Single row */}
  <div className="grid grid-cols-2 gap-4">
    <Select category>...</Select>
    <Select priority>...</Select>
  </div>

  {/* Row 3: Title */}
  <Input title />

  {/* Row 4: Message */}
  <Textarea message rows={3} />

  {/* Row 5: Channels - Inline checkboxes */}
  <div className="flex flex-wrap items-center gap-4 p-3 border rounded bg-muted/30">
    <span className="text-sm font-medium">Channels:</span>
    <Checkbox + Label (In-App - disabled)>
    <Checkbox + Label (Email)>
    {emailEnabled && <Select language inline>}
    <Checkbox + Label (SMS)>
    <Checkbox + Label (Push)>
  </div>

  {/* Row 6: Advanced (Collapsible) */}
  <Collapsible>
    <CollapsibleTrigger>
      Advanced Options
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Input actionUrl />
        <Input actionLabel />
        <Input expiresAt colspan-2 />
      </div>
    </CollapsibleContent>
  </Collapsible>

  {/* Row 7: Preview (if content exists) */}
  {(title || message) && <Preview compact />}

  {/* Row 8: Send Button */}
  <div className="flex justify-end">
    <Button send />
  </div>
</CardContent>
```

## Height Reduction:
- Current: ~1200px
- Compact: ~500px (without advanced)
- Compact: ~700px (with advanced expanded)

## Key Changes:
1. **Inline channels**: Horizontal layout instead of vertical
2. **Collapsible advanced options**: Hidden by default
3. **Tighter spacing**: space-y-4 instead of space-y-6
4. **Compact selects**: Smaller height
5. **Fewer rows for textarea**: 3 instead of 4
