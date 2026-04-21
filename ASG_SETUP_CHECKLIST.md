# 📋 ASG Setup Checklist for Tomorrow

Follow these steps when you're ready to pick back up. All the code changes in the repository are already finished and saved on your `feature/cloud-storage-asg` branch.

---

### Phase 1: Preparation (Before you start)
1. [ ] **Start RDS**: Go to RDS Console and **Start** your `database-1` instance. Wait 5-10 mins until it says "Available".
2. [ ] **Pull Code**: Ensure your local changes are pushed to GitHub (already done today).
3. [ ] **Credentials**: Keep your RDS Endpoint, Username, and Password handy.

---

### Phase 2: Create the Launch Template
1. [ ] Go to **EC2 → Launch Templates → Create**.
2. [ ] **Image**: Ubuntu 22.04 LTS.
3. [ ] **Instance Type**: t2.micro.
4. [ ] **Security Group**: Use the one with ports 80 and 5000 open.
5. [ ] **User Data** (Advanced Details): Paste this script:

```bash
#!/bin/bash
set -ex

# Setup Docker
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-plugin git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Clone Code (Update with your real repo URL)
cd /home/ubuntu
git clone -b feature/cloud-storage-asg https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git app
cd app

# Create .env (FILL THESE IN!)
cat > .env << 'EOF'
VITE_GOOGLE_CLIENT_ID=<your-id>
RAZORPAY_KEY_ID=<your-id>
RAZORPAY_KEY_SECRET=<your-secret>
VITE_RAZORPAY_KEY_ID=<your-id>
CHACHA20_KEY=<your-chacha20-key>
DB_HOST=database-1.c9aqs8eyskag.ap-south-2.rds.amazonaws.com
DB_PORT=3306
DB_NAME=tododb
DB_USER=admin
DB_PASSWORD=<your-rds-password>
EOF

# Deploy
sudo chmod +x deploy.sh
./deploy.sh
```

---

### Phase 3: Create the ASG
1. [ ] Go to **Auto Scaling Groups → Create**.
2. [ ] Name: `todo-asg`.
3. [ ] Template: Select the one you just created.
4. [ ] **VPC / Subnets**: Select your default VPC and at least 2 subnets (e.g., `2a` and `2b`).
5. [ ] **Group Size**: Set Desired: 1, Min: 1, Max: 3.
6. [ ] **Testing**: Once it launches a new instance, grab its IP and check the app!

---

**See you tomorrow! 🚀**
