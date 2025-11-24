<h2> KVSHS Admin Portal - Electron, Vite & React </h2>
<div align="center">
  A modern, cross-platform desktop application for school administration, built with Electron, Vite, React, TypeScript, Tailwind CSS, and Supabase. Features secure authentication, automated email notifications, and PDF report generation.
</div>
<br>
<p align="center">
  <a href="https://www.electronjs.org/">
    <img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  </a>
  <a href="https://vitejs.dev/">
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  </a>
  <a href="https://reactjs.org/">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  </a>
  <a href="https://supabase.com/">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  </a>
  <a href="https://www.npmjs.com/package/bcryptjs">
    <img src="https://img.shields.io/badge/BcryptJS-546E7A?style=for-the-badge&logo=npm&logoColor=white" alt="BcryptJS">
  </a>
  <a href="https://www.emailjs.com/">
    <img src="https://img.shields.io/badge/EmailJS-FCA253?style=for-the-badge&logo=gmail&logoColor=white" alt="EmailJS">
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API">
    <img src="https://img.shields.io/badge/HTML_Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML Canvas">
  </a>
  <a href="https://github.com/parallax/jsPDF">
    <img src="https://img.shields.io/badge/jsPDF-DC143C?style=for-the-badge&logo=npm&logoColor=white" alt="jsPDF">
  </a>
</p>

<p align="center">
<a href="#about-the-project">About The Project</a> •
<a href="#getting-started">Getting Started</a> •
<a href="#usage">Usage</a> •
<a href="#license">License</a>
</p>

<!-- <div align="center">
  <img src="[YOUR_SCREENSHOT_URL_HERE]" alt="Project Screenshot" width="80%">
</div> -->

<h3>About The Project</h3>
This project is a desktop admin dashboard for KVSHS. It uses modern web technologies (Vite, React, Tailwind) wrapped in an Electron container to create a cross-platform desktop experience. It connects to a Supabase backend for all data and authentication.

<h3>Built With</h3>
This project was built using the following technologies:

- [Electron.js](https://www.electronjs.org/): For building the native desktop application.
- [Vite](https://vitejs.dev/): As the frontend build tool and development server.
- [React](https://reactjs.org/): For building the user interface.
- [TypeScript](https://www.typescriptlang.org/): For static typing.
- [Tailwind CSS](https://tailwindcss.com/): For utility-first styling.
- [Supabase](https://supabase.com/): For the database and authentication backend.
- [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/): For generating and downloading PDF reports.
- [EmailJS](https://www.emailjs.com/): For sending automated email notifications.
- [BcryptJS](https://github.com/dcodeIO/bcrypt.js): For secure password hashing.

<h3>Getting Started</h3>
To get a local copy up and running, please follow these simple steps.

<h3>Prerequisites</h3>

Ensure you have Node.js installed on your system.

- [Node.js (LTS)](https://nodejs.org/en/download/)

After installation, verify that `node` and `npm` are available in your terminal:

```bash
node -v
npm -v
```

<h3>Installation</h3>

**1. Clone the Repository**

```
git clone https://github.com/jomeljomel01/kvshs-enrollment-management
cd kvshs-enrollment-management
```

**2. Install NPM Packages**

This will install Electron and all other necessary development dependencies.

```
npm install
```

**Key Dependencies Installation** If you are setting this project up from scratch or need to add these specific features manually, use the commands below. _Note: If you ran `npm install` above, these are already installed._

- **EmailJS** (For sending emails via client-side):
```
npm install @emailjs/browser
```
- **BcryptJS** (For password hashing/security):
```
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```
- **HTML Canvas & PDF Generation** (For generating downloadable reports):
```
npm install html2canvas jspdf
```

**3. Set Up Environment Variables**

This project requires a connection to a Supabase database.

1. Find the .env file in the root of the project. (If it's missing, you may need to create it).

2. Open it and add the required Supabase API credentials:

```
# For Vite/React Frontend
VITE_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
VITE_MY_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# For Electron Main Process (Backend)
SUPABASE_URL=YOUR_SUPABASE_URL_HERE
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=YOUR_EMAILJS_SERVICE_ID_HERE
VITE_EMAILJS_TEMPLATE_ID=YOUR_EMAILJS_TEMPLATE_ID_HERE
VITE_EMAILJS_PUBLIC_KEY=YOUR_EMAILJS_PUBLIC_KEY_HERE
```

**Note:** The application will not be able to log in or fetch data without these keys.

<h3>Usage</h3>

To run the application in development mode, use the following command:

```
npm run electron:dev
```

This command will automatically:

1.  Start the Vite development server for the React UI.
2.  Launch the Electron desktop application, which will load the UI.

### Building for Production

This project uses **Electron Forge** to build and package the application for distribution.

**1. First-Time Setup (if not already done)**

If you haven't set up Electron Forge for this project yet, run the following commands:

```bash
# Install the Electron Forge CLI
npm install --save-dev @electron-forge/cli

# Import the project into Electron Forge
npx electron-forge import
```

**2. Build and Package**

To create a distributable package, run the following commands in order:

```bash
# First, build the React frontend
npm run build

# Then, package the Electron app
npm run make
```

This will generate an `out` folder containing the packaged application for your operating system (e.g., `out/student-management-electron-win32-x64` for Windows).

**3. Post-Build Configuration**

For the packaged application to connect to the Supabase backend, you **must** manually copy your `.env` file from the project root into the final application directory.

For example, on a 64-bit Windows build, copy the `.env` file to:
`out\student-management-electron-win32-x64\`

The application will not function correctly without this step.

<h3>License</h3>

Distributed under the MIT License. See `LICENSE` for more information.
