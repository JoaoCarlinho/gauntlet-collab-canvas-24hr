# CollabCanvas Testing Guide

This guide explains how to run Cypress tests locally to demonstrate the success of user stories.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+ (for backend)
- npm or yarn

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd backend
python3 run.py
# Server should start on http://localhost:5000
```

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
# Server should start on http://localhost:3000
```

### 3. Run Tests

**Terminal 3 - Run Cypress Tests:**
```bash
cd frontend

# Interactive mode (recommended for development)
npm run test:e2e:local

# Headless mode (for CI/CD)
npm run test:e2e:local:headless

# Run only user story tests
npm run test:user-stories

# Open user story tests in interactive mode
npm run test:user-stories:open
```

## 📋 User Stories Covered

The test suite covers the following user stories:

### Authentication
- **US-001**: Sign in with Google
- **US-002**: Sign out of application

### Canvas Management
- **US-003**: Create new canvas with title and description
- **US-004**: View list of all canvases
- **US-005**: Open canvas for editing
- **US-006**: Delete owned canvas

### Canvas Editing
- **US-007**: Add shapes (rectangle, circle)
- **US-008**: Add text to canvas
- **US-009**: Select and move objects
- **US-010**: Delete objects from canvas

### Real-time Collaboration
- **US-011**: See when other users are online
- **US-012**: See other users' cursors in real-time
- **US-013**: See changes made by other users in real-time

### Canvas Sharing
- **US-014**: Make canvas public
- **US-015**: Invite other users to collaborate

### Performance and UX
- **US-016**: Use keyboard shortcuts
- **US-017**: Undo and redo actions
- **US-018**: See loading indicators

## 🛠️ Test Configuration

### Local Development
- Uses `cypress.config.local.ts`
- Points to `http://localhost:3000` (frontend)
- Mocks authentication and WebSocket connections
- Optimized for local development

### Production Testing
- Uses `cypress.config.ts`
- Can be configured for production URLs
- Real authentication and WebSocket connections

## 🎯 Running Specific Tests

### Run All Tests
```bash
npm run test:e2e:local:headless
```

### Run User Story Tests Only
```bash
npm run test:user-stories
```

### Run Specific Test File
```bash
npx cypress run --spec "cypress/e2e/canvas.cy.ts" --config-file cypress.config.local.ts
```

### Run Tests with Video Recording
```bash
npx cypress run --config-file cypress.config.local.ts --record --key YOUR_RECORD_KEY
```

## 🔧 Custom Commands

The test suite includes custom Cypress commands:

- `cy.login()` - Mock user authentication
- `cy.createCanvas(title, description)` - Create a new canvas
- `cy.mockWebSocket()` - Mock WebSocket connections
- `cy.mockFirebaseAuth()` - Mock Firebase authentication
- `cy.waitForCanvasLoad()` - Wait for canvas to fully load

## 📊 Test Reports

### View Test Results
After running tests, you can view:
- Screenshots of failed tests in `cypress/screenshots/`
- Videos of test runs in `cypress/videos/`
- Console output in the terminal

### Generate HTML Report
```bash
npx cypress run --config-file cypress.config.local.ts --reporter html
```

## 🐛 Troubleshooting

### Common Issues

**1. Tests fail with "Cannot connect to server"**
- Ensure backend server is running on port 5000
- Check that frontend server is running on port 3000

**2. Authentication tests fail**
- The tests use mocked authentication
- Ensure `cy.login()` is called in `beforeEach`

**3. WebSocket tests fail**
- The tests mock WebSocket connections
- Ensure `cy.mockWebSocket()` is called if needed

**4. Canvas tests fail**
- Ensure the canvas components have proper `data-testid` attributes
- Check that the canvas API endpoints are working

### Debug Mode
Run tests in debug mode to see detailed information:
```bash
npx cypress open --config-file cypress.config.local.ts
```

## 📝 Adding New Tests

### 1. Create Test File
```bash
touch cypress/e2e/new-feature.cy.ts
```

### 2. Add Test Structure
```typescript
describe('New Feature', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/')
  })

  it('should test new functionality', () => {
    // Test implementation
  })
})
```

### 3. Add Custom Commands (if needed)
Add to `cypress/support/commands.ts`:
```typescript
Cypress.Commands.add('newCommand', () => {
  // Command implementation
})
```

## 🎥 Demo Script

For demonstrating the application:

1. **Start both servers** (backend and frontend)
2. **Run user story tests**: `npm run test:user-stories:open`
3. **Show test execution** in Cypress interactive mode
4. **Highlight key features** as tests run:
   - Authentication flow
   - Canvas creation and management
   - Real-time collaboration features
   - Canvas editing tools

## 📈 Continuous Integration

For CI/CD pipelines, use:
```bash
npm run test:e2e:local:headless
```

This runs all tests in headless mode without opening the browser, perfect for automated testing.

