# Prime Edge Banking - Full-Stack Banking Application

## Overview

Prime Edge Banking is a modern, full-stack internet banking application built with a clean architecture inspired by corporate banking design. The application provides secure user authentication, account management, transaction tracking, and administrative controls for fund management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend, backend, and data layers:

- **Frontend**: React-based SPA with TypeScript and modern UI components
- **Backend**: Express.js REST API with JWT authentication
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management

## Key Components

### Authentication System

The application implements a comprehensive authentication system with:

- **JWT-based Authentication**: Secure token-based authentication using jsonwebtoken
- **Password Security**: bcryptjs for password hashing and validation
- **Role-based Access Control**: Supports "user" and "admin" roles with different permissions
- **Client-side Auth Management**: AuthManager class handles authentication state and persistence
- **Protected Routes**: Route-level protection based on authentication status and user roles
- **Secure Logout**: Complete session clearing including localStorage, sessionStorage, browser cache, and TanStack Query cache

### Database Schema

The application now uses a PostgreSQL database with three main tables managed by Drizzle ORM:

- **Users Table**: Stores user information, credentials, roles, account balances, account numbers, and account types
- **Transactions Table**: Records all financial transactions with type, amount, descriptions, and timestamps
- **Admin Logs Table**: Tracks administrative actions for audit purposes with admin and target user references

The database connection is configured through environment variables and uses the Neon serverless PostgreSQL adapter for optimal performance and scalability.

### Frontend Architecture

- **Component-based Design**: React components organized with shadcn/ui design system
- **TypeScript Integration**: Full type safety across the application
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **State Management**: TanStack Query for API state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

### API Structure

RESTful API endpoints organized by functionality:

- **Authentication**: `/api/auth/register`, `/api/auth/login`
- **User Data**: `/api/dashboard` for user information and transactions
- **Admin Operations**: Fund management and user administration endpoints
- **Middleware**: JWT verification and role-based access control

## Data Flow

1. **User Registration/Login**: Users authenticate through secure endpoints with password hashing
2. **Session Management**: JWT tokens stored client-side with automatic authentication state management
3. **Dashboard Data**: Authenticated users receive personalized dashboard data including balance and transactions
4. **Admin Operations**: Admin users can manage funds and view audit logs through protected endpoints
5. **Real-time Updates**: TanStack Query provides optimistic updates and cache invalidation

## External Dependencies

### Core Framework Dependencies
- **Express.js**: Backend web framework with middleware support
- **React**: Frontend UI library with TypeScript support
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL adapter
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)

### UI and Styling
- **shadcn/ui**: Comprehensive UI component library built on Radix UI
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Headless UI components for accessibility and customization

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is configured for deployment on Replit with:

### Development Setup
- **Development Server**: `npm run dev` starts both frontend and backend in development mode
- **Hot Module Replacement**: Vite provides fast refresh during development
- **TypeScript Checking**: Continuous type checking with `npm run check`

### Production Build
- **Frontend Build**: Vite builds optimized React application
- **Backend Bundle**: ESBuild creates production-ready Express server
- **Static Asset Serving**: Production server serves built frontend assets

### Database Management
- **PostgreSQL Integration**: Full PostgreSQL database with Drizzle ORM for type-safe operations
- **Schema Migrations**: Drizzle Kit handles database schema management and migrations
- **Environment Configuration**: DATABASE_URL environment variable for PostgreSQL connection
- **Database Push**: `npm run db:push` applies schema changes to production database
- **Database Seeding**: Initial data population with admin and demo user accounts

### Environment Requirements
- **Node.js**: ES modules support with modern JavaScript features
- **PostgreSQL**: Database instance accessible via DATABASE_URL
- **JWT Secret**: JWT_SECRET environment variable for token signing

The application is designed to be easily deployable on cloud platforms with minimal configuration, requiring only environment variables for database connection and JWT secret.