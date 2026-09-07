# Contact Form Backend Setup

## Overview

The contact form backend has been completely set up with database integration and admin dashboard access.

## Created Files

### 1. Database Model

- **File**: `prisma/schema.prisma`
- **Model**: `Contact`
- **Fields**:
  - `id`: UUID (primary key)
  - `name`: String
  - `email`: String
  - `phone`: String
  - `subject`: String
  - `message`: Text
  - `isRead`: Boolean (default: false)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

### 2. Repository Layer

- **File**: `src/repositories/contact.repository.ts`
- **Methods**:
  - `create(data)`: Save contact form submission
  - `findAll(skip, take)`: Get all contacts with pagination
  - `findById(id)`: Get specific contact
  - `updateStatus(id, isRead)`: Mark contact as read/unread
  - `delete(id)`: Delete a contact
  - `getUnreadCount()`: Count unread messages

### 3. Service Layer

- **File**: `src/services/contact.service.ts`
- **Methods**:
  - `submitContact(data)`: Handle form submission
  - `getAllContacts(page, limit)`: Get paginated contacts
  - `getContactById(id)`: Retrieve specific contact
  - `markAsRead(id)`: Mark as read
  - `markAsUnread(id)`: Mark as unread
  - `deleteContact(id)`: Remove contact
  - `getDashboardStats()`: Get dashboard statistics

### 4. Controller Layer

- **File**: `src/controllers/contact.controller.ts`
- **Endpoints** handled:
  - `POST /api/contacts` - Submit form (public)
  - `GET /api/contacts` - Get all contacts (admin only)
  - `GET /api/contacts/:id` - Get specific contact (admin only)
  - `PUT /api/contacts/:id/mark-read` - Mark as read (admin only)
  - `DELETE /api/contacts/:id` - Delete contact (admin only)
  - `GET /api/contacts/dashboard/stats` - Dashboard stats (admin only)

### 5. Routes

- **File**: `src/routes/contact.routes.ts`
- Routes registered in `src/routes/index.ts`
- Base path: `/api/contacts`

## API Endpoints

### 1. Submit Contact Form (Public)

```
POST /api/contacts
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "subject": "Question about services",
  "message": "I have a question about your services..."
}

Response (201 Created):
{
  "success": true,
  "message": "Message submitted successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "subject": "Question about services",
    "message": "...",
    "isRead": false,
    "createdAt": "2026-09-07T...",
    "updatedAt": "2026-09-07T..."
  }
}
```

### 2. Get All Contacts (Admin Dashboard)

```
GET /api/contacts?page=1&limit=20
Authorization: Bearer {admin_token}

Response (200 OK):
{
  "success": true,
  "message": "Contacts retrieved successfully",
  "data": {
    "contacts": [...],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 3. Get Dashboard Statistics

```
GET /api/contacts/dashboard/stats
Authorization: Bearer {admin_token}

Response (200 OK):
{
  "success": true,
  "message": "Dashboard stats retrieved",
  "data": {
    "totalContacts": 42,
    "unreadCount": 5
  }
}
```

### 4. Mark Contact as Read

```
PUT /api/contacts/{id}/mark-read
Authorization: Bearer {admin_token}

Response (200 OK):
{
  "success": true,
  "message": "Contact marked as read",
  "data": { ... contact object ... }
}
```

### 5. Delete Contact

```
DELETE /api/contacts/{id}
Authorization: Bearer {admin_token}

Response (200 OK):
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

## Frontend Integration

### JavaScript/Fetch Example

```javascript
async function submitContactForm(formData) {
  try {
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("Message sent successfully!");
      // Clear form
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### React Example

```jsx
import { useState } from "react";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        alert("Message sent successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }
    } catch (error) {
      alert("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        required
      />
      <input
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        required
      />
      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

## Database Schema

```sql
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Contact_email_idx" ON "Contact"("email");
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");
CREATE INDEX "Contact_isRead_idx" ON "Contact"("isRead");
```

## Admin Dashboard Usage

1. **View all contacts**: `GET /api/contacts?page=1&limit=20`
2. **Get unread count**: `GET /api/contacts/dashboard/stats`
3. **Mark as read**: `PUT /api/contacts/{id}/mark-read`
4. **Delete old contacts**: `DELETE /api/contacts/{id}`

## Security

- Public endpoint (`POST /api/contacts`) doesn't require authentication
- All admin endpoints require authentication + admin role
- Input validation is built-in
- All fields are required in the form submission
