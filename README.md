# DigiSign - Premium Digital Signature & Document Management Platform (Frontend)

## Project Overview

**DigiSign** is a modern, premium web application designed to facilitate secure document uploads, management, and digital signing. This repository contains the frontend application built with Next.js and React. It provides an intuitive, highly responsive, and aesthetically pleasing user interface for users to authenticate, upload PDF documents, digitally sign them using a sleek canvas interface, track signature status, and verify document authenticity.

## Features Implemented 

*   **Premium User Interface**: A modern, glassmorphism-inspired design with dark mode, fluid animations (Framer Motion), and responsive layouts using Tailwind CSS.
*   **Authentication Flow**: Secure user registration and login with JWT integration, protected routes, and automatic token refreshing.
*   **Document Dashboard**: A comprehensive dashboard to view, filter, and manage uploaded documents.
*   **PDF Viewer & Signing**: Integrated PDF rendering (`react-pdf`) and a digital signature pad (`react-signature-canvas`) allowing users to draw and place signatures on their documents securely.
*   **Reusable Signature Library**: Save a signature once, manage it from the signature library, and reuse it when signing future documents.
*   **Signature Verification Interface**: A dedicated page where users or third parties can verify the authenticity of a signed document.
*   **Admin Dashboard & Audit Logs**: Admin users can access system-wide document insights, statistics, and audit logs from the protected admin area.
*   **State Management**: Global state handling via Zustand and server-state caching/synchronization via React Query.
*   **Form Validation**: Robust client-side validation using React Hook Form and Zod schemas.
*   **Toast Notifications**: Elegant real-time feedback using Sonner.

## Technology Stack

*   **Framework**: Next.js 15 (React 19)
*   **Styling**: Tailwind CSS, class-variance-authority, clsx, tailwind-merge
*   **UI Components**: Shadcn UI, Lucide React, Base UI
*   **Animations**: Framer Motion, tw-animate-css, canvas-confetti
*   **State Management**: Zustand
*   **Data Fetching**: Axios, @tanstack/react-query
*   **Form Handling & Validation**: React Hook Form, Zod, @hookform/resolvers
*   **PDF & Canvas**: react-pdf, react-signature-canvas
*   **Language**: TypeScript

## Setup Instructions

Follow these steps to run the frontend application locally:

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Configure Environment Variables**:
    *   Create a `.env.local` file in the root of the frontend project.
    *   Populate it with the required environment variables (see below).
4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.
5.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## Environment Variables

The frontend application relies on the following environment variable to connect to the backend API:

*   `NEXT_PUBLIC_API_BASE_URL`: The URL where the backend API is hosted (e.g., `http://localhost:5000`). If omitted, it defaults to `http://localhost:5000`.

## Default Admin Credentials

Use the following admin account to access the admin dashboard and audit logs in a local or seeded environment:

*   **Email**: `admin@gmail.com`
*   **Password**: `Admin@123`

## Architecture Overview

The frontend architecture follows a modular, feature-based structure within the Next.js App Router paradigm:

*   `src/app/`: Contains the Next.js App Router pages and layouts (`layout.tsx`, `page.tsx`). Handles routing and page-level composition.
*   `src/components/`: Reusable UI components, divided into primitive UI elements (Shadcn components) and complex business components.
*   `src/hooks/`: Custom React hooks for shared logic.
*   `src/lib/`: Core utilities, including the Axios API client (`client.ts`) configured with request and response interceptors for JWT token management.
*   `src/services/`: API service layers that abstract the Axios calls into typed, domain-specific functions (e.g., `document.service.ts`, `auth.service.ts`).
*   `src/store/`: Global state management slices built with Zustand.
*   `src/validators/`: Zod schemas shared across forms for consistent validation.

## Database Design

*(Note: The database is managed entirely by the backend API. Below is a reference to how the frontend conceptualizes the data.)*

The frontend interacts with the following core entities via REST endpoints:
*   **User**: Managed via JWT payloads and the `/api/auth/me` endpoint. Contains user profile and role data.
*   **Document**: Contains metadata such as the Cloudinary URL, document status, ownership, and upload timestamps.
*   **Signature**: A sub-entity of a document containing the metadata of a specific digital signature applied to a PDF.

## API Overview

The frontend communicates with the backend via a centralized Axios instance. Key interactions include:

*   **Authentication**: Interacts with `/api/auth/*` for login, registration, and silent token refreshing (handling 401 Unauthorized responses to transparently rotate tokens).
*   **Document Management**: Uses `/api/documents/*` to upload files (`multipart/form-data`), retrieve document lists, and view specific documents.
*   **Signing Workflow**: Interacts with `/api/documents/:id/sign` to submit base64 signature payloads.
*   **Verification**: Uses `/api/verify` to validate document authenticity.

## Deployment Information

The Next.js application is optimized for deployment on Vercel or any Node.js hosting provider:

1.  Set the `NEXT_PUBLIC_API_BASE_URL` environment variable in your hosting provider's dashboard to point to your production backend URL.
2.  Deploy using the standard Next.js build command (`npm run build`).
3.  On platforms like Vercel, the App Router is automatically optimized for serverless deployment.

## Assumptions Made

*   The user's browser supports modern JavaScript features, the HTML5 Canvas API, and WebGL (for advanced animations/PDF rendering).
*   Authentication is strictly handled via Bearer tokens stored securely in memory and `localStorage`, with the backend managing the actual JWT validation.
*   PDF rendering is performed entirely on the client side using Mozilla's `pdf.js` engine via `react-pdf`.
*   The backend API is configured with appropriate CORS policies to accept requests from the frontend domain.

## Known Limitations

*   **PDF Rendering Performance**: Extremely large or complex PDF files may experience rendering lag on low-end devices due to the client-side `pdf.js` parsing overhead.
*   **Mobile Signature Pad**: While responsive, drawing a signature on very small mobile screens can be less precise than on a tablet or desktop.
*   **Token Storage**: Tokens are stored in `localStorage`, which exposes them to potential XSS vulnerabilities. Moving to HTTP-only cookies on the backend would mitigate this, though the current architecture assumes token refreshing is handled via the Axios interceptor.

## Future Improvements

*   **Server-Side Rendering (SSR) & SEO**: Further leverage Next.js Server Components for public-facing pages (like the landing page and verification page) to improve initial load times and SEO.
*   **Advanced PDF Annotation**: Implement features for dragging and dropping the visual signature exactly where the user wants it on the PDF, rather than appending it or relying on backend placement.
*   **Offline Support**: Implement Service Workers to provide a progressive web app (PWA) experience, allowing users to view cached documents offline.
*   **Localization (i18n)**: Add multi-language support for international users.
*   **E2E Testing**: Integrate Cypress or Playwright to establish end-to-end testing pipelines for critical user flows like signing and authentication.
