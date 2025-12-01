# Profile Page Performance Analysis & Optimization Plan

## Current State Analysis

### 1. **Data Fetching Issues** ⚠️

#### Problem: Multiple Supabase Client Instances
- Each API route creates a new `createClient()` instance
- `withAuth` middleware creates one, then route creates another
- This causes duplicate cookie parsing and unnecessary overhead

#### Problem: No Data Caching Strategy
- React Query cache: 5 minutes (good)
- But no server-side caching
- Every request hits the database

#### Problem: Hardcoded Mock Data
- `activeSessions` are mocked (lines 57-65 in route.ts)
- `preferences` are hardcoded defaults (lines 42-53)
- This creates inconsistency and will need refactoring

### 2. **Performance Bottlenecks** 🐌

#### N+1 Query Potential
Current implementation:
```typescript
// GET /api/user/profile
const userData = await supabase.from('users').select('*').eq('id', user.id).single();
// Then separately fetching preferences (currently mocked)
// Then separately fetching sessions (currently mocked)
```

**Recommended**: Single query with joins or parallel fetches

#### Sequential Database Calls
- Avatar removal makes 2 sequential calls (fetch, then update)
- Profile update could batch operations

### 3. **Audit Trail Gaps** 📝

#### Current Audit Coverage:
- ✅ Profile access (GET)
- ✅ Profile update (PATCH)
- ✅ Avatar upload
- ✅ Avatar removal
- ❌ No view/display in UI
- ❌ No filtering or search
- ❌ No detailed change tracking (before/after values)

---

## Optimization Recommendations

### Phase 1: Immediate Fixes (High Impact, Low Effort)

#### 1.1 Reuse Supabase Client
**Impact**: Reduce overhead by ~30-40%
- Pass supabase client from `withAuth` to route handler
- Avoid creating multiple client instances per request

#### 1.2 Add Request-Level Caching
**Impact**: Reduce database load
```typescript
// Use Next.js cache API or Redis
const cacheKey = `profile:${user.id}`;
```

#### 1.3 Optimize Avatar Operations
**Impact**: Faster avatar management
- Combine fetch + update into single transaction
- Use parallel queries where possible

### Phase 2: Data Structure Improvements

#### 2.1 Create Preferences Table
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  notifications JSONB DEFAULT '{}',
  regional JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2 Track Active Sessions
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  device_info TEXT,
  ip_address INET,
  location TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false
);
```

### Phase 3: Advanced Optimizations

#### 3.1 Implement Real-time Updates
- Use Supabase Realtime for profile changes
- Update UI without refetch when data changes

#### 3.2 Add Edge Caching
- Cache avatar URLs in CDN
- Cache user profiles in edge locations

---

## Audit Trail Enhancement Plan

### Current Implementation Review

**Good**:
- Using `logAuditEvent` function ✅
- Async logging (non-blocking) ✅
- Error handling for audit failures ✅

**Missing**:
- User-facing audit log view ❌
- Before/after change tracking ❌
- Filtering and search ❌
- Export functionality ❌

### Proposed Audit Schema

```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB, -- { before: {}, after: {} }
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user_created ON audit_events(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_events(action);
```

### UI Component: Audit Log Viewer

**Features**:
1. Chronological list of profile changes
2. Filter by action type (update, access, upload, etc.)
3. Show before/after values for updates
4. Export to CSV
5. Pagination (50 items per page)

---

## Action Items

### High Priority 🔴
1. [ ] Reuse Supabase client instances
2. [ ] Create user_preferences table
3. [ ] Add change tracking to audit logs
4. [ ] Build audit log viewer component

### Medium Priority 🟡
1. [ ] Implement real active sessions tracking
2. [ ] Add server-side caching layer
3. [ ] Optimize avatar upload/removal flow

### Low Priority 🟢
1. [ ] Add real-time updates
2. [ ] Implement CDN caching for avatars
3. [ ] Add export functionality

---

## Performance Metrics to Track

1. **API Response Time**
   - Target: < 200ms for GET /api/user/profile
   - Current: ~300-500ms (estimated)

2. **Database Query Count**
   - Target: 1-2 queries per profile load
   - Current: 3-4 queries (with avatar operations)

3. **Cache Hit Rate**
   - Target: > 80% for repeat profile views
   - Current: 0% (no caching)

4. **Time to Interactive (TTI)**
   - Target: < 1s on profile page load
   - Current: Unknown (needs measurement)
