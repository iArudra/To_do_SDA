# AWS Infrastructure Guide: RDS MySQL + ASG

This guide walks you through setting up the cloud infrastructure for the TODO app — a **standard AWS RDS MySQL** database and an **Auto Scaling Group (ASG)** for EC2 instances.

---

## Architecture Overview

```
Internet
   │
   ▼
EC2 Instance(s) — Auto Scaling Group (1–3 instances)
   ├── Frontend  (Nginx,          Port 80)
   └── Backend   (Flask/Gunicorn, Port 5000)
              │
              │ Username + Password (Port 3306)
              ▼
   AWS RDS MySQL
   (Persistent, shared by all instances)
```

---

## Step 1: Create RDS MySQL Instance

1. Go to **AWS Console → RDS → Create Database**.
2. Choose:
   - **Engine**: MySQL
   - **Template**: Free Tier
   - **DB Instance Identifier**: `todo-app-db`
   - **Master Username**: `admin` (or your choice)
   - **Master Password**: Set a strong password
   - **Instance Class**: `db.t3.micro`
   - **Storage**: 20 GB (default)
3. Under **Connectivity**:
   - **Public access**: **Yes**
   - **VPC Security Group**: Create new or use existing — must allow **port 3306 inbound** from `0.0.0.0/0`
4. Under **Additional Configuration**:
   - **Initial database name**: `tododb`
5. Click **Create Database** and wait ~5 minutes.

### Note your details
Once available, go to the instance and copy:
| Field | Where to find |
|---|---|
| **Endpoint** | Connectivity & security tab |
| **Port** | 3306 |
| **Username** | `admin` (what you set) |
| **Password** | What you set |
| **DB Name** | `tododb` |

---

## Step 2: Update Your `.env`

Add these to your `.env` on the EC2:
```dotenv
DB_HOST=todo-app-db.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=tododb
DB_USER=admin
DB_PASSWORD=your-password-here
```

---

## Step 3: Create a Launch Template

1. Go to **EC2 → Launch Templates → Create Launch Template**.
2. Settings:
   - **Name**: `todo-app-template`
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance Type**: `t2.micro` or `t3.small`
   - **Key Pair**: Your existing key pair
   - **Security Group**: Allow inbound on:
     - Port `22`   — SSH from your IP
     - Port `80`   — HTTP from `0.0.0.0/0`
     - Port `5000` — API from `0.0.0.0/0`

3. Under **Advanced Details → User Data**, paste this script (fill in your real values):

```bash
#!/bin/bash
set -e

# Install Docker
apt-get update -y
apt-get install -y docker.io docker-compose-plugin git
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# Clone the project
cd /home/ubuntu
git clone -b feature/cloud-storage-asg https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git app
cd app

# Write .env
cat > .env << 'EOF'
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
VITE_RAZORPAY_KEY_ID=<your-razorpay-key-id>
CHACHA20_KEY=<your-chacha20-key>
DB_HOST=todo-app-db.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=tododb
DB_USER=admin
DB_PASSWORD=<your-db-password>
EOF

# Deploy
chmod +x deploy.sh
bash deploy.sh
```

4. Click **Create Launch Template**.

---

## Step 4: Create the Auto Scaling Group (ASG)

1. Go to **EC2 → Auto Scaling Groups → Create Auto Scaling Group**.
2. Settings:
   - **Name**: `todo-app-asg`
   - **Launch Template**: `todo-app-template` (Latest)
3. **Network**:
   - **VPC**: Default VPC
   - **Availability Zones**: Select 2+ (e.g. `us-east-1a`, `us-east-1b`)
4. **Group Size**:
   | Setting | Value |
   |---|---|
   | Desired capacity | 1 |
   | Minimum capacity | 1 |
   | Maximum capacity | 3 |
5. **Scaling Policy** (optional):
   - Type: **Target Tracking**
   - Metric: **CPU Utilization**
   - Target: **50%**
6. Click **Create Auto Scaling Group**.

---

## Step 5: Verify Everything Works

### Test RDS from EC2
```bash
# SSH into the instance launched by ASG
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

cd ~/app
python3 backend/check_rds.py
```

Expected output:
```
[OK]   Connected successfully!
       MySQL Version: 8.x.x
[INFO] No tables yet in 'tododb' — created when backend starts.
[DONE] RDS MySQL is reachable and healthy. ✓
```

### Check the app
```
http://<EC2_PUBLIC_IP>        ← Frontend
http://<EC2_PUBLIC_IP>:5000/  ← Backend health
```

### Self-Healing Test
1. **Terminate** the EC2 instance manually.
2. ASG detects it and launches a replacement in ~1 minute.
3. New instance reconnects to **same RDS** — no data loss.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Connection refused on port 3306` | RDS Security Group missing inbound rule for port 3306 |
| `Access denied for user` | Wrong `DB_USER` or `DB_PASSWORD` in `.env` |
| `Unknown database 'tododb'` | RDS was created without initial DB name — create it manually (see below) |
| `Can't connect to host` | `DB_HOST` is wrong, or RDS is not publicly accessible |

### Create the database manually (if needed)
If you forgot to set an initial DB name during RDS creation:
```bash
# From EC2 or any machine with mysql client
mysql -h <DB_HOST> -u admin -p
# Enter your password, then run:
CREATE DATABASE tododb;
EXIT;
```
