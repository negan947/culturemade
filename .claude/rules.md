# Claude Code Rules for CultureMade

## Project-Specific Guidelines

### Architecture
- This is a dual-interface e-commerce platform with iPhone 14 Pro simulation
- Always respect the iPhone simulation interface patterns
- Use Redux Toolkit for state management (interface-slice, notification-slice)
- Follow the existing component structure in `components/iphone/`

### Code Quality
- Run `npm run prebuild` before any commits to ensure quality standards
- ESLint with zero warnings policy - all warnings must be fixed
- TypeScript strict mode is enforced
- Use Prettier for consistent formatting

### Database & Backend (SUPABASE ONLY)
- **SUPABASE IS THE ONLY DATABASE** - all data (users, orders, images) lives in Supabase PostgreSQL
- **Claude uses MCP tools for context** - Claude checks database state before making changes (not application code)
- **Application uses Supabase client libraries** - standard @supabase/supabase-js for all app database operations
- **Real data only** - no mock data, no local storage, no external databases
- **SQL files for schema changes** - generate SQL for user to copy/paste into Supabase dashboard
- **Stripe for payments** - real payment processing, no mocks
- **20 tables verified** - all e-commerce tables exist and have RLS policies
- Use proper authentication flow with JWT tokens

### iPhone Interface Development
- All iPhone components use shared wallpaper background
- Redux manages app navigation and lock screen state
- Use Framer Motion for iOS-style animations
- Error boundaries wrap major interface sections
- Follow iOS design patterns and animations

### Environment & Security
- Never commit secrets or environment variables
- Use proper environment validation at build time
- Respect SITE_LOCKED and BYPASS_AUTH development flags
- Follow OWASP security headers configuration

### Testing & Deployment
- Always verify solutions with available tests
- Check for proper lint/typecheck commands before suggesting them
- **Claude uses MCP tools for database context** - Claude checks database state before making changes
- **Application uses standard Supabase clients** - @supabase/supabase-js for all app database operations
- **Generate SQL files for schema changes** - user copies to Supabase dashboard
- Respect the Windows development environment setup

## Forbidden Actions
- Never create documentation files unless explicitly requested
- Don't modify git configuration
- Don't push to remote unless explicitly asked
- Avoid interactive git commands (-i flags)
- Don't assume library availability without checking package.json

## Knowledge Base Maintenance
- **ALWAYS UPDATE** `.claude/knowledge.md` when making important architectural changes:
  - Adding new iPhone apps or major components
  - Modifying database schema or adding tables
  - Changing core dependencies or versions
  - Adding new development commands or workflows
  - Updating authentication or security patterns
- **Update the version number and timestamp** in knowledge.md header
- **Document the changes** in the maintenance log at the bottom

## 🎯 Advanced Problem-Solving Methodology (MANDATORY FOR COMPLEX ISSUES)

### Research-First Approach
- **NEVER attempt fixes without comprehensive investigation**
- **Use multiple tool calls in parallel** for efficient information gathering  
- **Check GitHub issues** for library-specific bugs (especially mobile issues)
- **Research browser limitations** (iOS Safari touch events, CSS property support)
- **Understand architecture** before implementing solutions

### Mobile Development Rules (CRITICAL)
- **Feature-based device detection** - not user-agent sniffing
- **Dual system architecture** - Desktop (Framer Motion) + Mobile (Native Events)
- **iOS Safari compatibility** - Use `{ passive: false }` for preventDefault()
- **Touch target optimization** - Minimum 25px for mobile gesture areas
- **CSS touch properties** - `touch-action: none` for gesture areas

### Implementation Standards
- **Progressive enhancement** - Base functionality + enhanced UX + graceful degradation
- **Fallback systems** - Always provide alternatives for unsupported features
- **Real device testing** - Validate solutions on actual mobile devices when possible
- **Document workarounds** - Comment known issues with links to solutions

## Preferred Tools
- Claude uses MCP Supabase tools for database context checking
- Application code uses @supabase/supabase-js client libraries
- Prefer editing existing files over creating new ones
- Use TodoWrite for complex multi-step tasks
- Use Task tool for open-ended searches
- **WebSearch extensively** - Research before implementation for complex issues

## Task Management Requirements (MANDATORY)
- **ALWAYS include a final todo** to update `.claude/progress.md` when completing any task
- **MARK TASKS COMPLETED** immediately when finished - never batch completions
- **UPDATE CURRENT ACTIVE TASK** section in progress.md after each completion
- **SYNCHRONIZE** CLAUDE.md and .claude/ files after major milestones
- **Example final todo**: "Update .claude/progress.md to mark Task X.X.X as completed (MANDATORY)"