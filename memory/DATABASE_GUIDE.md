# Schooltino - Database & Production Setup Guide

## Current Setup (Preview/Testing)

```
Location: Emergent Preview Server
Database: MongoDB (Local)
URL: mongodb://localhost:27017
DB Name: test_database
```

⚠️ **Note:** Preview environment is for testing. For real schools, use production database.

---

## Production Database Options

### Option 1: MongoDB Atlas (Recommended) ⭐

**Why Atlas?**
- Free tier available (512MB)
- Auto backups
- 99.99% uptime
- Easy setup

**Pricing:**
| Plan | Storage | Price |
|------|---------|-------|
| Free (M0) | 512MB | ₹0 |
| Shared (M2) | 2GB | ~₹700/month |
| Shared (M5) | 5GB | ~₹1800/month |
| Dedicated | 10GB+ | ~₹5000+/month |

**Setup Steps:**
1. Go to: https://www.mongodb.com/atlas
2. Create free account
3. Create cluster (choose Mumbai region)
4. Get connection string
5. Update MONGO_URL in backend/.env

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/schooltino_prod
DB_NAME=schooltino_production
```

---

### Option 2: Self-Hosted (DigitalOcean/AWS)

**DigitalOcean Droplet:**
- $6/month (₹500) - 1GB RAM
- $12/month (₹1000) - 2GB RAM

**AWS EC2:**
- t2.micro free for 1 year
- t2.small ~₹1500/month

---

## Data Migration (Preview → Production)

When ready to move to production:

```bash
# Export from preview
mongodump --uri="mongodb://localhost:27017" --db=test_database --out=backup/

# Import to Atlas
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net" --db=schooltino_prod backup/test_database/
```

---

## Backup Strategy

### Daily Automatic Backup:
MongoDB Atlas includes automatic backups.

### Manual Backup Script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="$MONGO_URL" --out=/backups/schooltino_$DATE
```

---

## Data Collections to Backup

Critical Collections:
- schools
- students
- users
- fee_payments
- fee_receipts
- fee_structures
- student_schemes
- exams
- exam_results
- attendance

---

## Security Checklist

- [ ] Use strong database password
- [ ] Enable IP whitelist in Atlas
- [ ] Use SSL/TLS connection
- [ ] Regular backups enabled
- [ ] Environment variables secured
