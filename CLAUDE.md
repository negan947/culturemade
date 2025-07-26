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