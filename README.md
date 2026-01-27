This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# All Soccer Predictions

AI-powered soccer prediction feedback platform.
https://all-soccer-prredictions-agzd.onrender.com

## 📹 Project Demo

[Watch the Loom demo here](https://www.loom.com/share/c5abc80401564797a171832623384c1d)

## Features

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for local Postgres/Redis)
- Yarn or npm

### Setup
1. Clone the repository:
	```sh
	git clone https://github.com/pushthev1be/all-soccer-prredictions.git
	cd all-soccer-prredictions
	```
2. Install dependencies:
	```sh
	npm install
	# or
	yarn install
	```
3. Copy `.env.example` to `.env` and fill in your environment variables (see below).
4. Start Docker services:
	```sh
	docker-compose up -d
	```
5. Run database migrations:
	```sh
	npx prisma migrate deploy
	# or
	npx prisma db push
	```
6. Start the development server:
	```sh
	npm run dev
	# or
	yarn dev
	```

## Environment Variables
- `DATABASE_URL` (Postgres connection string)
- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` (SMTP credentials)
- `NEXTAUTH_SECRET` (NextAuth secret)

## Scripts
- `dev` - Start Next.js in development
- `build` - Build for production
- `start` - Start production server

## License
MIT
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
