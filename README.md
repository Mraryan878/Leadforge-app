# Leadforge App

A modern business management and sales pipeline application built with Next.js, Prisma, and NextAuth. Manage your business leads, track sales stages, and monitor performance metrics in one unified platform.

## Features

- **Business Management**: Create, edit, and manage business leads with comprehensive information
- **Sales Pipeline**: Organize and track businesses through customizable sales stages
- **Stage History**: Monitor the complete history of stage transitions for each business
- **Notes & Collaboration**: Add and manage notes for each business entry
- **Admin Dashboard**: User management and administrative controls
- **Performance Metrics**: Real-time dashboard with key statistics and insights
- **Authentication**: Secure login with NextAuth integration
- **API-First Architecture**: RESTful APIs for all core functionality

## Tech Stack

- **Frontend**: Next.js 14+ with React
- **Styling**: CSS (globals.css)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Language**: TypeScript
- **Build Tools**: ESLint, PostCSS

## Project Structure

```
leadforge/
├── app/
│   ├── api/                 # API routes
│   ├── admin/              # Admin pages
│   ├── businesses/         # Business management pages
│   ├── dashboard/          # Dashboard pages
│   ├── login/              # Authentication
│   ├── pipeline/           # Sales pipeline
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable React components
├── lib/                    # Utility functions and helpers
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.js             # Database seeding
│   └── migrations/         # Database migrations
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mraryan878/Leadforge-app.git
   cd Leadforge-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=your_database_url
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

## Getting Started

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Login**
   Use your configured authentication credentials to access the application

## API Endpoints

### Businesses
- `GET /api/businesses` - List all businesses
- `POST /api/businesses` - Create a new business
- `GET /api/businesses/[id]` - Get business details
- `PUT /api/businesses/[id]` - Update business
- `DELETE /api/businesses/[id]` - Delete business

### Business Notes
- `GET /api/businesses/[id]/notes` - List notes for a business
- `POST /api/businesses/[id]/notes` - Create a note
- `PUT /api/businesses/[id]/notes/[noteId]` - Update note
- `DELETE /api/businesses/[id]/notes/[noteId]` - Delete note

### Pipeline Stages
- `GET /api/businesses/[id]/stage` - Get current stage
- `PUT /api/businesses/[id]/stage` - Update stage

### Stage History
- `GET /api/businesses/[id]/history` - Get stage history

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Database Schema

The application uses Prisma ORM with the following main models:
- **User**: System users and administrators
- **Business**: Business leads and company information
- **Pipeline Stage**: Sales pipeline stages
- **Stage History**: Historical records of stage transitions
- **Note**: Business-related notes and comments

See `prisma/schema.prisma` for the complete schema.

## Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For issues, questions, or feedback, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js and Prisma**
