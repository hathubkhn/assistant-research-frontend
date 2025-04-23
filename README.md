# Assistant Research Frontend

Frontend application for the Assistant Research project, built with Next.js.

## Features

- Modern user interface with Tailwind CSS
- Authentication with JWT
- Profile management
- Research papers and datasets browsing
- Paper upload and management

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/assistant-research-frontend.git
cd assistant-research-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Project Structure

- `app/`: Next.js app directory containing pages and layouts
- `components/`: Reusable UI components
- `contexts/`: React contexts for state management
- `public/`: Static assets
- `types/`: TypeScript type definitions
- `utils/`: Utility functions and helpers

## Building for Production

```bash
npm run build
# or
yarn build
```

## Deployment

For production deployment:

```bash
npm run build
npm run start
```

Or follow the deployment guides for platforms like Vercel or Netlify. 