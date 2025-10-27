### Least-Privilege DB Roles Setup Guide

**Purpose**: Separate database permissions for migrations (DDL) vs runtime operations (DML)  
**Security Benefit**: Limits blast radius if application credentials are compromised

---

## 🎯 Overview

Instead of using one superuser for everything:
- ✅ **`neonhub_migrate`**: DDL operations (CREATE TABLE, ALTER, etc.) - CI/CD only
- ✅ **`neonhub_app`**: DML operations (SELECT, INSERT, UPDATE, DELETE) - Runtime only

---

## 📝 One-Time Setup (Run on Cloud Database)

### Step 1: Connect as Superuser

```bash
# For Neon
psql "postgresql://neondb_owner:PASSWORD@ep-xxx.neon.tech:5432/neondb?sslmode=require"

# For local
psql "postgresql://postgres:postgres@localhost:5433/neonhub"
```

### Step 2: Create Roles

```sql
-- Migration role (DDL)
CREATE ROLE neonhub_migrate 
  NOINHERIT 
  LOGIN 
  PASSWORD 'STRONG_PASSWORD_HERE_1';

-- Application runtime role (DML only)
CREATE ROLE neonhub_app 
  NOINHERIT 
  LOGIN 
  PASSWORD 'STRONG_PASSWORD_HERE_2';
```

**Important**: Use strong, unique passwords for each role!

### Step 3: Grant Minimal Permissions to Runtime User

```sql
-- Allow connection
GRANT CONNECT ON DATABASE neondb TO neonhub_app;

-- Allow schema access
GRANT USAGE ON SCHEMA public TO neonhub_app;

-- Allow data operations on existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neonhub_app;

-- Allow sequence operations (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neonhub_app;

-- Apply to future tables automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO neonhub_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO neonhub_app;
```

### Step 4: Grant Migration Permissions

```sql
-- Allow DDL operations
GRANT CREATE ON SCHEMA public TO neonhub_migrate;

-- Allow full control over objects for migrations
GRANT ALL PRIVILEGES ON SCHEMA public TO neonhub_migrate;

-- Apply to all existing objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO neonhub_migrate;

-- Apply to future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON TABLES TO neonhub_migrate;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO neonhub_migrate;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON FUNCTIONS TO neonhub_migrate;
```

### Step 5: Verify Permissions

```sql
-- Check roles exist
SELECT rolname, rolsuper, rolcreatedb, rolcanlogin 
FROM pg_roles 
WHERE rolname LIKE 'neonhub%';

-- Check table permissions for neonhub_app
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE grantee = 'neonhub_app' 
  AND table_schema = 'public'
LIMIT 10;

-- Check schema permissions for neonhub_migrate
SELECT nspname, nspacl 
FROM pg_namespace 
WHERE nspname = 'public';
```

---

## 🔧 Configure Environment Variables

### For CI/CD (GitHub Actions)

Use **`neonhub_migrate`** role in GitHub secrets:

```bash
# GitHub → Settings → Secrets → Actions

# For migrations
DATABASE_URL=postgresql://neonhub_migrate:STRONG_PASSWORD_HERE_1@ep-xxx.neon.tech:5432/neondb?sslmode=require

# For direct connections (if needed)
DIRECT_DATABASE_URL=postgresql://neonhub_migrate:STRONG_PASSWORD_HERE_1@ep-xxx.neon.tech:5432/neondb?sslmode=require
```

### For Runtime (Railway, Render, etc.)

Use **`neonhub_app`** role for application:

```bash
# Railway → Variables / Render → Environment

# Runtime database URL (limited permissions)
DATABASE_URL=postgresql://neonhub_app:STRONG_PASSWORD_HERE_2@ep-xxx.neon.tech:5432/neondb?sslmode=require

# Same for direct connection
DIRECT_DATABASE_URL=postgresql://neonhub_app:STRONG_PASSWORD_HERE_2@ep-xxx.neon.tech:5432/neondb?sslmode=require
```

### For Local Development

Use **`neonhub_migrate`** locally (you need both DDL and DML):

```bash
# .env (local only)
DATABASE_URL=postgresql://neonhub_migrate:STRONG_PASSWORD_HERE_1@localhost:5433/neonhub
```

---

## 🧪 Test the Setup

### Test Migration Role (CI/CD)

```bash
export DATABASE_URL="postgresql://neonhub_migrate:PASSWORD@host/db"

# Should work: Create table
psql "$DATABASE_URL" -c "CREATE TABLE test_table (id serial primary key);"

# Should work: Insert data
psql "$DATABASE_URL" -c "INSERT INTO test_table DEFAULT VALUES;"

# Should work: Drop table
psql "$DATABASE_URL" -c "DROP TABLE test_table;"
```

### Test Application Role (Runtime)

```bash
export DATABASE_URL="postgresql://neonhub_app:PASSWORD@host/db"

# Should work: Select data
psql "$DATABASE_URL" -c "SELECT * FROM users LIMIT 1;"

# Should work: Insert data
psql "$DATABASE_URL" -c "INSERT INTO users (email, name) VALUES ('test@example.com', 'Test');"

# Should FAIL: Create table (permission denied)
psql "$DATABASE_URL" -c "CREATE TABLE test_table (id serial primary key);"
# Error: permission denied for schema public
```

---

## 🔐 Security Benefits

### Without Least Privilege (Bad)
- ❌ Application uses superuser credentials
- ❌ SQL injection could DROP entire database
- ❌ Compromised app = full database control
- ❌ No audit trail separation

### With Least Privilege (Good)
- ✅ Application cannot modify schema
- ✅ SQL injection limited to data tampering
- ✅ Compromised app = limited damage
- ✅ Clear audit trail (app vs migration)

---

## 📊 Permissions Matrix

| Operation | neonhub_app (Runtime) | neonhub_migrate (CI/CD) |
|-----------|----------------------|------------------------|
| SELECT | ✅ Yes | ✅ Yes |
| INSERT | ✅ Yes | ✅ Yes |
| UPDATE | ✅ Yes | ✅ Yes |
| DELETE | ✅ Yes | ✅ Yes |
| CREATE TABLE | ❌ No | ✅ Yes |
| ALTER TABLE | ❌ No | ✅ Yes |
| DROP TABLE | ❌ No | ✅ Yes |
| CREATE INDEX | ❌ No | ✅ Yes |
| CREATE FUNCTION | ❌ No | ✅ Yes |
| CREATE EXTENSION | ❌ No | ✅ Yes (if superuser) |

---

## 🔄 Rotation Schedule

### Quarterly Rotation (Recommended)

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update password
psql "postgresql://superuser@host/db" \
  -c "ALTER ROLE neonhub_app PASSWORD '$NEW_PASSWORD';"

# 3. Update secrets in:
# - GitHub Actions (if runtime there)
# - Railway/Render environment variables
# - Local .env (team members)

# 4. Verify app still works
curl https://api.your-domain.com/api/health

# 5. Repeat for neonhub_migrate
```

---

## 🆘 Troubleshooting

### Error: "permission denied for schema public"

**Cause**: App is trying to do DDL operations  
**Fix**: Use `neonhub_migrate` role for migrations, `neonhub_app` for runtime

### Error: "role 'neonhub_app' does not exist"

**Cause**: Roles not created yet  
**Fix**: Run Step 2 (Create Roles) as superuser

### Error: "password authentication failed"

**Cause**: Wrong password in DATABASE_URL  
**Fix**: 
1. Verify password in SQL: `SELECT rolname FROM pg_roles WHERE rolname = 'neonhub_app';`
2. Reset if needed: `ALTER ROLE neonhub_app PASSWORD 'new_password';`

### Migrations fail with "permission denied"

**Cause**: Using `neonhub_app` role for migrations  
**Fix**: GitHub secrets should use `neonhub_migrate` role

### App can't read data after migration

**Cause**: New tables not granted to `neonhub_app`  
**Fix**: Re-run Step 3 (Grant Minimal Permissions) to apply to new tables

---

## 📚 Further Reading

- [PostgreSQL Roles Documentation](https://www.postgresql.org/docs/current/user-manag.html)
- [GRANT Documentation](https://www.postgresql.org/docs/current/sql-grant.html)
- [ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html)
- [Neon Security Best Practices](https://neon.tech/docs/security/security-overview)

---

## ✅ Checklist

- [ ] Created `neonhub_migrate` role
- [ ] Created `neonhub_app` role
- [ ] Granted permissions to both roles
- [ ] Updated GitHub Actions secrets (migrate role)
- [ ] Updated runtime environment (app role)
- [ ] Tested migration role (can create tables)
- [ ] Tested app role (cannot create tables)
- [ ] Documented passwords in secure vault (1Password, etc.)
- [ ] Set calendar reminder for quarterly rotation

---

**Created**: 2025-10-27  
**Owner**: DevOps Team  
**Next Review**: 2026-01-27

