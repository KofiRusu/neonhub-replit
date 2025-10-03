# Contributing to NeonHub v2.5.0

Thank you for your interest in contributing to NeonHub! This document provides guidelines and instructions for contributing.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Git
- PostgreSQL 14+ or Docker
- Familiarity with Next.js, React, and TypeScript

### Setup Development Environment

```bash
# Clone the repository
cd Neon-v2.5.0

# Run setup script
./scripts/setup.sh

# Or manually:
cd ui && npm install
cd ../backend && npm install
docker-compose up -d postgres
```

---

## 📋 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Locally

```bash
# Run linter
npm run lint

# Build
npm run build

# Run tests (backend)
cd backend && npm test
```

### 4. Commit Changes

Use conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in component"
git commit -m "docs: update README"
git commit -m "style: format code"
git commit -m "refactor: improve performance"
```

**Commit Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style/formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 🎨 Code Style

### TypeScript

```typescript
// Use explicit types
interface UserProps {
  id: string;
  name: string;
  email: string;
}

// Prefer const over let
const user: UserProps = { ... };

// Use async/await over promises
async function fetchUser(id: string): Promise<UserProps> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### React Components

```tsx
// Use functional components with TypeScript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`btn-neon ${variant === 'secondary' ? 'btn-neon-purple' : ''}`}
    >
      {children}
    </button>
  );
}
```

### CSS/Tailwind

```tsx
// Use Tailwind classes
<div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6">
  
// Group related classes
<div className="
  flex items-center justify-between
  bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]
  px-6 py-3 rounded-lg
  hover:opacity-90 transition-opacity
">
```

---

## 📁 Project Structure

### Frontend (ui/)

```
src/
├── app/              # Next.js pages (App Router)
│   ├── [route]/      # Individual routes
│   └── api/          # API routes
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui components
│   └── [feature]/   # Feature-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
└── types/           # TypeScript types
```

### Backend (backend/)

```
src/
├── agents/          # AI agents
├── routes/          # API routes
├── services/        # Business logic
├── controllers/     # Request handlers
├── lib/            # Utilities
└── db/             # Database client
```

---

## 🧪 Testing

### Writing Tests

```typescript
// backend/src/__tests__/example.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## 🎨 UI/UX with v0.dev

When adding new UI components:

1. **Design with v0.dev**
   - Use prompts from `V0_INTEGRATION_GUIDE.md`
   - Include NeonHub color palette
   - Request glassmorphism effects

2. **Integrate Components**
   - Copy generated code
   - Adjust imports for NeonHub structure
   - Ensure responsive design
   - Test accessibility

3. **Maintain Consistency**
   - Use existing components where possible
   - Follow design system (colors, spacing)
   - Match animation styles

---

## 📝 Documentation

### Update Documentation When:

- Adding new features → Update README.md
- Changing APIs → Update API documentation
- Adding routes → Update route list
- Changing configuration → Update DEPLOYMENT.md

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep TOC updated

---

## 🔍 Code Review Process

### For Reviewers

- ✅ Code follows style guidelines
- ✅ Tests pass
- ✅ No console errors/warnings
- ✅ Documentation updated
- ✅ Changes are well-explained
- ✅ No security vulnerabilities
- ✅ Performance is acceptable

### For Contributors

- Respond to feedback promptly
- Make requested changes
- Keep PR focused and small
- Rebase if needed

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 2.5.0]

**Additional context**
Any other context about the problem.
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, examples, or references.
```

---

## 🎯 Priority Areas

### High Priority

1. **Complete Remaining Routes** (8/20 pending)
   - Billing, Team, Documents, Tasks
   - Metrics, Feedback, Messaging

2. **Performance Optimization**
   - Reduce bundle size
   - Improve loading times
   - Optimize images

3. **Testing**
   - Increase test coverage
   - Add E2E tests
   - Integration tests

### Medium Priority

4. **Accessibility**
   - WCAG AA compliance
   - Keyboard navigation
   - Screen reader support

5. **Mobile Experience**
   - Responsive design
   - Touch interactions
   - PWA features

### Low Priority

6. **Documentation**
   - API documentation
   - Component storybook
   - Video tutorials

---

## 🏆 Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to contributors list

---

## 📞 Getting Help

- **Documentation**: Check README.md, DEPLOYMENT.md
- **Issues**: Search existing issues
- **Discussions**: GitHub Discussions
- **Questions**: Open a Q&A issue

---

## 📜 Code of Conduct

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Welcome diverse perspectives
- ✅ Accept constructive criticism
- ✅ Focus on what's best for the community
- ❌ No harassment or discrimination
- ❌ No spam or promotional content

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## 🙏 Thank You!

Every contribution, no matter how small, helps make NeonHub better!

---

**Happy Coding!** 🚀

