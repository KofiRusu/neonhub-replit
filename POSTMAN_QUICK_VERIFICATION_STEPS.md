# Postman Web Verification – Quick Reference (One Page)

**Date**: November 22, 2024  
**Time to Complete**: ~20 minutes  

---

## 🚀 5-STEP QUICK START

### STEP 1: Login & Create Workspace
```
1. Go to: https://web.postman.co
2. Sign in with your email/password
3. Click "Workspaces" → "Create Workspace"
4. Name: "NeonHub-Local-Validation"
5. Click "Create"
```

### STEP 2: Import Collection
```
1. Click "Import" button
2. Select: /Users/kofirusu/Desktop/NeonHub/postman/NeonHub-API.postman_collection.json
3. Click "Import"
4. Wait ~30 seconds for import to complete
```

### STEP 3: Import Environments
```
1. Click settings/environment icon
2. Click "Import"
3. Select: /Users/kofirusu/Desktop/NeonHub/postman/NeonHub-Local.postman_environment.json
4. Click "Import"
5. Repeat for NeonHub-Staging.postman_environment.json (optional)
```

### STEP 4: Configure & Start API
```
1. In Postman: Select "NeonHub-Local" from environment dropdown
2. Verify base_url = "http://localhost:3001/api"
3. In terminal: cd /Users/kofirusu/Desktop/NeonHub
4. Run: pnpm dev:api
5. Wait for: "Server running on http://localhost:3001"
```

### STEP 5: Run Collection Tests
```
1. Right-click collection "NeonHub-API"
2. Click "Run Collection"
3. Environment: "NeonHub-Local"
4. Click "Run NeonHub-API"
5. Watch results (~60 seconds)
6. Note PASSED vs FAILED count
```

---

## 📊 WHAT YOU'LL SEE

### Success Result ✅
```
Requests:  24
Passed:    24 ✓
Failed:    0
Time:      ~45 seconds
Status:    ALL GREEN
```

### Partial Result ⚠️
```
Requests:  24
Passed:    18 ✓
Failed:    6 ✗
Time:      ~60 seconds
Status:    SOME RED
→ Click red ones to see error details
```

### Failure Result ❌
```
Requests:  24
Passed:    5 ✓
Failed:    19 ✗
Time:      ~30 seconds
Status:    MOSTLY RED
→ Check: Is API running? Database connected?
```

---

## 🔴 COMMON ISSUES

| Issue | Check | Fix |
|-------|-------|-----|
| **All 404** | API running? | `pnpm dev:api` |
| **All 401** | Token captured? | Check login request first |
| **Some 404** | Endpoint exists? | Verify route in `/apps/api/src/` |
| **Some 500** | Database running? | Check for errors in API logs |
| **Timeout** | Network issue? | Increase timeout in Postman |

---

## 📝 DOCUMENT RESULTS

**Open this file** and fill in:
```
→ /Users/kofirusu/Desktop/NeonHub/API_VALIDATION_REPORT_TEMPLATE.md
```

Fill in:
- [ ] Pass/fail count for each domain
- [ ] Failed endpoint URLs
- [ ] Error messages from response
- [ ] Suggested fixes

---

## 📤 SAVE & EXPORT (OPTIONAL)

**Export Collection**:
```
1. Right-click collection
2. "Export" → "Collection v2.1"
3. Save as: NeonHub-API-RESULTS.json
```

**Export Environment**:
```
1. Settings icon → "Export"
2. Save as: NeonHub-Local-RESULTS.json
```

**Save Report**:
```
1. Save filled-in template
2. Name: VALIDATION_RESULTS.md
```

---

## ✅ FINAL CHECKLIST

- [ ] Logged into Postman Web
- [ ] Workspace created
- [ ] Collection imported (24 requests visible)
- [ ] Environments imported (NeonHub-Local available)
- [ ] Active environment set to NeonHub-Local
- [ ] API running on localhost:3001
- [ ] Collection tests executed
- [ ] Results documented
- [ ] Report completed

---

## 🎯 TROUBLESHOOTING IN 30 SECONDS

**Q: Connection refused**  
A: Start API → `pnpm dev:api`

**Q: 401 Unauthorized**  
A: Run login first, check token captured

**Q: 404 Not Found**  
A: Check base_url in environment, verify endpoint exists

**Q: 500 Error**  
A: Check API logs, restart API

**Q: Timeout**  
A: Increase request timeout, check network

---

## 📞 REFERENCE DOCS

| Need | File |
|------|------|
| Full workflow | `POSTMAN_WEB_VERIFICATION_GUIDE.md` |
| Expected results | `POSTMAN_BROWSER_WORKFLOW.md` |
| Report template | `API_VALIDATION_REPORT_TEMPLATE.md` |
| Local setup | `START_HERE_POSTMAN_TESTING.md` |

---

## 🚀 YOU'RE READY!

```
1. Go to: https://web.postman.co
2. Follow 5 steps above
3. Document results in template
4. Done! ✅
```

**Time**: ~20 minutes  
**Difficulty**: Easy  
**Success Rate**: High  

Good luck! 🎉

