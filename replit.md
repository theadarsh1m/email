# AI-Powered Communication Assistant

## Overview

This is a full-stack AI-powered email communication assistant that automates the management of support emails. The system fetches emails from various sources (Gmail, IMAP, etc.), analyzes them using AI for sentiment and priority classification, generates contextual responses, and provides a comprehensive dashboard for managing customer communications. Built with a modern tech stack including React, Express, PostgreSQL, and OpenAI integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular components with separation between UI components, pages, and business logic

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with dedicated routes for emails, responses, and analytics
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Request/Response Flow**: Middleware-based architecture with error handling and request logging

### Data Storage Solutions
- **Primary Database**: PostgreSQL using Neon serverless connections
- **Schema Design**: Relational database with tables for users, emails, responses, and analytics
- **Connection Pooling**: Neon connection pooling for efficient database access
- **Migrations**: Drizzle Kit for database schema migrations

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Username/password authentication with encrypted storage
- **Security**: Environment-based secrets management

### AI and Machine Learning Integration
- **LLM Provider**: OpenAI GPT-5 for text analysis and generation
- **Core AI Features**:
  - Sentiment analysis (positive/negative/neutral classification)
  - Priority detection (urgent/normal based on keywords and context)
  - Information extraction (customer details, contact info, issue categorization)
  - Automated response generation with context awareness
- **AI Service Architecture**: Dedicated OpenAI service class with structured prompts and response parsing

### Email Processing Pipeline
- **Email Sources**: Gmail API integration with OAuth2 authentication
- **Processing Workflow**:
  1. Fetch emails using IMAP/Gmail APIs
  2. Filter support-related emails by subject keywords
  3. AI analysis for sentiment, priority, and information extraction
  4. Store processed data with metadata
  5. Generate draft responses using context-aware AI
- **Async Processing**: Background email synchronization with manual trigger capability

### External Dependencies

#### Third-Party Services
- **OpenAI API**: GPT-5 model for natural language processing and generation
- **Gmail API**: Email fetching and sending capabilities
- **Neon Database**: Serverless PostgreSQL hosting

#### Email Integration
- **Gmail API**: OAuth2-based authentication for reading and sending emails
- **IMAP Support**: Generic email server connectivity for non-Gmail providers
- **Email Filtering**: Subject-based filtering for support-related communications

#### Development and Build Tools
- **Vite**: Frontend build tool with React plugin
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Production backend bundling

#### UI and Component Libraries
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library
- **Tailwind CSS**: Utility-first styling framework
- **Date-fns**: Date manipulation and formatting