# Volunteer Platform Backend

The robust backend API for the Volunteer Platform, providing authentication, opportunity management, and notification services.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Admin Interface**: AdminJS
- **Validation**: Zod
- **Authentication**: JWT & BcryptJS
- **Security**: Helmet, Express Rate Limit, CORS
- **Logging**: Morgan
- **Testing**: Jest

## 📦 Key Features

- **User Management**: Authentication and authorization for volunteers, organizations, and admins.
- **Opportunity System**: CRUD operations for volunteering opportunities, including categories and requirements.
- **Application Tracking**: Seamless application process for volunteers with status updates.
- **Notifications**: Automated notification system for application status changes and new submissions.
- **Admin Dashboard**: Powerful administrative interface via AdminJS for data management.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB instance

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in a `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret
   SESSION_SECRET=your_session_secret
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Scripts

- `npm start`: Run the production server.
- `npm run dev`: Run the server in development mode.
- `npm run lint`: Run ESLint to check code quality.
- `npm test`: Run the test suite.
- `npm run create-admin`: Script to initialize an admin user.

## 📁 Project Structure

- `src/models`: Mongoose schemas.
- `src/controllers`: Request handlers.
- `src/services`: Business logic layer.
- `src/routes`: API endpoints.
- `src/adminjs`: Admin panel configuration.
- `src/utils`: Helper functions and error handling.
