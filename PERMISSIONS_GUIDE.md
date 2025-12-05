# Permission System Guide

## Overview

The Legacy Admin Panel now includes a comprehensive permission system that allows administrators to control which sections of the application users can access. This system works for all user types: Buyers, Brokers, and Suppliers.

## Features

### 1. **Role-Based Access Control**
- **Admin**: Full access to all sections (cannot be restricted)
- **Buyer/Broker/Supplier**: Access based on assigned permissions

### 2. **Available Permissions**

The following sections can be controlled via permissions:

| Permission ID | Section Name | Description |
|--------------|--------------|-------------|
| `dashboard` | Dashboard | Access to main dashboard |
| `user-management` | User Management | Access to user management section |
| `all-users` | All Users | Access to all users view |
| `property-management` | Property Management | Access to property management |
| `broker-management` | Broker Management | Access to broker management |
| `supplier-management` | Supplier Management | Access to supplier management |
| `product-management` | Product Management | Access to product management |
| `order-management` | Order Management | Access to order management |
| `project-management` | Project Management | Access to project management |
| `documents` | Documents | Access to documents section |
| `support` | Support | Access to support section |
| `app-api-test` | App API Test | Access to app API testing |
| `support-api-test` | Support API Test | Access to support API testing |

## How to Use

### For Administrators

#### Assigning Permissions to Users

1. **Navigate to All Users Page**
   - Log in as an administrator
   - Go to "All Users" section from the sidebar

2. **Manage User Permissions**
   - Find the user you want to manage
   - Click the "Manage" button in the Permissions column
   - A modal will appear showing all available permissions

3. **Select Permissions**
   - Check/uncheck permissions as needed
   - Use "Select All" to grant all permissions
   - Use "Deselect All" to remove all permissions
   - Click "Save Permissions" to apply changes

#### Example Use Cases

**Scenario 1: Limited Access User**
If you want a buyer to only access the Dashboard and Property Management:
1. Click "Manage" for that buyer
2. Click "Deselect All"
3. Check only "Dashboard" and "Property Management"
4. Save

**Scenario 2: Sales Team Member**
For a broker who needs access to properties, projects, and documents:
1. Click "Manage" for that broker
2. Select: Dashboard, Property Management, Project Management, Documents
3. Save

**Scenario 3: Supplier Portal**
For a supplier who only needs to manage products and orders:
1. Click "Manage" for that supplier
2. Select: Dashboard, Product Management, Order Management
3. Save

### For Regular Users (Buyers/Brokers/Suppliers)

#### Logging In
1. Use your email and password to log in
2. You'll only see the sections you have permission to access
3. The sidebar will automatically show only your allowed sections

#### Access Restrictions
- If you try to access a page you don't have permission for (via direct URL), you'll be redirected
- You'll see an "Access Denied" message if you don't have the required permission

## Technical Implementation

### Backend Changes

#### 1. Database Models
Added `permissions` field to:
- `Buyer` model
- `Broker` model
- `Supplier` model

Default: All permissions are granted to new users

#### 2. API Endpoints

**Get Available Permissions**
```
GET /api/permissions/available
Authorization: Bearer <admin_token>
```

**Get User Permissions**
```
GET /api/permissions/:userType/:userId
Authorization: Bearer <admin_token>
```

**Update User Permissions**
```
PUT /api/permissions/:userType/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "permissions": ["dashboard", "property-management"]
}
```

#### 3. Migration Script

To add default permissions to existing users:
```bash
cd legacy-backend
node migrations/addPermissionsToUsers.js
```

### Frontend Changes

#### 1. Login System
- Updated to accept all user types (admin, buyer, broker, supplier)
- Stores user permissions in localStorage

#### 2. Sidebar Component
- Automatically filters menu items based on user permissions
- Admins see all items
- Regular users see only their permitted sections

#### 3. Route Protection
- All routes are protected with `ProtectedRoute` component
- Checks user permissions before rendering page
- Redirects unauthorized users

#### 4. Permission Manager Component
- Modal interface for managing user permissions
- Shows all available permissions with descriptions
- Allows bulk select/deselect
- Real-time updates

## Security Notes

1. **Admin Privileges**: Admins always have full access and cannot be restricted
2. **Token-Based**: All permission checks are validated on both frontend and backend
3. **Default Permissions**: New users get all permissions by default (can be changed in model)
4. **Graceful Degradation**: If a user has no permissions, they see an access denied message

## Migration Steps (First Time Setup)

### For Existing Projects

1. **Update Backend Models** ✅
   - Models now include permissions field

2. **Run Migration Script**
   ```bash
   cd legacy-backend
   node migrations/addPermissionsToUsers.js
   ```

3. **Restart Backend Server**
   ```bash
   npm start
   ```

4. **Frontend is Ready** ✅
   - No additional steps needed
   - Clear browser cache if needed

## Common Issues & Solutions

### Issue 1: User Can't See Any Menu Items
**Solution**: Assign at least one permission to the user

### Issue 2: Migration Script Fails
**Solution**: Ensure database connection is configured correctly in `.env` file

### Issue 3: Permissions Not Updating
**Solution**: 
- Check if backend server is running
- Verify admin token is valid
- Clear browser localStorage and log in again

## Future Enhancements

Potential improvements to the permission system:

1. **Permission Groups**: Create predefined permission sets (e.g., "Sales Team", "Support Team")
2. **Granular Permissions**: Add create/read/update/delete permissions for each section
3. **Time-Based Access**: Temporary permissions that expire after a set time
4. **Audit Log**: Track who changed permissions and when
5. **Permission Templates**: Save and reuse permission configurations

## Support

For questions or issues with the permission system:
1. Check this documentation first
2. Verify backend logs for API errors
3. Check browser console for frontend errors
4. Contact system administrator

