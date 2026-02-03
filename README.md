# admin.hotel.com.tn

Admin portal interface for hotel management backoffice.

## How to run locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## How to deploy

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual deployment steps:

1. Build the project:
   ```bash
   npm run build
   ```

2. The build output will be in the `dist/` directory.

3. GitHub Actions will automatically:
   - Build the project
   - Upload the `dist/` directory
   - Deploy to GitHub Pages

### Setting up custom domain

After deployment, you can configure a custom domain (`admin.hotel.com.tn`) in your repository settings:
- Go to Settings > Pages
- Add your custom domain under "Custom domain"
- Configure your DNS settings to point to GitHub Pages

## Tech Stack

- **Vite** - Build tool
- **React** - UI library
- **TypeScript** - Type safety
