# 🛡️ Todo App: Security & Operations Guide

This document covers the advanced security features and operational procedures for this application.

## 🔐 Advanced Security Features

### 1. Multi-Factor Authentication (MFA)
- **Implementation**: Time-based One-Time Password (TOTP) using `pyotp`.
- **How to use**: Go to **Settings & Customization (🎨 icon)** -> **Setup MFA**. Scan the QR code with an authenticator app (Google Authenticator, Authy).
- **Enforcement**: Once enabled, subsequent logins will prompt for a 6-digit verification code.

### 2. ChaCha20 Data Encryption
- **Algorithm**: ChaCha20-Poly1305 (Authenticated Encryption).
- **Scope**: 
    - **Tasks**: `text` and `notes` fields.
    - **Users**: `name` and `phone` fields.
- **Master Key**: Defined as `CHACHA20_KEY` in your `.env`. 
- **DB Security**: If the SQLite database is accessed externally, the sensitive fields will appear as scrambled base64 strings.

### 3. Password Hashing
- **Algorithm**: Scrypt/PBKDF2 (via `werkzeug.security`).
- **Migration**: Old plain-text passwords are automatically hashed and updated upon the first successful login.

---

## 🚀 Running the Application

### Path A: Local Development (Fast)
Best for making code changes and immediate testing.

1. **Start Backend**:
   ```bash
   cd backend
   python app.py
   ```
2. **Start Frontend**:
   ```bash
   # In a new terminal
   npm run dev
   ```
3. **Access**: `http://localhost:5173`

---

### Path B: Kubernetes Deployment (Production-like)
Best for testing containerization and persistence in environments like **Kali Linux**.

1. **Initialize Cluster**:
   ```bash
   minikube start --driver=docker
   eval $(minikube docker-env)
   ```
2. **Build Updated Images**:
   ```bash
   # Backend
   docker build -t todo-backend:latest ./backend
   # Frontend
   docker build -t todo-frontend:latest .
   ```
3. **Deploy & Access**:
   ```bash
   kubectl apply -f k8s/
   minikube service todo-frontend-service
   ```

---

## 🛠️ Maintenance & Troubleshooting

### Viewing Local Database
To see the current state of users (and check encryption/hashes), run:
```bash
python backend/dump_db.py
```

### Stopping the Services
- **Local Dev**: Press `Ctrl + C` in the terminal.
- **Kubernetes**: 
    - Remove resources: `kubectl delete -f k8s/`
    - Stop Minikube: `minikube stop`

### Common K8s Issues
- **Backend Error**: If the backend pod fails to start, ensure the volume is mounted to `/app/data` (as configured in the latest `backend-deployment.yaml`) so it doesn't overwrite the application code.
- **Service Not Found**: Make sure to use the correct service name: `todo-frontend-service`.
