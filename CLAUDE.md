# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 **MANDATORY: BEFORE ANY WORK - READ ALL .claude/ FILES FIRST**

### **⚠️ CRITICAL WORKFLOW - NO EXCEPTIONS**

**STEP 1: ALWAYS READ THESE FILES IN ORDER (BEFORE ANY TASK):**
1. **`.claude/rules.md`** ← Read FIRST - Critical development rules (no mock data, MCP-first, etc.)
2. **`.claude/knowledge.md`** ← Read SECOND - Complete technical architecture (500+ lines)
3. **`.claude/roadmap.md`** ← Read THIRD - Current project status and phase details
4. **`.claude/progress.md`** ← Read FOURTH - Active task breakdown with checkboxes

**STEP 2: UNDERSTAND PROJECT CONTEXT:**
- Check what's already completed vs what needs work
- Understand "SUPABASE ONLY - Real data only - no mock data" rule
- Verify current database state with MCP tools before any changes
- Check current active task and dependencies

**STEP 3: THEN AND ONLY THEN START IMPLEMENTATION**

### **✅ CHECKLIST: Before Starting ANY Task**
- [ ] Have I read `.claude/rules.md` and understand the "no mock data" rule?
- [ ] Have I read `.claude/knowledge.md` and understand the technical architecture?
- [ ] Have I read `.claude/roadmap.md` and know the current project phase?
- [ ] Have I read `.claude/progress.md` and understand the current active task?
- [ ] Have I used MCP tools to check current database state?
- [ ] Do I understand what's already completed vs what needs work?

### **🚫 FORBIDDEN: Starting work without reading all .claude/ files first**
**Violating this workflow wastes time and creates incorrect implementations**

---

[... rest of the existing content remains the same ...]

## Memory Notes

### Development Workflow Memories
- Never run `npm run dev` - only the human should run this command

### 🎯 Advanced Problem-Solving Methodology (PROVEN WORKFLOW)
**For Complex Issues: Research First, Implement Second**

#### PHASE 1: COMPREHENSIVE RESEARCH (MANDATORY)
- **Multi-Tool Investigation**: Read files + WebSearch + parallel tool calls
- **Technology-Specific**: Check GitHub issues for library bugs (e.g., Framer Motion mobile)  
- **Browser Compatibility**: Research iOS Safari limitations and workarounds
- **Architecture Analysis**: Event flow, state management, CSS inheritance

#### PHASE 2: ROOT CAUSE IDENTIFICATION
- **Library Bugs**: Known issues with mobile touch events
- **Browser Limitations**: iOS Safari touch-action support restrictions
- **Integration Conflicts**: Container blocking, CSS specificity, animation conflicts  
- **Device Differences**: Mobile detection, touch targets, gesture interference

#### PHASE 3: STRATEGIC SOLUTION DESIGN
- **Dual-System Architecture**: Desktop (Framer Motion) + Mobile (Native Events)
- **Feature Detection**: Touch capability, pointer precision, viewport size
- **Progressive Enhancement**: Base functionality + enhanced UX + graceful degradation
- **CSS Touch Optimization**: `touch-action: none`, `{ passive: false }` listeners

#### SUCCESS EXAMPLE - Mobile HomeBar Exit Fix:
```typescript
// Feature-based detection (not user-agent)
const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Native touch events for mobile (Framer Motion fallback)  
element.addEventListener('touchstart', handler, { passive: false });

// Conditional Framer Motion (desktop only)
onPanStart={isMobile ? undefined : desktopHandler}
```

**Key Learning**: Context-rich research prevents wasted implementation time and enables senior-level solutions

### BotMaster Persona System ⚡ **MASTER AGENT FRAMEWORK**
- **Activation Command**: When user says "Master coder, today's tasks are X.X.X and X.X.X"
- **Transform into**: Claude Code BotMaster - coordinates 2 specialized agents working in sync
- **Read First**: `.claude/botmaster.md` for complete coordination framework and prompt templates
- **Core Function**: Analyze tasks → Create specialized prompts → Launch parallel agents → Prevent conflicts
- **Agent Types**: Frontend (UI/Components), Backend (API/Database), Mobile (iPhone), Systems (Infrastructure)
- **Coordination**: Design non-interfering workstreams, sequence dependencies, ensure quality standards
- **Success Criteria**: Zero file conflicts, seamless integration, parallel execution, all tasks [✅] in progress.md