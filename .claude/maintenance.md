# Knowledge Base Maintenance Guide

## **CRITICAL**: Always Update Knowledge Base

### **Claude Code Instructions**
⚠️ **MANDATORY**: When making ANY of these changes to the CultureMade project, you MUST update `.claude/knowledge.md`:

1. **iPhone App Changes**
   - Adding new apps to `components/iphone/apps/`
   - Modifying app structure or major functionality
   - Changing app registry in `getApp.ts`

2. **Database Schema Changes**
   - Adding/removing tables via migrations
   - Modifying database types in `types/database.ts`
   - Changing authentication or user roles

3. **Architecture Updates**
   - Redux store modifications
   - New major components or patterns
   - Routing changes in `app/` folder

4. **Development Workflow Changes**
   - New npm scripts in `package.json`
   - Environment variable updates
   - Build or deployment process changes

5. **Dependency Changes**
   - Major version updates (Next.js, React, Supabase)
   - New library additions
   - Removing dependencies

### **Update Process**
1. Make your code changes
2. Update `.claude/knowledge.md` with the new information
3. Increment version number (1.0.0 → 1.0.1 for minor, 1.1.0 for major)
4. Update timestamp in header
5. Add entry to maintenance log at bottom

## Auto-Update System

### **Version Control**
- **Current Version**: 1.0.0  
- **Last Update**: 2025-07-24
- **Update Trigger**: Significant architectural changes
- **Maintainer**: Claude Code AI Assistant

### **Change Detection Triggers**
The knowledge base should be updated when:

1. **Package Dependencies Change**
   - Major version updates to Next.js, React, Supabase
   - New library additions or removals
   - Framework migrations

2. **Architecture Modifications**
   - New iPhone apps added to `components/iphone/apps/`
   - Redux store structure changes
   - Database schema modifications (table additions/changes)
   - Authentication flow updates

3. **Configuration Changes**
   - Environment variable additions/modifications
   - Build script changes in `package.json`
   - ESLint/Prettier rule updates
   - TypeScript configuration changes

4. **Component Structure Changes**
   - iPhone interface hierarchy modifications
   - New system layout components
   - App routing changes in `app/` folder

### **Update Process**

#### **1. Automated Checks**
Before updating, verify:
- [ ] Latest `package.json` dependencies
- [ ] Current file structure in key directories
- [ ] Active database tables via MCP
- [ ] Environment variable requirements

#### **2. Content Updates**
Update sections based on changes:
- **Technical Stack**: Version numbers, new dependencies
- **iPhone Architecture**: Component hierarchy, new apps
- **Database Schema**: Table counts, new relationships
- **Development Commands**: New scripts, updated workflows

#### **3. Version Management**
```markdown
> **Version**: X.Y.Z | **Last Updated**: YYYY-MM-DD | **Auto-Generated**: ✅  
> **⚠️ IMPORTANT: This file is auto-maintained. Manual changes may be overwritten.**  
```

### **Persistence Strategy**

#### **Change-Resistant Sections**
These sections should remain stable:
- Project overview and dual-interface concept
- Core architectural decisions and patterns
- Security principles and guidelines
- Development workflow fundamentals

#### **Dynamic Sections** 
These sections update with project changes:
- Technical stack versions
- File structure trees
- Database table counts
- Environment variables
- Development commands

### **Manual Override Process**

#### **When Manual Updates Needed**
- Business logic changes
- New architectural patterns
- Strategy or approach modifications
- Documentation corrections

#### **Manual Update Protocol**
1. Create backup of current knowledge.md
2. Make targeted changes with clear comments
3. Update version number and timestamp
4. Document changes in git commit message
5. Update this maintenance.md file

### **Quality Assurance**

#### **Pre-Update Validation**
- [ ] All file paths exist and are accessible
- [ ] Component imports resolve correctly
- [ ] Database connections work via MCP
- [ ] Development commands execute successfully

#### **Post-Update Verification**
- [ ] Knowledge base loads without errors
- [ ] All referenced files are current
- [ ] Technical details match actual implementation
- [ ] No broken internal references

### **Emergency Recovery**

#### **If Knowledge Base Corrupted**
1. Restore from git history: `git checkout HEAD~1 .claude/knowledge.md`
2. Re-run comprehensive project analysis
3. Rebuild knowledge base from scratch
4. Compare with previous version for missing content

#### **Rollback Procedure**
```bash
# Restore previous version
git log --oneline .claude/knowledge.md
git checkout <commit-hash> .claude/knowledge.md

# Or restore from backup
cp .claude/knowledge.md.backup .claude/knowledge.md
```

---

## 🔄 **MANDATORY FILE SYNCHRONIZATION STRATEGY**

### **ALL 8 FILES IN .CLAUDE FOLDER (ALWAYS MAINTAIN)**
1. **knowledge.md** - Main technical documentation (434 lines)
2. **rules.md** - Development guidelines (68 lines) 
3. **roadmap.md** - 6-phase implementation plan (480 lines)
4. **progress.md** - Detailed task tracking (1,261 lines)
5. **database-workflow.md** - MCP integration guide (150 lines)
6. **maintenance.md** - This file (164+ lines)
7. **README.md** - Configuration overview (51 lines)
8. **settings.local.json** - Local permissions (17 lines)

### **CRITICAL SYNCHRONIZATION RULES**

#### **When ANY Task is Completed:**
1. **ALWAYS Update progress.md**:
   - Mark task as [✅] Completed
   - Update "Current Active Task" section
   - Move to next task in sequence
   - Update completion percentages

2. **Update Related Files Simultaneously**:
   - If architectural change → Update knowledge.md version + timestamp
   - If new development command → Update both knowledge.md and rules.md
   - If database change → Update database-workflow.md examples
   - If new file created → Update README.md overview

#### **File Interdependencies (Update Together):**

**knowledge.md ↔ rules.md**:
- New dependencies → Update both technical stack and forbidden actions
- New development commands → Update both command lists and quality rules
- Architecture changes → Update both technical details and development patterns

**progress.md ↔ roadmap.md**:
- Task completion → Update both detailed progress and high-level roadmap status
- Phase transitions → Update both current phase and roadmap percentages
- Priority changes → Update both current active task and roadmap focus

**database-workflow.md ↔ knowledge.md**:
- New tables → Update both MCP examples and database schema count
- Schema changes → Update both workflow examples and technical architecture
- MCP procedures → Update both workflow steps and integration details

**README.md → ALL FILES**:
- New files added → Update README overview and file descriptions
- File purposes change → Update README explanations
- File line counts change → Update README file descriptions

### **AUTOMATIC UPDATE TRIGGERS**

#### **MUST Update knowledge.md When:**
- New iPhone apps added (update app registry section)
- Database tables added/modified (update schema count and examples)
- New npm scripts added (update development commands)
- Major dependencies updated (update technical stack versions)
- Architecture patterns changed (update development guidelines)

#### **MUST Update progress.md When:**
- ANY task completed (mark as [✅], update current task)
- New tasks discovered during work (add to appropriate phase)
- Blockers encountered (mark as [❌], document issues)
- Time estimates change (update estimated completion times)

#### **MUST Update rules.md When:**
- New coding standards adopted (update code quality section)
- New forbidden actions identified (update forbidden actions list)
- New tools or workflows added (update preferred tools section)
- Security guidelines changed (update security requirements)

### **VERSION SYNCHRONIZATION**

#### **knowledge.md Version Updates:**
- **Minor Version (X.Y.1)**: Task completions, small updates
- **Major Version (X.2.0)**: New phases, architectural changes
- **Always update timestamp** when any change made
- **Document changes** in maintenance log

#### **Cascading Version Updates:**
- knowledge.md version change → Update maintenance.md log
- Major architectural change → Update README.md descriptions
- New phase started → Update roadmap.md status percentages

### **COMPLETION WORKFLOW (MANDATORY)**

#### **After EVERY Task Completion:**
```markdown
1. Mark task [✅] in progress.md
2. Update "Current Active Task" section
3. Check if knowledge.md needs updating
4. Update related files if triggered
5. Increment version numbers if needed
6. Add maintenance log entry
7. Verify all files are consistent
```

#### **End of Session Checklist:**
- [ ] All completed tasks marked [✅] in progress.md
- [ ] Current active task updated for next session
- [ ] knowledge.md version current if changes made
- [ ] Related files updated if triggered
- [ ] Maintenance log updated with session changes
- [ ] All files saved and consistent

### **NEW FILE PROTOCOL**

#### **When New Files Added to .claude Folder:**
1. **Immediately update README.md** with file description
2. **Add to maintenance.md** ALL FILES list (update count)
3. **Update knowledge.md** reference if relevant to architecture
4. **Add to synchronization rules** if file has dependencies
5. **Update settings.local.json** if permissions needed

#### **File Naming Convention:**
- Use descriptive names (database-workflow.md, not db.md)
- Include purpose in README.md description
- Add line count estimates in maintenance documentation
- Document update triggers and dependencies

---

**📋 Maintenance Log**
- **2025-07-24**: Initial knowledge base created with comprehensive project analysis
- **2025-07-25**: Added comprehensive file synchronization strategy and mandatory update workflows
- **2025-07-25**: Updated knowledge.md v1.1.0 → v1.2.0 with complete 8-file documentation system workflow
- **2025-07-25**: Updated root CLAUDE.md to reference complete 8-file synchronized knowledge base with mandatory workflow
- **2025-07-25**: **MAJOR UPDATE**: Established complete bidirectional synchronization between CLAUDE.md and entire .claude folder
  - Added current project status, active tasks, and critical rules directly to CLAUDE.md
  - Created mandatory update protocol with specific line references
  - Established bidirectional sync rules for all file changes
  - Added verification checklist for end-of-session consistency
- **2025-07-26**: **CRITICAL ARCHITECTURAL REORGANIZATION & COMPLETION UPDATE**
  - ✅ **Task 1.1.1 COMPLETED**: Product database seeding with 20 products and 115 variants
  - 🏗️ **ARCHITECTURAL FIX**: Identified and corrected CultureMade iPhone app dependency issue
  - 📋 **ROADMAP REORGANIZATION**: Moved admin management to Phase 1 for development efficiency
  - 🔄 **PHASE RESTRUCTURING**: 1.2 iPhone App → 1.3 Cart → 1.4 Admin (correct dependency order)
  - 📝 **DOCUMENTATION SYNC**: Updated knowledge.md v1.2.1 → v1.2.2, progress.md, roadmap.md
  - 🔍 **COMPREHENSIVE AUDIT**: Fixed all inconsistencies between CLAUDE.md and .claude folder
- **Next Review**: When significant architectural changes occur
- **Update Policy**: **COMPLETE BIDIRECTIONAL SYNCHRONIZATION** - CLAUDE.md and .claude folder must always mirror each other