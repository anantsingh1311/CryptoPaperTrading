# Crypto Paper Trading Deployment

Deployment-only copy of the local React and Spring Boot microservices project.

- Frontend: Vercel
- Auth and portfolio services: Render
- Database: Render PostgreSQL

The deployment copy contains no local database password, JWT secret, or market API key.
Render generates the shared JWT secret and supplies the database connection at deploy time.

The free Render services sleep after inactivity, so the first request can take longer.
The free Render PostgreSQL database expires after 30 days unless upgraded or replaced.
