# Heart Condition Monitoring IoT System

## Overview

This is a real-time heart condition monitoring system built with IoT integration for a thesis project titled "PENERAPAN INTERNET OF THINGS DALAM IDENTIFIKASI DINI DAN MONITORING KONDISI JANTUNG SECARA REAL-TIME". The application connects ESP32 IoT devices to a web dashboard for continuous heart health monitoring and early condition detection using machine learning classification.

The system captures vital signs including temperature, heart rate (BPM), blood oxygen saturation (SpO2), and blood pressure, then processes this data through a Naive Bayes classifier to categorize conditions as "Normal", "Kurang Normal", or "Berbahaya" (Dangerous).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui component system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state and custom hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: Firebase Realtime Database subscriptions with custom hooks

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with classification endpoints
- **Machine Learning**: Server-side Naive Bayes classifier implementation for heart condition analysis
- **Data Validation**: Zod schemas for request/response validation
- **Development Setup**: Hot module replacement with Vite middleware integration

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for structured data
- **Real-time Database**: Firebase Realtime Database for IoT device data streaming
- **Connection**: Neon serverless PostgreSQL for cloud database hosting
- **Schema Management**: Drizzle migrations with TypeScript schema definitions

### Authentication and Authorization
- **Current State**: No authentication implemented (monitoring-focused application)
- **Prepared Infrastructure**: Firebase Auth configuration available for future implementation
- **Session Management**: Connect-pg-simple for session storage when authentication is added

### Machine Learning Classification
- **Algorithm**: Naive Bayes classifier implemented in TypeScript
- **Training Data**: Predefined medical ranges for vital signs classification
- **Classification Categories**: Normal, Kurang Normal (Less Normal), Berbahaya (Dangerous)
- **Feature Engineering**: Six vital sign parameters processed for classification
- **Real-time Processing**: Server-side classification API endpoint for immediate analysis

## External Dependencies

### Third-party Services
- **Firebase**: Realtime Database for IoT data streaming and optional authentication
- **Neon Database**: Serverless PostgreSQL hosting for application data

### APIs and Integrations
- **Firebase Realtime Database API**: Real-time data synchronization from ESP32 devices
- **Classification API**: Internal `/api/classify` endpoint for heart condition analysis

### Hardware Integration
- **ESP32 IoT Device**: Captures vital signs including temperature, heart rate, SpO2, and blood pressure
- **Sensors**: MAX30105 for heart rate and SpO2, MLX90614 for temperature, blood pressure monitoring
- **Connectivity**: WiFi connection for real-time data transmission to Firebase

### Development Tools
- **Build System**: Vite with React plugin and runtime error overlay
- **Type Safety**: TypeScript with strict configuration across client, server, and shared modules
- **Code Quality**: ESLint integration through Vite plugins
- **Development Environment**: Replit-specific configurations and plugins for cloud development