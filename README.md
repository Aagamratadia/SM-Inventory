# SM Inventory Management System

A full-stack inventory management system built with Next.js, MongoDB, and NextAuth.js. This application allows businesses to track inventory, manage users with different roles, and maintain an audit trail of item assignments.

## Features

- 🔐 Secure authentication with NextAuth.js
- 👥 Role-based access control (Admin, Staff, User)
- 📦 Inventory management with CRUD operations
- 👤 User management for administrators
- 📝 Assignment tracking with history
- 📊 Excel import/export functionality
- 🎨 Responsive UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React
- **Styling**: Tailwind CSS, Headless UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **Data Handling**: ExcelJS, XLSX

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sm-inventory.git
   cd sm-inventory
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the variables with your MongoDB connection string and NextAuth secret

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## Project Structure

```
sm-inventory/
├── src/
│   ├── app/                    # App router
│   ├── components/             # Reusable components
│   ├── lib/                    # Utility functions
│   ├── models/                 # Database models
│   └── types/                  # TypeScript type definitions
└── public/                     # Static files
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js Documentation
- MongoDB Atlas
- NextAuth.js
- Tailwind CSS
