# Shinigami House - Production Deployment Guide

This guide describes how to deploy the property management system in a production-ready intranet environment.

## 1. Quick Start (Docker Compose)
This is the recommended method. It compiles the frontend and backend, then runs the app using standard `node`.

1. Ensure Docker and Docker Compose are installed.
2. Open `docker-compose.yml` and replace the placeholders:
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
3. Run the following command:
   ```bash
   docker compose up -d --build
   ```
4. Access the application at `http://localhost:3000` or `http://<your-server-ip>:3000`.

## 2. Manual Installation (Bare Metal)
If you are not using Docker:

1. Install Node.js (v20+).
2. Install dependencies: `npm install`
3. Build the full app: `npm run build`
4. Create a `.env` file based on `.env.example`.
5. Start the production server: `npm run start`

## 3. Persistent Data
Data is preserved in two locations:
- **Database**: Saved in `/app/data/shinigami.db`. In Docker, this is the `shinigami_db_data` volume.
- **Uploads**: Saved in `/app/uploads/`. In Docker, this is the `shinigami_file_uploads` volume.

## 4. Troubleshooting
- **Logs**: View application logs with `docker compose logs -f`.
- **Database Access**: You can open the `shinigami.db` file with any SQLite browser.
- **Port Conflicts**: If port 3000 is taken, change the mapping in `docker-compose.yml` (e.g., `"8080:3000"`).

## 5. Security Checklist
- [ ] Change `JWT_SECRET` to a long random string.
- [ ] Change `ADMIN_PASSWORD` from the initial setup.
- [ ] Ensure `INTRANET_MODE=true` if internet isolation is required.
- [ ] Regularly backup the `shinigami_db_data` volume content.
