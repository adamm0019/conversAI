# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build TypeScript and create production bundle
- `npm run start` - Start static server for production
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build

## Code Style Guidelines
- Use TypeScript with strict type checking
- Import order: React, external libs, internal components, styles
- Component pattern: React.FC<Props> with explicit interfaces
- State management: React hooks (useState, useRef, useCallback, useEffect)
- Error handling: Try/catch with console.error and notifications
- File organization: Features in separate directories with index exports
- Styling: Mantine UI with CSS-in-JS and SCSS modules
- Naming: PascalCase for components, camelCase for functions/variables
- Use TypeScript interfaces for prop types and data models
- Prefer functional components with hooks over class components
- Handle side effects in useEffect with proper cleanup functions
- Use Firebase for auth/data and WebSockets for real-time communication