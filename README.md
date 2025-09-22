
# My Iraqi Doctors - Application PRD

This document outlines the requirements for the "My Iraqi Doctors" application. It can be used as a prompt to generate a new, similar application.

### **App Name**: My Iraqi Doctors

### **Core Concept**:
An offline-first, local-first web application designed for medical representatives in Iraq. It serves as a private, secure, and offline-capable directory for managing information about doctors. All data, including user accounts and doctor profiles, is stored locally in the user's browser, ensuring privacy and functionality without an internet connection. The app integrates advanced AI features to assist with data acquisition and management.

### **Tech Stack**:
*   **Framework**: Next.js 14 with App Router
*   **Language**: TypeScript
*   **UI Components**: ShadCN UI (This is crucial for the design)
*   **Styling**: Tailwind CSS
*   **AI Integration**: Genkit with Google Gemini models (specifically `gemini-1.5-flash-latest`)
*   **Data Storage**: Browser Local Storage (No cloud database is used for user data).

### **Core Features**:

1.  **Offline-First Architecture**:
    *   The entire application is designed to work without an internet connection after the initial load.
    *   All user authentication and doctor data are stored and managed in the browser's local storage.

2.  **Client-Side Authentication & User Roles**:
    *   **User Accounts**: Users can sign up with a username, password, email, and optional phone number.
    *   **Admin Role**: A default super-admin account is pre-created with the username **`HUNTER`** and a password you can specify. This admin cannot be deleted.
    *   **User Approval System**: New users who sign up are placed in a "pending" state. They cannot use the app until an admin approves their account.
    *   **Status Management**: Users can be `active`, `pending`, or `banned` by an admin. Banned users are locked out of the app.

3.  **Admin Dashboard**:
    *   A dedicated panel for administrators to manage all registered users.
    *   **Functionality**:
        *   View all users and their details (username, email, phone, role, status).
        *   Approve pending users.
        *   Activate/Deactivate (ban) users.
        *   Promote users to 'admin' or demote them to 'user'.
        *   Delete users.
        *   Add new users directly (who are 'active' by default).
        *   Edit user details (username, password, email, phone number).

4.  **Doctor Directory Management (CRUD)**:
    *   **Add, Edit, Delete Doctors**: Intuitive forms and dialogs to manage doctor profiles.
    *   **Doctor Data Model**: Each doctor profile should store:
        *   Name, Specialty, Phone Number, Clinic Address.
        *   `isPartner` (boolean flag).
        *   `referralCount` (number).
        *   `mapLocation` (a Google Maps URL).
        *   `availableDays` (an array of strings like 'Sat', 'Sun', etc.).
        *   Detailed referral case notes (an array of objects, each with patient name, date, test type, age, chronic diseases).
    *   **View Modes**: Users can toggle between a `Grid View` (showing detailed cards) and a `List View` (a compact table).
    *   **Search & Filtering**: A main search bar to filter doctors by name, specialty, or address. An option to filter and show only 'Partner' doctors.
    *   **Sorting**: Sort doctors by Name, Date Added, or Address.

5.  **Partner & Referral Management**:
    *   **Partner Dashboard**: A dedicated full-screen dialog to view all "Partner" doctors, see their referral counts, and quickly edit referrals.
    *   **Commission Calculation**: The UI should display a calculated commission (e.g., `referralCount * 100 USD`).
    *   **Referral Case Notes**: A detailed, full-screen dialog for each doctor to add/edit/delete specific notes for each referral case. This is crucial for tracking patient details.
    *   **Export to Excel**: The Partner Dashboard and the Referral Case Notes dialog must have a feature to export the current data to an `.xlsx` file.

6.  **Data Portability**:
    *   **Backup Data**: A feature to export the entire doctor list into a single encrypted `.json` file.
    *   **Restore Data**: A feature to import a previously backed-up `.json` file, restoring the user's entire doctor list.

### **AI-Powered Features (using Genkit and Gemini)**:

1.  **AI Doctor Discovery**:
    *   An "Internet Search" feature where the user can type a query (e.g., "cardiologists in Baghdad").
    *   The AI performs a web search and returns a structured list of potential doctors (name, specialty, address, phone).
    *   The user can then review the AI-generated list and add doctors to their main directory with a single click.

2.  **AI Chat Assistant**:
    *   A built-in chatbot that acts as a "Medical Assistant".
    *   Users can ask medical-related questions, and the AI provides helpful answers.

3.  **Bulk AI Translation**:
    *   A "Translate All" button in the header.
    *   When clicked, the AI translates the `name`, `specialty`, and `address` fields of *all* doctors in the list to Arabic.

### **User Interface and Experience (UI/UX)**:

*   **Modern Design**: Use ShadCN UI components for a clean, professional, and modern look.
*   **Responsive**: The layout must be fully responsive and work seamlessly on desktop and mobile devices.
*   **Multi-Language Support**: The entire UI must support both English and Arabic, including Right-to-Left (RTL) layout for Arabic. A toggle in the user menu should switch between languages.
*   **Dark/Light Mode**: A theme toggle (Light, Dark, System) should be available.
*   **User-Friendly Dialogs**: All forms and actions (add/edit, search, dashboards) should happen in full-screen or large modal dialogs to maintain context.
*   **Toasts & Feedback**: Use toast notifications to provide clear feedback for actions like saving, deleting, importing/exporting, and errors.
*   **Loading States**: Implement skeletons and loaders to provide a smooth experience during data fetching or AI processing.
*   **Main Header**: The header is a central control hub containing the "Add Doctor" button, search bar, and a user menu with access to all key features (language/theme switching, data management, AI tools, admin panel, etc.).
