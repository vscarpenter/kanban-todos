# Kanban Todos Documentation

Welcome to the comprehensive documentation for the Kanban Todos application. This documentation covers everything from basic usage to advanced features and development guidelines.

## 📚 Table of Contents

### User Documentation
- [Getting Started](./getting-started.md) - Quick start guide and installation
- [Installation Guide](./installation-guide.md) - PWA installation for all platforms
- [User Guide](./user-guide.md) - Complete user manual with all features

### Developer Documentation
- [Developer Guide](./developer-guide.md) - Development setup and architecture
- [API Reference](./api-reference.md) - Technical API documentation
- [Refactoring Guide v3.0](./REFACTORING-V3.md) - Version 3.0 architecture improvements ⭐ NEW

### Operational Documentation
- [Security Guide](./security-guide.md) - Security features and best practices
- [Performance Guide](./performance-guide.md) - Performance optimization and monitoring
- [Accessibility Guide](./accessibility-guide.md) - Accessibility features and compliance
- [Deployment Guide](./deployment-guide.md) - Production deployment instructions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

### Contributing
- [Contributing](./contributing.md) - How to contribute to the project

## 🚀 Quick Start

1. **Installation**: Clone the repository and run `npm install`
2. **Development**: Run `npm run dev` to start the development server
3. **Build**: Run `npm run build` to create a production build
4. **Test**: Run `npm test` to execute the test suite

> **Version 3.0.1** includes major internal refactoring for improved code quality. See [Refactoring Guide](./REFACTORING-V3.md) for details.

## 🎯 Key Features

- **Modern Kanban Board**: Drag-and-drop task management
- **Progressive Web App**: Install on any device for native app experience
- **Real-time Performance Monitoring**: Built-in performance tracking
- **Comprehensive Security**: Input sanitization, XSS protection, and more
- **Accessibility First**: WCAG 2.1 AA compliant with screen reader support
- **Production Ready**: Complete monitoring, error handling, and optimization
- **Offline Support**: Works without internet connection
- **Data Export/Import**: Full data portability

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5.9
- **Styling**: Tailwind CSS v4, shadcn/ui
- **State Management**: Zustand (modular architecture v3.0+)
- **Data Storage**: IndexedDB
- **Testing**: Vitest, Testing Library, Playwright
- **Deployment**: Static export to S3/CloudFront

## 📖 Documentation Structure

Each documentation file is designed to serve a specific audience:

- **Users**: Start with [Getting Started](./getting-started.md) and [User Guide](./user-guide.md)
- **Developers**: Begin with [Developer Guide](./developer-guide.md) and [API Reference](./api-reference.md)
- **DevOps**: Focus on [Deployment Guide](./deployment-guide.md) and [Performance Guide](./performance-guide.md)
- **Accessibility**: Check [Accessibility Guide](./accessibility-guide.md)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./contributing.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

If you need help or have questions:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review the [FAQ section](./user-guide.md#faq)
3. Open an issue on GitHub
4. Contact the development team

---

## 🎉 What's New in v3.0.1

- **Modular Store Architecture**: Task store refactored into 7 focused modules
- **Improved Code Quality**: Functions reduced to under 30 lines
- **Better Performance**: Removed 724 lines of unused code
- **Enhanced Maintainability**: Following SOLID principles throughout
- **100% Backward Compatible**: No breaking changes to public API

See [CHANGELOG](../CHANGELOG.md) for complete version history.

---

*Last updated: January 2025 (v3.0.1)*
