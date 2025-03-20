# Code Standards & Best Practices

## General Guidelines
- Keep components small and focused
- Use custom hooks for shared logic
- Separate data fetching from presentation
- Use TypeScript for type safety
- Follow consistent naming conventions

## Backend Standards

### Controller Design
1. Keep controllers minimal - they should only:
   - Parse request parameters
   - Call services
   - Return responses
   - Handle errors

2. Business logic should be in services:
   - API calls to Klaviyo
   - Data transformation
   - Aggregation and calculations

3. Each endpoint should have corresponding tests:
   - Unit tests for services
   - Integration tests for controllers/routes

4. Error handling:
   - Gracefully handle API failures
   - Return appropriate HTTP status codes
   - Provide meaningful error messages

## Frontend Standards

### Component Organization
- Create reusable components
- Maintain clear component hierarchy
- Use consistent prop interfaces

### Performance Optimization
- Use memoization for expensive calculations
- Implement virtualization for long lists
- Lazy load components when appropriate

### Responsive Design
- Design for mobile-first
- Use Tailwind responsive classes
- Ensure UI is usable on all device sizes

### Accessibility
- Maintain proper contrast ratios
- Use semantic HTML elements
- Include ARIA attributes where needed
- Support keyboard navigation
