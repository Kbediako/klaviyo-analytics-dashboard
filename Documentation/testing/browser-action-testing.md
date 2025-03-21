# Browser Action Testing Best Practices

This document outlines best practices for testing the Klaviyo Analytics Dashboard using browser actions, particularly focusing on ensuring proper visibility of all UI elements.

## Key Considerations

### 1. Viewport Limitations

When testing with browser actions, remember that the browser window has a fixed viewport size (typically 900x600 pixels). This means that not all content may be visible at once, especially:

- Content below the fold
- Tab content that appears below the navigation
- Lengthy tables or charts
- Modal dialogs that extend beyond the viewport

### 2. Scrolling Requirements

**Always scroll down after clicking on tabs** to ensure you can see and interact with the tab content. This is particularly important for:

- Campaign tables
- Flow visualizations
- Form analytics
- Segment data
- Any data tables that might extend beyond the initial viewport

## Recommended Testing Sequence

1. Launch the browser at the application URL
2. Verify the initial page load and header elements
3. **Scroll down** to view any content below the fold
4. When clicking on a tab:
   - Click the tab
   - **Immediately scroll down** to ensure the tab content is visible
   - Verify the tab content has loaded correctly
5. For interactive elements within tab content:
   - Ensure you've scrolled to make the element visible
   - Click or interact with the element
   - Verify the expected behavior

## Example Test Flow

```
1. Launch browser at http://localhost:3000
2. Verify dashboard header and metrics cards are visible
3. Scroll down to see any charts or visualizations
4. Click on "Campaigns" tab
5. Scroll down to see the campaigns table
6. Verify campaign data is loading/loaded
7. Click on "Flows" tab
8. Scroll down to see the flows visualization
9. Verify flow data is loading/loaded
10. Close browser
```

## Common Issues

- **Element not visible**: If clicks or interactions fail, the most common cause is that the element is not in the visible viewport. Always scroll to ensure the element is visible before attempting to interact with it.

- **Incomplete data verification**: Without scrolling, you might only verify the top portion of data tables or visualizations, missing potential issues further down.

- **Missed interactive elements**: Some interactive elements like pagination controls or action buttons might be positioned at the bottom of tables or content areas, requiring scrolling to access.

## Implementation Notes

When implementing browser action tests, use the `scroll_down` action after tab navigation:

```
<browser_action>
<action>click</action>
<coordinate>165,555</coordinate>
</browser_action>

// After clicking a tab, always scroll down to see the content
<browser_action>
<action>scroll_down</action>
</browser_action>
```

This ensures that the tab content is visible and can be properly verified or interacted with.
