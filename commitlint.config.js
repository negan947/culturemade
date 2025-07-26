/**
 * Commitlint configuration for conventional commits
 * @see https://commitlint.js.org/
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum - allowed commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system changes
        'ci', // CI configuration changes
        'chore', // Other changes (maintenance, etc.)
        'revert', // Revert previous commit
        'wip', // Work in progress
        'improvement', // General improvements
      ],
    ],
    // Subject case - allow sentence case for more natural commit messages
    'subject-case': [2, 'always', 'sentence-case'],
    // Subject length - max 72 characters for good git log formatting
    'subject-max-length': [2, 'always', 72],
    // Subject min length - at least 10 characters for meaningful messages
    'subject-min-length': [2, 'always', 10],
    // Subject empty - must have a subject
    'subject-empty': [2, 'never'],
    // Type case - type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Type empty - must have a type
    'type-empty': [2, 'never'],
    // Scope case - scope must be lowercase
    'scope-case': [2, 'always', 'lower-case'],
    // Body leading blank - body must be separated by blank line
    'body-leading-blank': [2, 'always'],
    // Footer leading blank - footer must be separated by blank line
    'footer-leading-blank': [2, 'always'],
    // Header max length - total header length
    'header-max-length': [2, 'always', 100],
    // Body max line length - for readability
    'body-max-line-length': [2, 'always', 100],
    // Footer max line length - for readability
    'footer-max-line-length': [2, 'always', 100],
  },
  // Ignore patterns for certain commit messages
  ignores: [
    // Ignore merge commits
    (message) => message.startsWith('Merge'),
    // Ignore revert commits
    (message) => message.startsWith('Revert'),
    // Ignore initial commit
    (message) => message.includes('Initial commit'),
  ],
  // Custom prompt for commit message assistance
  prompt: {
    questions: {
      type: {
        description: 'Select the type of change that you\'re committing:',
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: 'Changes that do not affect the meaning of the code',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description: 'Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description: 'Changes to our CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description: 'Other changes that don\'t modify src or test files',
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: 'Reverts a previous commit',
            title: 'Reverts',
            emoji: '🗑',
          },
        },
      },
      scope: {
        description: 'What is the scope of this change (e.g. component or file name)',
      },
      subject: {
        description: 'Write a short, imperative tense description of the change',
      },
      body: {
        description: 'Provide a longer description of the change',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description: 'If issues are fixed, the commit requires a body. Please enter a longer description of the commit itself',
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123")',
      },
    },
  },
}; 