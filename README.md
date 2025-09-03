# Focus Time Manager


A productivity app to help you manage your focus sessions. Built with a Node.js Express backend and a React-based frontend loaded via CDN.

## Features

- Start, pause, and stop focus sessions
- Track session history and statistics
- User authentication
- Responsive UI


## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React (via CDN in `public/index.html`)
- **Styling:** Tailwind CSS (via CDN and CLI for custom builds)
- **Database:** (Add your choice, e.g., MongoDB, PostgreSQL)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

git clone <your-repo-url>

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd focus

# Install dependencies
npm install

# Start the application
npm start
```

The application will be available at `http://localhost:3000`

#### Tailwind CSS

Tailwind is loaded via CDN for instant prototyping. For custom styles, use the CLI:

```bash
npx @tailwindcss/cli -i ./public/input.css -o ./public/output.css --watch
```

Edit `public/input.css` for your custom Tailwind classes. The output is generated in `public/output.css`.


### Development

```bash
# Start with auto-reload
npm run dev

# Run tests
npm test

# Run quick tests
npm run test:quick
```


## Testing

The application includes comprehensive test suites to verify that all file contents are loaded correctly:

### Full Test Suite

Run the complete test suite to verify all functionality:

```bash
npm test
```

This will test:
- ✅ Server accessibility and health
- ✅ HTML content loading and structure
- ✅ API endpoint functionality
- ✅ Static file serving
- ✅ Dependencies and file system access
- ✅ POST request handling
- ✅ Error handling

### Quick Tests

For rapid validation of core functionality:

```bash
npm run test:quick
```

Quick tests verify:
- ✅ Server health endpoint
- ✅ Main page content loading
- ✅ Session type content presence
- ✅ React dependencies loading
- ✅ API analytics endpoint

### Test Results

All tests should pass with 100% success rate. If any tests fail, check:
1. Server is running on port 3000
2. All dependencies are installed
3. File permissions are correct
4. Network connectivity


## .gitignore

The repository includes a `.gitignore` file with rules for Node.js, Express, logs, generated CSS, and environment files. Do **not** ignore `package-lock.json` to ensure consistent dependency management.

## License

MIT

## USEFUL COMMANDS AFTER DEPLOYMENT
===============================================
* Check application status: pm2 status
* View real-time logs: pm2 logs focus-app
* Restart application: pm2 restart focus-app
* View session data: tail -f focus_sessions.log
* Check Caddy status: sudo systemctl status caddy
* Reload Caddy config: sudo systemctl reload caddy
* Export session data: curl https://focus.yourdomain.com/api/export > sessions.json
