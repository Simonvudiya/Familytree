# User Roles & Permissions

## Overview
The platform implements a hierarchical role-based access control (RBAC) system within each family (tenant). Roles determine what actions users can perform on family content and settings.

## Role Hierarchy

```
Owner (Highest)
    ↓
Admin
    ↓
Editor
    ↓
Contributor
    ↓
Viewer (Lowest)
```

Higher roles inherit all permissions of lower roles.

## Role Definitions

### Owner
**One per family** - The family creator or designated owner.

**Permissions:**
- All Admin permissions
- Transfer ownership
- Delete family
- Manage billing/subscription
- Delete any content
- Manage family settings (visibility, invite policies)
- Access audit logs
- Manage API keys
- Export all family data
- Delete family members

**Restrictions:**
- Cannot be removed by other roles
- Only one owner per family
- Ownership transfer requires confirmation

### Admin
**Multiple per family** - Trusted family members who help manage.

**Permissions:**
- All Editor permissions
- Invite/remove family members
- Change member roles (except Owner)
- Manage family settings (except billing)
- Moderate content (hide/delete any story)
- Manage invitations
- Access family analytics
- Configure integrations
- Manage custom domains

**Restrictions:**
- Cannot delete family
- Cannot change Owner role
- Cannot manage billing

### Editor
**Multiple per family** - Active contributors who curate content.

**Permissions:**
- All Contributor permissions
- Edit any story (not just own)
- Edit any person profile
- Edit any timeline event
- Manage chapters and books
- Publish/unpublish content
- Organize stories into chapters
- Compile and export books
- Manage autocomplete sessions
- Bulk operations

**Restrictions:**
- Cannot manage members
- Cannot change family settings
- Cannot delete family

### Contributor
**Multiple per family** - Family members who add content.

**Permissions:**
- All Viewer permissions
- Create stories (own only)
- Edit own stories
- Create people profiles
- Edit own person profiles
- Create timeline events
- Edit own timeline events
- Upload photos/documents
- Add memories/testimonies
- Participate in autobiographies
- Comment on stories
- Tag people in stories

**Restrictions:**
- Cannot edit others' content
- Cannot publish content (stays draft/review)
- Cannot manage chapters/books
- Cannot export books
- Cannot manage members

### Viewer
**Multiple per family** - Family members who only consume content.

**Permissions:**
- View published stories (family/public visibility)
- View family tree
- View timeline
- View people profiles
- View memories
- View photos/documents
- Search content
- Download exported books
- Receive notifications

**Restrictions:**
- Cannot create any content
- Cannot edit any content
- Cannot see draft/review stories
- Cannot upload files
- Cannot manage anything

## Permission Matrix

| Action | Owner | Admin | Editor | Contributor | Viewer |
|--------|-------|-------|--------|-------------|--------|
| **Family Management** | | | | | |
| View family | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit family settings | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete family | ✓ | ✗ | ✗ | ✗ | ✗ |
| Transfer ownership | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Member Management** | | | | | |
| Invite members | ✓ | ✓ | ✗ | ✗ | ✗ |
| Remove members | ✓ | ✓ | ✗ | ✗ | ✗ |
| Change roles | ✓ | ✓* | ✗ | ✗ | ✗ |
| View member list | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Stories** | | | | | |
| View published | ✓ | ✓ | ✓ | ✓ | ✓ |
| View draft/review | ✓ | ✓ | ✓ | Own | ✗ |
| Create stories | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit any story | ✓ | ✓ | ✓ | Own | ✗ |
| Delete any story | ✓ | ✓ | ✓ | Own | ✗ |
| Publish stories | ✓ | ✓ | ✓ | ✗ | ✗ |
| Version history | ✓ | ✓ | ✓ | Own | ✗ |
| **People** | | | | | |
| View profiles | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create profiles | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit any profile | ✓ | ✓ | ✓ | Own | ✗ |
| Delete profiles | ✓ | ✓ | ✓ | Own | ✗ |
| Manage relationships | ✓ | ✓ | ✓ | Own | ✗ |
| **Timeline** | | | | | |
| View events | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create events | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit any event | ✓ | ✓ | ✓ | Own | ✗ |
| Delete events | ✓ | ✓ | ✓ | Own | ✗ |
| **Media** | | | | | |
| View media | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload media | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete any media | ✓ | ✓ | ✓ | Own | ✗ |
| **Memories** | | | | | |
| View memories | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create memories | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit any memory | ✓ | ✓ | ✓ | Own | ✗ |
| **Autobiography** | | | | | |
| View sessions | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create sessions | ✓ | ✓ | ✓ | ✓ | ✗ |
| Interview (edit responses) | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage chapters | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Book Compiler** | | | | | |
| View chapters/books | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create chapters | ✓ | ✓ | ✓ | ✗ | ✗ |
| Edit chapters | ✓ | ✓ | ✓ | ✗ | ✗ |
| Organize chapters | ✓ | ✓ | ✓ | ✗ | ✗ |
| Compile books | ✓ | ✓ | ✓ | ✗ | ✗ |
| Export books | ✓ | ✓ | ✓ | ✗ | ✓ |
| **Search** | | | | | |
| Search all content | ✓ | ✓ | ✓ | ✓ | Published only |
| **Admin** | | | | | |
| View audit logs | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage integrations | ✓ | ✓ | ✗ | ✗ | ✗ |
| Export family data | ✓ | ✓ | ✗ | ✗ | ✗ |

*Admin can change roles except Owner

## Role Assignment

### Initial Setup
1. Family creator becomes **Owner**
2. Owner invites first members as **Contributor** (default)
3. Owner promotes trusted members to **Admin** or **Editor**

### Changing Roles
- **Owner → Admin**: Owner initiates transfer, new owner accepts
- **Admin → Editor/Contributor**: Admin or Owner can demote
- **Editor → Contributor**: Admin, Owner, or Editor can demote
- **Contributor → Viewer**: Any higher role can demote
- **Any → Admin**: Only Owner can promote
- **Any → Editor**: Owner or Admin can promote

### Role Requests
- Members can request role upgrades
- Admins/Owners receive notifications
- Request includes justification
- Audit log records all changes

## Visibility Settings

### Family Visibility
- **Private**: Only family members can see family exists
- **Family**: Family name visible in search, content requires membership
- **Public**: Family discoverable, public content visible to all

### Content Visibility
- **Private**: Only author (and Owner/Admin/Editor)
- **Family**: All family members (based on their role)
- **Public**: Anyone with link (if family is public)

## API Access

### Personal Access Tokens
- Generated by Owner/Admin
- Scoped to specific permissions
- Rate limited
- Revocable
- Audit logged

### OAuth Applications
- Registered by Owner
- Scoped permissions
- User consent required
- Refresh token rotation

## Audit Logging

All role changes and permission-sensitive actions are logged:
- Role assignments/removals
- Content visibility changes
- Member invitations/removals
- Settings modifications
- Data exports
- Failed authorization attempts

## Best Practices

1. **Principle of Least Privilege**: Assign lowest role needed
2. **Regular Audits**: Review member roles quarterly
3. **Owner Succession**: Designate backup owner
4. **Separation of Duties**: Don't make everyone Admin
5. **Document Decisions**: Record why roles were assigned
6. **Offboarding**: Remove access immediately when members leave