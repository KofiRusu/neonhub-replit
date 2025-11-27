# Production Domain Configuration

**Primary Domain:** neonhubecosystem.com  
**Serves:** neonhub.com (redirect)

---

## 🌐 DNS Configuration

### Main Web Application

**Domain:** `neonhubecosystem.com` (root)  
**DNS:**
```
Type    Name    Value                   TTL
A       @       <vercel-ip>            300
CNAME   www     cname.vercel-dns.com   3600
```

**Redirect:** `neonhub.com` → `neonhubecosystem.com` (configured in Vercel)

### API Backend

**Domain:** `api.neonhubecosystem.com`  
**DNS:**
```
CNAME   api     <railway-host>.up.railway.app   3600
```

---

## ✅ Validation

Run: `./scripts/attach-domain-audit.sh` (update for production domains)

---

*Production Domain Setup - November 2, 2025*

