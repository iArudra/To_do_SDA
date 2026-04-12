# Todo Master App

A full-stack, feature-rich To-Do application built to manage daily tasks efficiently with a smooth, modern User Interface. This project includes robust authentication, dynamic task tracking, and a simulated premium theme store.

## Tech Stack
- **Frontend**: React.js with Vite (ES6+)
- **Backend**: Python Flask
- **Database**: SQLite
- **Authentication**: JWT/Session-based and Google OAuth Integration

## Features

- **User Authentication**: Secure signup and login mechanisms, including seamless Third-Party authentication using Google OAuth.
- **Task Management**: Create, read, update, and delete (CRUD) operations for your tasks.

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python (3.9 or higher)

### 1. Repository Setup
Clone the repository to your local machine:
```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Frontend Setup
Navigate to the root directory and install frontend dependencies using NPM:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

### 3. Backend Setup
Open a new terminal session and navigate to the backend folder:
```bash
cd backend
```

Create a virtual environment:
```bash
python -m venv venv
```

Activate the virtual environment:
- On Windows: `venv\Scripts\activate`
- On macOS/Linux: `source venv/bin/activate`

Install the backend dependencies:
```bash
pip install -r requirements.txt
```

### 4. Environment Variables
Create a `.env` file in the root project directory based on `.env.example`:
```env
# Example .env configuration
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 5. Start Backend Server
Ensure your virtual environment is activated, then run:
```bash
python app.py
```
*The default port for the backend server is 5000.*

## Security Notes
- The SQLite databases (`.db` files) and environment variable configurations and settings files like `.env` are deliberately ignored in Git to prevent shipping sensitive data to the repository.
- Avoid hardcoding API parameters inside `.jsx` or `.py` files.

## Project Structure
- `/src`: Contains the React/Vite Frontend source code.
- `/backend`: Contains the Python Flask application logic, database helpers, and requirements.
