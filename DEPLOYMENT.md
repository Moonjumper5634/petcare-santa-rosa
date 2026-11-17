# PetCARE production deployment

PetCARE runs as one Java 25 application with a PostgreSQL database. The application
serves both the website and the JSON API used by PetCARE Mobile.

## Free defense pilot

The recommended free pilot uses a Render free Docker web service in Singapore and an
Aiven free PostgreSQL service. Render supplies the public `onrender.com` HTTPS address.
Aiven supplies persistent PostgreSQL storage. Free Render services sleep after 15 minutes of
inactivity, so open the health URL about one minute before a defense demonstration.

1. Create an Aiven free PostgreSQL service and copy its host, port, database, user, and password.
2. Use this JDBC URL in Render:
   `jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require`
3. Put this folder in a private GitHub repository and create a Render Blueprint from it.
4. Enter the JDBC URL, database user, and database password when Render prompts for the
   three secret environment variables declared in `render.yaml`.
5. Confirm `https://SERVICE.onrender.com/api/public/health` returns a status of `UP`.
6. Build the mobile APK with that HTTPS origin as `-ServerUrl`.

The `pilot` Spring profile includes demonstration records and returns verification codes
on screen. It exists for the defense pilot. Switch Render to the `prod` profile after a
real email or SMS verification-code sender and an initial administrator procedure exist.

## Required environment

- A Linux host or container service that supports Docker
- A persistent PostgreSQL volume or managed PostgreSQL database
- An HTTPS hostname; TLS may terminate at the hosting platform or a reverse proxy
- `SPRING_PROFILES_ACTIVE=prod`
- `PETCARE_DB_URL`, `PETCARE_DB_USER`, and `PETCARE_DB_PASSWORD`

## Docker Compose pilot

1. Copy `.env.production.example` to `.env` and replace the database password.
2. Run `docker compose -f compose.production.yml up -d --build`.
3. Put an HTTPS reverse proxy in front of port 8081.
4. Confirm `https://your-host/api/public/health` returns `{"status":"UP","service":"PetCARE"}`.
5. Build the Android APK with `..\petcare-android\build.ps1 -ServerUrl 'https://your-host/'`.

Production uses Flyway migrations automatically and excludes all demonstration accounts
and development endpoints. Back up the `petcare_postgresql` volume before upgrades.
