# Claude Code Configuration

This directory contains Claude Code configuration files for the CultureMade project.

## Files Overview

### **`knowledge.md`** - Comprehensive Project Knowledge Base
- **Purpose**: Complete architectural documentation and development guide
- **Maintenance**: Auto-updated when significant changes occur
- **Version**: 1.2.2 (Last updated: 2025-07-26)
- **Content**: Technical stack, iPhone simulation architecture, database schema (20 tables), development patterns, strategic roadmap reorganization

### **`rules.md`** - Project-Specific Development Rules  
- **Purpose**: Coding standards, conventions, and forbidden actions
- **Focus**: iPhone interface patterns, code quality, security guidelines
- **Usage**: Guides Claude Code's behavior when working on this project

### **`maintenance.md`** - Knowledge Base Maintenance Guide
- **Purpose**: Instructions for keeping knowledge base current and accurate
- **Contains**: Update triggers, version control, recovery procedures
- **For**: Future maintenance and troubleshooting

## How Claude Code Uses These Files

1. **`knowledge.md`** provides deep understanding of project architecture
2. **`rules.md`** enforces project-specific coding standards and patterns  
3. **`maintenance.md`** ensures long-term accuracy and persistence

## Best Practices

- **Don't manually edit** `knowledge.md` unless documenting new architectural decisions
- **Do update** `rules.md` when project conventions change
- **Review maintenance logs** before making changes to understand update history
- **Commit changes** to `.claude/` files to maintain version control

## Quick Reference

```bash
# View current knowledge base
cat .claude/knowledge.md

# Check maintenance history  
git log .claude/

# Validate knowledge base accuracy
npm run prebuild  # Ensures all referenced commands work
```

---

**Note**: These files help Claude Code provide more accurate, project-specific assistance by understanding CultureMade's unique dual-interface architecture and development workflow.