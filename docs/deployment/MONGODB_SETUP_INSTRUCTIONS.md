# 🗄️ MongoDB Atlas Setup Instructions

## Step 1: Create MongoDB Atlas Account
1. Go to: https://cloud.mongodb.com/
2. Sign up with your email
3. Create project: "LuxGen-Production"

## Step 2: Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: `luxgen-prod-user`
4. Password: `zDJHaLDnvqtN52nBHcMHS1neH4UwpKF6`
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

## Step 3: Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
4. Click "Confirm"

## Step 4: Create Cluster
1. Go to "Clusters"
2. Click "Create Cluster"
3. Choose "M0 Sandbox" (FREE)
4. Cluster name: "luxgen-cluster"
5. Click "Create Cluster"

## Step 5: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Node.js
4. Version: 4.1 or later
5. Copy connection string and replace:
   - `<username>` with `luxgen-prod-user`
   - `<password>` with `zDJHaLDnvqtN52nBHcMHS1neH4UwpKF6`
   - `<dbname>` with `luxgen`

## Final Connection String:
```
mongodb+srv://luxgen-prod-user:zDJHaLDnvqtN52nBHcMHS1neH4UwpKF6@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority
```
