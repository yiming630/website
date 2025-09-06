# 📊 Database Setup & Management Guide

## ✅ Data Persistence Guarantee

**YES, your PostgreSQL and MongoDB data persists between restarts!**

We use Docker volumes (`postgres_data` and `mongo_data`) which store data outside the container. This means:
- ✅ Data survives `npm run services:stop`
- ✅ Data survives `npm run services:start` 
- ✅ Data survives Docker container restarts
- ❌ Data is ONLY lost with `npm run services:reset` (intentional wipe)

## 🚀 Quick Start Commands

### Start Everything (Idempotent - Safe to run multiple times)
```bash
npm run dev:full        # With debug output showing schema
npm run dev:full:quiet  # Without debug output
```

### Stop Everything (Idempotent - Safe to run multiple times)
```bash
npm run services:stop   # Stops all services, preserves data
```

### Database Management
```bash
npm run services:start        # Start with debug info (shows schema)
npm run services:start:quiet  # Start without debug info
npm run services:stop         # Stop (data preserved)
npm run services:reset        # ⚠️  DANGER: Wipes all data
npm run services:status       # Check container status
```

## 🔍 What the Debug Output Shows

When you run `npm run services:start` or `npm run dev:full`:

1. **PostgreSQL Tables** - All tables in your database
2. **file_metadata columns** - Critical table structure
3. **MongoDB Collections** - Collections and document counts
4. **Backend Requirements** - What columns the backend expects

## 🎯 Key Insights for Debugging

### The Golden Rule
**If you change database schema → MUST restart backend!**

The backend caches database connections at startup. Schema changes won't be seen until restart.

### Debugging Flow
```
1. Error occurs → Read the EXACT error message
2. It tells you: "column X of relation Y does not exist"
3. Run: npm run services:start (shows current schema)
4. Add missing column/table via migration
5. Run: node backend/databases/migrate.js
6. CRITICAL: Restart backend (pkill -f "npm run backend" && npm run backend:dev)
7. Test again
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "column X does not exist" | Migration not run | Run `node backend/databases/migrate.js` |
| Schema changes not working | Backend cached old schema | Restart backend service |
| Data lost after restart | Not using volumes | Use our scripts, not manual docker commands |
| Port already in use | Previous process stuck | Run `npm run services:stop` |

## 📁 Project Structure

```
scripts/
├── start-databases.sh         # Original quiet startup
├── start-databases-debug.sh   # New debug startup (shows schema)
└── stop-services-clean.sh     # Clean shutdown

backend/databases/
├── migrations/                 # SQL migration files
│   ├── 001_*.sql
│   ├── 002_*.sql
│   └── ...
└── migrate.js                  # Migration runner
```

## 🔧 Advanced Commands

### Check Database Schema Manually
```bash
# PostgreSQL tables
psql postgresql://postgres:password@localhost:5432/translation_platform -c "\dt"

# Specific table structure
psql postgresql://postgres:password@localhost:5432/translation_platform -c "\d file_metadata"

# MongoDB collections
docker exec mongodb mongosh translation_platform_dev --eval "db.getCollectionNames()"
```

### Force Clean Restart
```bash
npm run services:stop
npm run services:start
npm run backend:dev
```

## 🚨 Important Notes

1. **Idempotent Commands**: Both `npm run dev:full` and `npm run services:stop` can be run multiple times safely

2. **Data Persistence**: Your data is safe unless you explicitly run `npm run services:reset`

3. **Backend Restart Required**: After any database schema change, the backend MUST be restarted

4. **Error Messages Are Your Friend**: They tell you EXACTLY what's missing

5. **Migrations Are Tracked**: The system knows which migrations have been applied

## 🎉 Success Checklist

- [ ] Services start without errors
- [ ] `npm run services:start` shows all expected tables
- [ ] file_metadata has all required columns
- [ ] Backend health check returns true for both databases
- [ ] File upload works from frontend

## 💡 Pro Tips

1. **Use the debug startup during development**: `npm run services:start` shows you exactly what's in your database

2. **Read error messages carefully**: PostgreSQL errors tell you the exact column/table that's missing

3. **Keep migrations small**: One logical change per migration file

4. **Test uploads after changes**: Create a unique test file each time to avoid duplicate key errors

5. **Check health endpoint**: `curl http://localhost:4002/health | jq .` tells you if databases are connected

---

Remember: The system is designed to be developer-friendly. If something goes wrong, the error messages will guide you to the solution!
