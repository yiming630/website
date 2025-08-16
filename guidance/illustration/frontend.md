# Frontend Folders Documentation

## `/frontend/web-app` & `/nextjs-app`
**Purpose**: Main user interface application built with Next.js 14+

**Why it exists here**: 
- Centralized frontend codebase following Next.js App Router conventions
- Separated from backend services for independent scaling and deployment
- Two similar folders exist (appears to be a migration or duplication scenario)

### Key Components:

#### `/app` - Next.js App Router Pages
- **dashboard/**: User dashboard interface for project management
- **translate-editor/**: Core translation editor with rich text editing capabilities
- **workspace/**: Project and document organization interface
- **reader-*/**: Different reader modes for document viewing and translation
- **login/**, **user-type/**: Authentication and user onboarding flows

#### `/components` - Reusable UI Components
- **ui/**: Shadcn/ui component library (buttons, dialogs, forms, etc.)
- **translate-editor/**: Editor-specific components (toolbars, panels, dialogs)
- **theme-provider.tsx**: Dark/light theme management

#### `/context` - React Context Providers
- **file-context.tsx**: Global file state management

#### `/hooks` - Custom React Hooks
- **useAIChat.ts**: AI translation assistant integration
- **useTextSelection.ts**: Text selection handling for editor
- **use-toast.ts**: Toast notification system

#### `/lib` - Utility Functions
- **utils.ts**: Common utility functions
- **tiptap-extensions.ts**: Rich text editor extensions

#### `/services` - Frontend Service Layer
- **documentService.ts**: Document API interactions

#### `/styles` - CSS Stylesheets
- **globals.css**: Global styles and Tailwind directives
- **editor.css**: Editor-specific styling

### Configuration Files:
- **next.config.mjs**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS configuration
- **tsconfig.json**: TypeScript configuration
- **components.json**: Shadcn/ui components configuration

### Cross-References:
- Connects to **→ `/services/api-gateway`** via GraphQL
- Uses types from **→ `/app/translate-editor/types.ts`**
- Implements designs specified in **→ `/docs/frontend.md`**

---

## Technology Choices Rationale:
1. **Next.js 14+**: Server-side rendering, optimal performance, built-in routing
2. **TypeScript**: Type safety and better developer experience
3. **Tailwind CSS**: Rapid UI development with utility classes
4. **Shadcn/ui**: High-quality, customizable component library
5. **TipTap**: Powerful rich text editor framework