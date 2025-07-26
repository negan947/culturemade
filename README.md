# CultureMade - Revolutionary E-Commerce Platform

<div align="center">
  <img src="public/CM_Logo_New.png" alt="CultureMade Logo" width="200" height="200" />

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
</div>

## 🎯 Project Vision

CultureMade is an innovative dual-interface e-commerce platform that combines cutting-edge technology with authentic user experiences:

- **🔧 Customer Experience**: Immersive iPhone 14 Pro simulation with authentic iOS interface and interactions
- **🔧 Admin Experience**: Comprehensive Shopify-style dashboard for business management
- **🔧 Full-Stack Solution**: Complete e-commerce functionality built from the ground up

### Key Features

✨ **Authentic iPhone Interface**: Pixel-perfect iPhone 14 Pro simulation with dynamic island, status bar, and home screen
📱 **9 iPhone Apps**: CultureMade shopping app plus 8 placeholder apps for future development
🛒 **Complete E-Commerce**: Product catalog, shopping cart, checkout, user accounts, and order management
👨‍💼 **Admin Dashboard**: Comprehensive business management interface with analytics and reporting
🔒 **Enterprise Security**: OWASP-compliant security, PCI DSS compliance, and GDPR compliance
⚡ **High Performance**: Sub-200ms API responses, 95+ Lighthouse scores, and optimized user experience

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: [Download](https://nodejs.org/)
- **npm 9+**: Comes with Node.js
- **Git**: [Download](https://git-scm.com/)
- **VS Code**: [Download](https://code.visualstudio.com/) (recommended)

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/culturemade.git
   cd culturemade
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration values.

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### VS Code Setup

For the best development experience:

1. **Install Recommended Extensions**: VS Code will prompt you to install our recommended extension pack
2. **Reload VS Code**: Restart to activate all extensions
3. **Auto-Setup**: Our workspace settings will configure formatting, linting, and TypeScript automatically

## 🛠 Development Environment

Our development environment includes comprehensive code quality tools that run automatically:

### Code Quality Tools

- **🔍 ESLint**: Advanced code linting with TypeScript, React, and accessibility rules
- **💄 Prettier**: Consistent code formatting with import organization
- **📝 TypeScript**: Strict type checking with no implicit any
- **🎣 Husky**: Git hooks for pre-commit validation
- **🚀 lint-staged**: Run linters only on staged files
- **📋 commitlint**: Enforce conventional commit messages

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript checks |
| `npm run prebuild` | Full quality check before build |

### Pre-Commit Automation

Our Git hooks automatically run:

- **Pre-commit**: Lint and format staged files
- **Commit-msg**: Validate commit message format
- **Pre-push**: Type checking and comprehensive linting

## 📁 Project Structure

```
culturemade/
├── 📱 app/                          # Next.js 15 App Router
│   ├── (auth)/                      # Authentication routes
│   ├── account/                     # User account pages
│   ├── admin/                       # Admin dashboard
│   └── api/                         # API routes
├── 🧩 components/                   # React components
│   ├── auth/                        # Authentication components
│   ├── iphone/                      # iPhone simulation components
│   └── ui/                          # Reusable UI components
├── 🎣 hooks/                        # Custom React hooks
├── 📚 lib/                          # Utility libraries
│   ├── supabase/                    # Supabase configuration
│   ├── utils/                       # Utility functions
│   └── validations/                 # Schema validations
├── 🏪 store/                        # Redux store configuration
├── 🎨 styles/                       # Global styles and Tailwind config
├── 📝 types/                        # TypeScript type definitions
├── 🔧 .vscode/                      # VS Code workspace settings
├── 🎣 .husky/                       # Git hooks
└── 📋 Configuration files
```

## 🏗 Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom iPhone components
- **State Management**: Redux Toolkit with RTK Query
- **Animation**: Framer Motion for smooth transitions
- **UI Components**: Custom design system with Radix UI primitives

### Backend
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage with CDN
- **API**: Next.js API routes with middleware
- **Payments**: Stripe with Apple Pay integration

### Development Tools
- **Code Quality**: ESLint, Prettier, TypeScript, Husky
- **Testing**: Jest, React Testing Library, Cypress (planned)
- **Deployment**: Vercel with automatic previews
- **Monitoring**: Vercel Analytics, Sentry (planned)

## 🔧 Architecture Overview

### Dual-Interface System

**Customer Experience (iPhone Interface)**
- Authentic iPhone 14 Pro simulation with lock screen, home screen, and apps
- CultureMade shopping app with full e-commerce functionality
- 8 placeholder apps for future development
- Smooth animations and iOS-like interactions

**Admin Experience (Web Dashboard)**
- Traditional web interface optimized for business users
- Comprehensive product, order, and customer management
- Real-time analytics and reporting
- Separate authentication system from customer accounts

### Database Schema

Our Supabase database includes 19 tables with comprehensive relationships:

- **Users & Authentication**: User profiles, sessions, and permissions
- **Products & Catalog**: Products, categories, variants, and inventory
- **Orders & Commerce**: Shopping carts, orders, payments, and fulfillment
- **Content & Media**: Images, descriptions, and SEO data
- **Admin & Analytics**: Admin users, logs, and business metrics

## 🔒 Security & Compliance

### Security Features
- **🛡️ OWASP Compliance**: Following OWASP Top 10 security guidelines
- **🔐 Row Level Security**: Database-level access controls
- **🔑 JWT Authentication**: Secure token-based authentication
- **🌐 HTTPS Everywhere**: End-to-end encryption
- **🚫 Input Validation**: Comprehensive input sanitization
- **⚡ Rate Limiting**: API protection against abuse

### Compliance Standards
- **💳 PCI DSS**: Payment card industry compliance
- **🇪🇺 GDPR**: European data protection compliance
- **🛡️ SOC 2**: Security and availability controls
- **📋 Regular Audits**: Automated security scanning

## 📊 Performance Targets

### Core Web Vitals
- **🚀 Largest Contentful Paint (LCP)**: < 1.5s
- **⚡ First Input Delay (FID)**: < 50ms
- **📐 Cumulative Layout Shift (CLS)**: < 0.1
- **⏱️ Time to Interactive (TTI)**: < 2s

### API Performance
- **📡 Database Queries**: < 50ms average
- **🔄 API Responses**: < 200ms average
- **🔍 Search Queries**: < 100ms average
- **🔄 Real-time Updates**: < 10ms latency

### Business Metrics
- **⏰ Uptime**: 99.9% availability
- **💰 Conversion Rate**: > 3% target
- **🛒 Cart Abandonment**: < 60%
- **⭐ Customer Satisfaction**: > 4.5/5 rating

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information about:

- **🔧 Development Environment Setup**
- **📏 Code Quality Standards**
- **🔄 Git Workflow and Branch Strategy**
- **📝 Commit Message Guidelines**
- **🔍 Pull Request Process**
- **👥 Code Review Guidelines**

### Quick Contribution Checklist

Before submitting a pull request:

- [ ] 🧪 All tests pass
- [ ] 🔍 ESLint checks pass
- [ ] 💄 Code is formatted with Prettier
- [ ] 📝 TypeScript types are correct
- [ ] 📋 Commit messages follow conventional format
- [ ] 📖 Documentation is updated
- [ ] 🔍 Self-review completed

## 🗺 Development Roadmap

### Current Phase: Pre-MVP Foundation (0.1.x)
- [x] **✅ TypeScript Configuration**: Strict mode, path mapping, type safety
- [x] **✅ Code Quality Tools**: ESLint, Prettier, Husky, commitlint
- [ ] **🚧 Development Tools**: VS Code integration, debugging, environment validation

### Upcoming Phases
- **🔐 Phase 1**: Authentication & User Management
- **📱 Phase 2**: iPhone Interface & Core Apps
- **🛒 Phase 3**: E-Commerce Functionality
- **👨‍💼 Phase 4**: Admin Dashboard
- **🚀 Phase 5**: Advanced Features & Optimization

See our [Development Roadmap](CULTUREMADE_DEV_ROADMAP.md) for detailed implementation plans.

## 📋 Current Progress

Track our development progress in [CULTUREMADE_PROGRESS.md](CULTUREMADE_PROGRESS.md).

## 🆘 Support & Help

### Getting Help
- **📖 Documentation**: Check our comprehensive guides
- **🐛 Issues**: [Create an issue](https://github.com/yourusername/culturemade/issues) for bugs
- **💡 Discussions**: [Join discussions](https://github.com/yourusername/culturemade/discussions) for questions
- **📧 Email**: Contact the team for security issues

### Common Issues
- **ESLint Issues**: Run `npm run lint:fix`
- **Type Errors**: Run `npm run type-check`
- **Format Issues**: Run `npm run format`
- **Hook Issues**: Run `npm run prepare`

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the incredible React framework
- **Supabase Team**: For the powerful backend-as-a-service platform
- **Tailwind CSS**: For the utility-first CSS framework
- **Open Source Community**: For the amazing tools and libraries that make this project possible

---

<div align="center">
  <p><strong>Built with ❤️ by the CultureMade Team</strong></p>
  <p>Creating the future of e-commerce, one component at a time.</p>
</div>
