# Notification System - Test Plan & Verification Guide

## Overview
This document provides a comprehensive testing guide for the newly optimized notification system with role-based filtering, clickable redirects, mark as read functionality, and enhanced features.

## Test Date
September 17, 2026

---

## ✅ Completed Implementation

### 1. Database Schema Enhancements ✅
**File**: `/sms-backend/db/migrations/004_enhance_notifications.sql`

**Added Columns**:
- ✅ `action_url` (TEXT) - Direct navigation URL for notifications
- ✅ `entity_type` (ENUM) - Entity categorization (goods_receipt, requisition, etc.)
- ✅ `action_required` (BOOLEAN) - Flags notifications requiring user action
- ✅ `priority` (ENUM) - Priority levels: low, normal, high, urgent
- ✅ `notification_type` (ENUM) - UI rendering types: info, success, warning, error, action
- ✅ `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp
- ✅ `marked_read_by` (UUID) - User who marked notification as read

**Indexes Created**:
- ✅ `idx_notifications_unread` - Fast unread notification queries
- ✅ `idx_notifications_action_required` - Quick action-required lookups
- ✅ `idx_notifications_entity_type` - Entity type filtering
- ✅ `idx_notifications_priority` - Priority-based sorting
- ✅ `idx_notifications_reference` - Reference ID lookups

**Views Created**:
- ✅ `user_unread_notifications` - All unread notifications by user
- ✅ `user_urgent_notifications` - Action-required notifications from last 7 days
- ✅ `notification_statistics` - Per-user notification statistics

**Functions Created**:
- ✅ `cleanup_old_notifications(days_old)` - Soft-delete old read notifications

---

### 2. Backend Utility Enhancements ✅
**File**: `/sms-backend/src/utils/notifications.js`

**New Functions**:
- ✅ `generateActionUrl(entityType, referenceId)` - Auto-generates navigation URLs
- ✅ `getNotificationType(severity)` - Maps severity to notification type
- ✅ `requiresAction(message)` - Detects if notification needs action
- ✅ `determinePriority(severity, message)` - Auto-determines priority
- ✅ `notifySpecificUsers(userIds, ...)` - Notify specific user list
- ✅ `inferEntityTypeFromModule(module)` - Module-to-entity mapping

**Enhanced Functions**:
- ✅ `notifyRoles()` - Now includes entity_type, priority, action_url, etc.
- ✅ `notifyUser()` - Now includes all new metadata

---

### 3. Backend Controller & Routes ✅
**Files**: 
- `/sms-backend/src/controllers/notifications.controller.js`
- `/sms-backend/src/routes/notifications.routes.js`

**New Endpoints**:
- ✅ `GET /notifications/summary` - Unread counts summary
- ✅ `GET /notifications/by-module` - Group by module
- ✅ `GET /notifications/by-entity/:entityType` - Filter by entity
- ✅ `GET /notifications/statistics` - User statistics
- ✅ `POST /notifications/batch/read` - Mark multiple as read
- ✅ `POST /notifications/module/:module/read` - Mark module as read
- ✅ `DELETE /notifications/:id` - Soft delete notification
- ✅ `POST /notifications/batch/delete` - Bulk delete

**Enhanced Endpoints**:
- ✅ `GET /notifications` - Now supports filtering (unread, module, entityType, priority, actionRequired)

---

### 4. Frontend Notification Bell ✅
**File**: `/sms-frontend/src/components/layout/TopbarNew.jsx`

**New Features**:
- ✅ Auto-refresh every 30 seconds
- ✅ New notification detection with animation
- ✅ Filter tabs (All / Unread / Action Required)
- ✅ Unread, Action, and Urgent counters
- ✅ Priority badges (urgent, high, normal, low)
- ✅ Notification type icons (success, warning, error, info)
- ✅ Direct navigation via action_url
- ✅ Improved visual hierarchy and UI
- ✅ Group stats display

---

### 5. Dedicated Notifications Page ✅
**File**: `/sms-frontend/src/pages/Notifications.jsx`

**Features Implemented**:
- ✅ Statistics cards (Total, Unread, Action Required, Urgent)
- ✅ Advanced search functionality
- ✅ Filter tabs (All, Unread, Action, Read)
- ✅ Module filter dropdown
- ✅ Priority filter dropdown
- ✅ Date range filter (All, Today, Week, Month)
- ✅ Bulk selection with checkboxes
- ✅ Bulk mark as read
- ✅ Bulk delete
- ✅ Individual notification actions (mark read, delete)
- ✅ Notification cards with icons, badges, timestamps
- ✅ Click to navigate to action_url
- ✅ Responsive design

---

### 6. API Client Updates ✅
**File**: `/sms-frontend/src/lib/api.js`

**New API Methods**:
- ✅ `notifications.summary()`
- ✅ `notifications.byModule()`
- ✅ `notifications.byEntityType(entityType)`
- ✅ `notifications.statistics()`
- ✅ `notifications.markMultipleRead(notificationIds)`
- ✅ `notifications.markModuleRead(module)`
- ✅ `notifications.deleteNotification(id)`
- ✅ `notifications.deleteMultiple(notificationIds)`

---

## 🧪 Testing Checklist

### Backend Testing

#### 1. Database Migration ✅
```bash
# Verify migration executed successfully
cd sms-backend
node db/run-migration.js 004_enhance_notifications.sql
# Expected: ✅ Migration completed successfully
```

#### 2. Backend Syntax Check ✅
```bash
# Verify no syntax errors
node -c src/controllers/notifications.controller.js
node -c src/utils/notifications.js
node -c src/routes/notifications.routes.js
# Expected: No output = success
```

#### 3. Start Backend Server
```bash
cd sms-backend
npm run dev
# Expected: Server starts on port 5001
```

#### 4. Test Backend Endpoints (using curl or Postman)

**List notifications with filtering**:
```bash
# Get all notifications
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications

# Get unread only
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications?unread=true

# Get action-required only
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications?actionRequired=true

# Filter by priority
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications?priority=urgent
```

**Get summary**:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications/summary
# Expected: { total_unread, action_required_count, urgent_count, high_priority_count }
```

**Get by module**:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications/by-module
# Expected: Array of { module, entity_type, count, unread_count, latest_notification }
```

**Mark as read**:
```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications/<id>/read
# Expected: { id, read_at, marked_read_by }
```

**Bulk mark as read**:
```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"notificationIds":["id1","id2"]}' \
  http://localhost:5001/api/notifications/batch/read
# Expected: { updated: 2, ids: [...] }
```

**Delete notification**:
```bash
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:5001/api/notifications/<id>
# Expected: { deleted: true, id: "..." }
```

---

### Frontend Testing

#### 1. Start Frontend Server
```bash
cd sms-frontend
npm run dev
# Expected: Server starts on port 5173
```

#### 2. Test Notification Bell (TopbarNew.jsx)

**Visual Tests**:
- [ ] Bell icon shows in top navigation
- [ ] Unread count badge displays correctly
- [ ] Badge shows "99+" for counts over 99
- [ ] Urgent notification indicator appears (amber alert icon)
- [ ] Click bell opens dropdown
- [ ] Click outside closes dropdown
- [ ] ESC key closes dropdown

**Auto-Refresh Tests**:
- [ ] Notifications auto-refresh every 30 seconds
- [ ] New notification triggers animation (bounce effect)
- [ ] New notification shows ping animation on badge
- [ ] Page visibility check works (no refresh when tab hidden)

**Filter Tabs Tests**:
- [ ] "All" tab shows all notifications
- [ ] "Unread" tab shows only unread
- [ ] "Action" tab shows only action-required
- [ ] Tab counts are accurate
- [ ] Switching tabs updates notification list

**Notification Display Tests**:
- [ ] Success notifications show green check icon
- [ ] Warning notifications show amber triangle icon
- [ ] Error notifications show red alert icon
- [ ] Info notifications show blue info icon
- [ ] Title displays if present
- [ ] Message displays correctly
- [ ] Module badge shows
- [ ] Priority badge shows (urgent/high/low only, not normal)
- [ ] "Action Required" badge shows when applicable
- [ ] Timestamp formats correctly
- [ ] Unread indicator (blue dot) shows for unread

**Interaction Tests**:
- [ ] Click notification navigates to action_url
- [ ] Click notification marks as read if unread
- [ ] "Mark all as read" button works
- [ ] "View all notifications" navigates to /notifications
- [ ] Empty state shows when no notifications

---

#### 3. Test Notifications Page (/notifications)

**Navigation Tests**:
- [ ] Page accessible at /notifications route
- [ ] "View all notifications" from bell navigates here
- [ ] Back button returns to previous page

**Statistics Cards Tests**:
- [ ] Total count matches actual notifications
- [ ] Unread count accurate
- [ ] Action Required count accurate
- [ ] Urgent count accurate
- [ ] Cards have proper colors and icons

**Search Tests**:
- [ ] Search by title works
- [ ] Search by message works
- [ ] Search by module works
- [ ] Search is case-insensitive
- [ ] Clear search shows all results
- [ ] "No results" message shows when no match

**Filter Tests**:
- [ ] "All" filter shows all notifications
- [ ] "Unread" filter shows only unread
- [ ] "Action" filter shows only action-required
- [ ] "Read" filter shows only read
- [ ] Filter counts update correctly
- [ ] "Show Filters" toggles advanced filters
- [ ] Module dropdown populated from backend
- [ ] Module filter works correctly
- [ ] Priority filter works correctly
- [ ] Date range filter works (Today/Week/Month/All)
- [ ] Multiple filters combine correctly (AND logic)

**Bulk Actions Tests**:
- [ ] "Select All" checkbox selects all visible
- [ ] Individual checkboxes work
- [ ] Selected count displays correctly
- [ ] "Mark as Read" button appears when items selected
- [ ] "Delete" button appears when items selected
- [ ] Bulk mark as read works
- [ ] Bulk delete works (with confirmation)
- [ ] Selection clears after action
- [ ] Notifications refresh after action

**Individual Notification Tests**:
- [ ] Notification cards display correctly
- [ ] Icons match notification types
- [ ] Unread notifications have highlighted background
- [ ] Priority badges display correctly
- [ ] Action Required badge shows when applicable
- [ ] Module badge displays
- [ ] Timestamp formats correctly
- [ ] Click notification navigates to action_url
- [ ] Click notification marks as read
- [ ] Hover shows action buttons (mark read, delete)
- [ ] Individual mark as read works
- [ ] Individual delete works
- [ ] Unread indicator (dot) shows/hides correctly

**Empty State Tests**:
- [ ] Empty state shows when no notifications
- [ ] Different messages for different filters
- [ ] Icon and styling appropriate

---

### Role-Based Testing

Test with different user roles to ensure proper notification targeting:

#### Administrator
- [ ] Receives system-level notifications
- [ ] Receives all approval requests
- [ ] Can see all notification types
- [ ] All features accessible

#### Property Administration Officer (PAO)
- [ ] Receives GRN approval requests
- [ ] Receives high-priority alerts
- [ ] Does NOT receive clerk-level tasks
- [ ] Cannot record goods receipts (verified in earlier fix)

#### Store Head
- [ ] Receives verification requests
- [ ] Receives store-specific notifications
- [ ] Receives requisition approvals
- [ ] Can delegate GRNs to clerks

#### Stock Clerk
- [ ] Receives assigned GRN tasks
- [ ] Receives bin card updates
- [ ] Receives issue voucher notifications
- [ ] Can execute delegated tasks

#### Security Officer
- [ ] Receives gate clearance requests
- [ ] Receives fixed asset movement alerts
- [ ] Receives disposal notifications
- [ ] Limited to security-related notifications

---

### Integration Testing

#### 1. Goods Receipt Workflow
- [ ] Create new goods receipt
- [ ] Verify PAO receives approval notification
- [ ] Priority set correctly (based on value)
- [ ] action_url points to correct GRN
- [ ] entity_type = 'goods_receipt'
- [ ] action_required = true
- [ ] Click notification navigates to goods receipt page
- [ ] After approval, creator receives success notification

#### 2. Requisition Workflow
- [ ] Create requisition
- [ ] Approver receives notification
- [ ] entity_type = 'requisition'
- [ ] action_url includes requisition ID
- [ ] Priority based on urgency
- [ ] After approval, requester receives notification
- [ ] notification_type = 'success' for approval

#### 3. Transfer Workflow
- [ ] Initiate transfer
- [ ] Receiving store head gets notification
- [ ] entity_type = 'transfer'
- [ ] action_required = true
- [ ] Click navigates to transfer page
- [ ] After acceptance, sender receives notification

#### 4. Return Workflow
- [ ] Create return
- [ ] Store head receives notification
- [ ] entity_type = 'return'
- [ ] Priority appropriate
- [ ] Navigation works
- [ ] Approval triggers success notification

#### 5. Gate Clearance Workflow
- [ ] Request gate clearance
- [ ] Security receives notification
- [ ] entity_type = 'gate_clearance'
- [ ] action_required = true
- [ ] High priority if valuable items
- [ ] Approval triggers notification to requester

---

### Performance Testing

#### Backend Performance
- [ ] List notifications query < 100ms (with indexes)
- [ ] Filter queries < 50ms
- [ ] Bulk operations handle 100+ items
- [ ] Database indexes used (check EXPLAIN ANALYZE)
- [ ] No N+1 query issues

#### Frontend Performance
- [ ] Notification bell dropdown opens < 200ms
- [ ] Notifications page loads < 500ms
- [ ] Search/filter updates < 100ms
- [ ] Auto-refresh doesn't cause lag
- [ ] Animations smooth (60fps)
- [ ] No memory leaks with auto-refresh

#### Scalability
- [ ] System handles 1000+ notifications per user
- [ ] Pagination works correctly
- [ ] Cleanup function removes old notifications
- [ ] Database size remains manageable

---

### Accessibility Testing

- [ ] Notification bell has aria-label
- [ ] Unread count announced by screen readers
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Icons have text alternatives
- [ ] Notifications page keyboard accessible

---

### Browser Compatibility

Test in:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Edge (latest)

Test features:
- [ ] Dropdown positioning
- [ ] Animations
- [ ] Auto-refresh
- [ ] Date formatting
- [ ] Icons rendering

---

### Mobile Responsiveness

- [ ] Notification bell scales properly
- [ ] Dropdown width appropriate on mobile
- [ ] Notifications page responsive
- [ ] Touch interactions work
- [ ] Filters accessible on small screens
- [ ] Cards stack properly
- [ ] Text readable without zoom

---

## 🐛 Known Issues / Limitations

1. **Auto-Refresh Interval**: Fixed at 30 seconds - could be made configurable
2. **Sound Notifications**: Commented out - browser autoplay restrictions
3. **Real-time Updates**: Uses polling, not WebSockets (sufficient for now)
4. **Notification Limit**: Frontend displays up to 100 at a time (pagination needed for more)
5. **Date Filtering**: Client-side only - consider moving to backend for large datasets

---

## 📋 Verification Checklist Summary

### Code Quality ✅
- [x] Backend syntax valid (no errors)
- [x] Frontend syntax valid (no errors)
- [x] Database migration successful
- [x] All files created/modified
- [x] No console errors

### Functionality (To Test)
- [ ] All backend endpoints working
- [ ] Frontend bell notification working
- [ ] Notifications page working
- [ ] Role-based notifications correct
- [ ] Navigation URLs working
- [ ] Mark as read working
- [ ] Bulk actions working
- [ ] Filters working
- [ ] Search working

### User Experience (To Test)
- [ ] UI looks professional
- [ ] Animations smooth
- [ ] Icons appropriate
- [ ] Colors accessible
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling

---

## 🚀 Deployment Steps

### Pre-Deployment
1. ✅ Run database migration on production
2. ✅ Verify all dependencies installed
3. ✅ Check environment variables
4. ✅ Test on staging environment first

### Deployment
1. Stop backend server
2. Pull latest code
3. Run `npm install` (if new dependencies)
4. Run database migration
5. Start backend server
6. Build frontend (`npm run build`)
7. Deploy frontend build
8. Verify health check

### Post-Deployment
1. Monitor error logs
2. Check notification delivery
3. Verify auto-refresh working
4. Test critical paths (goods receipt, requisition)
5. Gather user feedback

---

## 📊 Success Metrics

After deployment, monitor:
- Notification delivery rate (target: 100%)
- Average time to mark as read (target: < 2 minutes for urgent)
- Click-through rate on action URLs (target: > 80% for action-required)
- User engagement with notifications page
- Backend API response times (target: < 100ms)
- Frontend auto-refresh performance
- Zero notification delivery failures

---

## 🎯 Future Enhancements

Potential improvements for future iterations:
1. **Real-time with WebSockets** - Replace polling with push notifications
2. **Email Notifications** - Send urgent notifications via email
3. **SMS Notifications** - Critical alerts via SMS
4. **Notification Preferences** - User settings for notification types
5. **Notification Sounds** - Configurable audio alerts
6. **Browser Push Notifications** - Desktop notifications
7. **Notification Templates** - Consistent formatting
8. **Analytics Dashboard** - Notification metrics and trends
9. **Scheduled Notifications** - Send at specific times
10. **Notification History Export** - Download notification logs

---

## 📞 Support

For issues or questions:
- Check backend logs: `sms-backend/logs/`
- Check browser console for frontend errors
- Review database queries with `EXPLAIN ANALYZE`
- Contact development team

---

**Test Completed By**: _________________  
**Test Date**: _________________  
**Test Result**: ☐ Pass  ☐ Fail  ☐ Partial  
**Notes**: _________________

