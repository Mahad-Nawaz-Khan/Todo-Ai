# Todo AI - Complete Documentation Index

Welcome to the Todo AI documentation! This guide will help you navigate all available documentation for both the frontend and backend of the application.

## 📚 Quick Navigation

### Frontend Documentation
- [Frontend README](./frontend/README.md) - Frontend setup and overview
- [Frontend Architecture](./frontend/docs/ARCHITECTURE.md) - System design and structure
- [Frontend Components Guide](./frontend/docs/COMPONENTS.md) - Component documentation and examples
- [Frontend Development Guide](./frontend/docs/DEVELOPMENT.md) - Development workflow and best practices

### Backend Documentation
- [Backend README](./backend/README.md) - Backend setup and overview
- [Backend Architecture](./backend/docs/ARCHITECTURE.md) - System design and structure
- [Backend API Reference](./backend/docs/API.md) - Complete API endpoint documentation
- [Backend Development Guide](./backend/docs/DEVELOPMENT.md) - Development workflow and best practices
- [Database Schema](./backend/docs/DATABASE.md) - Database models and operations

---

## 🎯 Quick Start

### For First-Time Setup

1. **Backend Setup** (5-10 minutes)
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements-dev.txt
   cp .env.example .env
   uvicorn src.main:app --reload --port 8000
   ```
   → See [Backend README](./backend/README.md)

2. **Frontend Setup** (5-10 minutes)
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   npm run dev
   ```
   → See [Frontend README](./frontend/README.md)

3. **Visit the app**
   - Frontend: http://localhost:3000
   - Backend API Docs: http://localhost:8000/docs

---

## 📖 Documentation by Role

### 👨‍💻 Frontend Developer

**Getting Started**:
- Read: [Frontend README](./frontend/README.md) - Overview and setup
- Read: [Frontend Architecture](./frontend/docs/ARCHITECTURE.md) - How everything is organized
- Read: [Frontend Development Guide](./frontend/docs/DEVELOPMENT.md) - How to develop features

**Building Components**:
- Reference: [Frontend Components Guide](./frontend/docs/COMPONENTS.md) - All available components
- Follow: [Frontend Development Guide](./frontend/docs/DEVELOPMENT.md#working-with-components)

**Common Tasks**:
- Creating new page: See [Architecture](./frontend/docs/ARCHITECTURE.md#page-load-flow)
- Using API: See [Development Guide](./frontend/docs/DEVELOPMENT.md#working-with-services)
- Testing: See [Development Guide](./frontend/docs/DEVELOPMENT.md#testing)

---

### 🔧 Backend Developer

**Getting Started**:
- Read: [Backend README](./backend/README.md) - Overview and setup
- Read: [Backend Architecture](./backend/docs/ARCHITECTURE.md) - System design
- Read: [Backend Development Guide](./backend/docs/DEVELOPMENT.md) - How to develop features

**Understanding Data**:
- Reference: [Database Schema](./backend/docs/DATABASE.md) - All database models
- Reference: [Database Operations](./backend/docs/DATABASE.md#querying-examples)

**Building Features**:
- Creating new endpoint: See [Development Guide](./backend/docs/DEVELOPMENT.md#working-with-routers)
- Adding database model: See [Development Guide](./backend/docs/DEVELOPMENT.md#working-with-models)
- Writing tests: See [Development Guide](./backend/docs/DEVELOPMENT.md#testing)

**API Integration**:
- Reference: [API Documentation](./backend/docs/API.md) - All endpoints and schemas

---

### 🎨 Full Stack Developer

**Understanding the System**:
- Read: [Frontend Architecture](./frontend/docs/ARCHITECTURE.md)
- Read: [Backend Architecture](./backend/docs/ARCHITECTURE.md)

**End-to-End Feature Development**:
1. Design: Review architecture documents
2. Backend: Implement API using [Development Guide](./backend/docs/DEVELOPMENT.md)
3. Frontend: Implement UI using [Development Guide](./frontend/docs/DEVELOPMENT.md)
4. Test: Follow testing guides in both
5. Deploy: Check deployment sections in READMEs

---

## 🔍 Finding Specific Information

### I want to...

**Understand the system architecture**
- Frontend: [Frontend Architecture](./frontend/docs/ARCHITECTURE.md)
- Backend: [Backend Architecture](./backend/docs/ARCHITECTURE.md)

**Build a new feature**
- Backend: [Backend Development Guide](./backend/docs/DEVELOPMENT.md#creating-a-new-feature)
- Frontend: [Frontend Development Guide](./frontend/docs/DEVELOPMENT.md#creating-a-new-feature)

**Learn about available components**
- Frontend: [Components Guide](./frontend/docs/COMPONENTS.md)

**Understand the database**
- Backend: [Database Schema](./backend/docs/DATABASE.md)

**Call an API endpoint**
- Backend: [API Reference](./backend/docs/API.md)
- Frontend: [Development Guide - Working with Services](./frontend/docs/DEVELOPMENT.md#working-with-services)

**Deploy to production**
- Frontend: [Frontend README - Deployment](./frontend/README.md#building--deployment)
- Backend: [Backend README - Deployment](./backend/README.md#deployment)

**Write tests**
- Backend: [Backend Development Guide - Testing](./backend/docs/DEVELOPMENT.md#testing)
- Frontend: [Frontend Development Guide - Testing](./frontend/docs/DEVELOPMENT.md#testing)

**Debug an issue**
- Backend: [Backend Development Guide - Debugging](./backend/docs/DEVELOPMENT.md#debugging)
- Frontend: [Frontend Development Guide - Debugging](./frontend/docs/DEVELOPMENT.md#debugging)

---

## 📋 Technology Stack Overview

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with SSR/SSG |
| React 19 | UI library |
| Tailwind CSS 4 | Styling |
| TypeScript | Type safety |
| Fetch API | HTTP client |
| Service Worker | Offline support |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Web framework |
| Uvicorn | ASGI server |
| SQLModel | ORM |
| PostgreSQL | Database |
| OpenAI Agents SDK | AI operations |
| JWT | Authentication |
| SlowAPI | Rate limiting |

---

## 🚀 Development Workflow

### Typical Feature Development

```
1. Branch Creation
   git checkout -b feature/my-feature
   
2. Backend Development
   - Create/modify models (src/models/)
   - Create/modify schemas (src/schemas/)
   - Create/modify services (src/services/)
   - Create/modify routers (src/api/)
   - Write tests (tests/)
   - Test endpoints at /docs
   
3. Frontend Development
   - Create/modify components (src/components/)
   - Create/modify services (src/services/)
   - Create/modify hooks (src/hooks/)
   - Write tests (__tests__/)
   - Test in browser
   
4. Testing & Review
   - Run all tests
   - Format code
   - Create pull request
   
5. Merge & Deploy
   - Merge to main
   - Deploy to staging
   - Deploy to production
```

---

## 🐛 Troubleshooting Guide

### Backend Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Database connection error | Check DATABASE_URL | [Backend README](./backend/README.md#configuration) |
| API not responding | Check port 8000 | [Backend README](./backend/README.md#quick-start) |
| Authentication fails | Check SECRET_KEY | [Backend Development](./backend/docs/DEVELOPMENT.md#environment-management) |
| Tests failing | Clear cache and reinstall | [Backend Development](./backend/docs/DEVELOPMENT.md#troubleshooting) |

### Frontend Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Port 3000 in use | Use different port | [Frontend Development](./frontend/docs/DEVELOPMENT.md#troubleshooting) |
| Module not found | Reinstall dependencies | [Frontend Development](./frontend/docs/DEVELOPMENT.md#troubleshooting) |
| API calls failing | Check NEXT_PUBLIC_API_URL | [Frontend README](./frontend/README.md#environment-variables) |
| Build errors | Check TypeScript errors | [Frontend Development](./frontend/docs/DEVELOPMENT.md#troubleshooting) |

---

## 📚 Key Concepts

### Authentication Flow
- User signs up/logs in
- Backend generates JWT token
- Frontend stores token in localStorage
- Frontend includes token in API requests
- Backend validates token on each request

See: [Backend API - Authentication](./backend/docs/API.md#authentication)

### Task Management
- Users create tasks with priority, due date, tags
- Tasks can be marked complete
- Tasks can recur (Daily/Weekly/Monthly)
- AI can create/update tasks via chat
- Users can filter/search tasks

See: [Backend API - Tasks](./backend/docs/API.md#task-endpoints)

### AI Integration
- User sends message to chat
- Backend passes to OpenAI Agents SDK
- AI interprets intent and calls task tools
- Tools execute via MCP server
- Response streamed back to user

See: [Backend Architecture - AI Integration](./backend/docs/ARCHITECTURE.md#ai--agent-integration)

### Offline Support
- Service Worker intercepts requests
- Cached responses served when offline
- Changes stored in IndexedDB
- Auto-sync when back online
- Conflict resolution via backend

See: [Frontend Architecture - Offline Flow](./frontend/docs/ARCHITECTURE.md#offline-flow)

---

## 🔗 Related Resources

### Documentation Files Location
```
.
├── README.md                           # This file
├── frontend/
│   ├── README.md                       # Frontend overview
│   └── docs/
│       ├── ARCHITECTURE.md             # Frontend design
│       ├── COMPONENTS.md               # Component reference
│       └── DEVELOPMENT.md              # Development guide
└── backend/
    ├── README.md                       # Backend overview
    └── docs/
        ├── ARCHITECTURE.md             # Backend design
        ├── API.md                      # API reference
        ├── DATABASE.md                 # Database schema
        └── DEVELOPMENT.md              # Development guide
```

### External References
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🤝 Contributing

### Before Contributing
1. Read the relevant documentation for your area
2. Follow the coding standards in [Development Guides](./frontend/docs/DEVELOPMENT.md)
3. Write tests for new features
4. Ensure all tests pass
5. Format your code

### Making a Contribution
1. Create a feature branch
2. Implement your feature
3. Add/update tests and documentation
4. Create a pull request with clear description
5. Address review feedback
6. Merge when approved

---

## 📞 Support

### Getting Help
1. Check the troubleshooting section relevant to your area
2. Search the documentation using keywords
3. Review examples in the codebase
4. Ask in team discussions or create an issue

### Reporting Issues
When reporting an issue:
1. Describe what you were doing
2. Describe what happened
3. Provide error messages/screenshots
4. List your environment (OS, browser, versions)
5. Include steps to reproduce

---

## 📝 Documentation Maintenance

### Keeping Docs Updated
- Update docs when APIs change
- Add docs for new features
- Fix typos and clarify unclear sections
- Keep examples working

### Contributing to Documentation
1. Fork the repository
2. Make documentation changes
3. Test that code examples work
4. Create a pull request
5. Address review feedback

---

## ✅ Quick Checklist

### Before Starting Development
- [ ] Read relevant README
- [ ] Read Architecture guide
- [ ] Set up development environment
- [ ] Understand the feature scope

### Before Submitting Code
- [ ] Written tests
- [ ] Code formatted
- [ ] Tests passing
- [ ] Documentation updated
- [ ] No console errors/warnings

### Before Merging to Main
- [ ] All tests pass
- [ ] Code reviewed
- [ ] No breaking changes
- [ ] Documentation complete

---

**Last Updated**: January 2024
**Version**: 1.0.0

For the latest information, visit the project repository.
