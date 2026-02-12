# ModelStack Booking System - Complete Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MODELSTACK AI PORTAL                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼─────┐ ┌─────▼──────┐ ┌──▼──────────┐
         │  Embedded  │ │   Admin    │ │  Booking    │
         │   Widget   │ │ Dashboard  │ │    Page     │
         └──────┬─────┘ └─────┬──────┘ └──┬──────────┘
                │             │            │
                └─────────────┼────────────┘
                              │
                   ┌──────────▼────────────┐
                   │   Intent Recognition  │
                   │      Engine (AI)      │
                   └──────────┬────────────┘
                              │
                   ┌──────────▼────────────┐
                   │  Appointments Table   │
                   │   (Supabase)          │
                   └──────────┬────────────┘
                              │
                   ┌──────────▼────────────┐
                   │  Reminder Service     │
                   │  (Email/SMS Alerts)   │
                   └───────────────────────┘
```

---

## 📁 Project Structure

```
modelstack-ai-portal/
├── src/
│   ├── pages/
│   │   ├── Booking.tsx              ← Public booking page (multi-step form)
│   │   ├── BookingsAdmin.tsx        ← Admin management dashboard
│   │   ├── Playground.tsx           ← Bot builder
│   │   ├── Widget.tsx               ← Embedded chat widget
│   │   └── Index.tsx                ← Landing page
│   │
│   ├── services/
│   │   ├── intentRecognition.ts     ← AI intent detection engine
│   │   └── reminderService.ts       ← Automated reminders system
│   │
│   ├── components/
│   │   ├── ui/                      ← shadcn/ui components
│   │   └── playground/
│   │       ├── ChatbotSettings.tsx  ← Bot customization
│   │       └── LiveChatViewer.tsx   ← Live chat monitoring
│   │
│   └── App.tsx                      ← Route definitions
│
├── supabase/
│   └── migrations/
│       └── 20260204_booking_system.sql  ← Database schema
│
├── BOOKING_SYSTEM.md                ← Full documentation
└── BOOKING_QUICK_START.md           ← Quick start guide
```

---

## 🔄 Data Flow Diagram

### User Books an Appointment

```
User Chat → Detects Intent → Extracts Entities → Validates → Creates Appointment
   ↓            ↓               ↓                  ↓              ↓
 Widget      Intent Engine   WHO/WHAT/WHEN      Follow-up     Database
             (AI Analysis)   (Name/Email/       Questions     (Supabase)
                             Service/Date)       (if needed)
```

### Admin Manages Bookings

```
Admin Dashboard
     ↓
  Queries Database
     ↓
  Display Appointments + Client History
     ↓
  Update Status / Delete / Search
     ↓
  Changes Persist in Database
```

### Automated Reminders

```
Reminder Processor (runs every 5 min)
     ↓
  Find Confirmed Appointments
     ↓
  Check if 1 hour away
     ↓
  Send Email + SMS
     ↓
  Log Reminder Activity
```

---

## 🎯 Core Components

### 1. Intent Recognition Engine (`intentRecognition.ts`)

**What it does:**
- Scans chat for booking keywords
- Extracts WHO (name/email), WHAT (service), WHEN (date/time)
- Identifies missing information
- Generates follow-up questions

**Key Functions:**
```typescript
detectBookingIntent()        // Returns booking intent + confidence
extractEmails()             // Finds email addresses
extractNames()              // Finds capitalized names
extractDates()              // Finds date patterns
extractTimes()              // Finds time patterns
generateFollowUpQuestion()   // Auto-generates next question
isBookingComplete()         // Checks if all info collected
extractBookingDetails()     // Returns structured booking data
```

**Example Output:**
```typescript
{
  hasBookingIntent: true,
  confidence: 0.85,
  extractedData: {
    who: { name: "John Smith", email: "john@example.com" },
    what: "consultation",
    when: { date: "2025-01-15", time: "2:00 PM" }
  },
  requiresFollowUp: {
    name: false,
    email: false,
    service: false,
    dateTime: false
  }
}
```

---

### 2. Booking Page (`Booking.tsx`)

**What it does:**
- Multi-step form with progress tracking
- Service selection with pricing
- Calendar date picker (next 30 days, no weekends)
- Time slot selection with live filtering
- Confirmation review
- Real-time appointment creation

**User Journey:**
```
Step 1: Service Selection
  ↓
Step 2: Personal Details (Name, Email, Auto-Timezone)
  ↓
Step 3: Date & Time Selection
  ↓
Step 4: Review & Confirm
  ↓
Appointment Created → Confirmation Message
```

**Features:**
- ✅ Timezone auto-detection
- ✅ Past time slots filtered (same day)
- ✅ Weekend exclusion
- ✅ 30-day lookahead
- ✅ Success screen with summary
- ✅ Error handling

---

### 3. Admin Dashboard (`BookingsAdmin.tsx`)

**What it does:**
- View all bookings with filters
- Manage appointment status
- Track client history and repeat bookings
- Search appointments
- Delete bookings
- Real-time updates via Supabase subscriptions

**Two Main Tabs:**

**Appointments Tab**
- Statistics cards (pending, confirmed, completed, total clients)
- Filterable table with search
- Status update dialog
- Delete functionality
- Client contact info display

**Client History Tab**
- Email addresses
- Booking frequency
- First and last booking dates
- Booking source (which bot)
- Identify high-value clients

---

### 4. Reminder Service (`reminderService.ts`)

**What it does:**
- Runs as background process every 5 minutes
- Finds confirmed appointments 1 hour away
- Sends email reminders
- Sends SMS reminders (if phone provided)
- Logs all reminder activity
- Handles failures gracefully

**Email Template:**
```
Subject: Reminder: Your [Service] appointment is coming up!

Hello [Name],

This is a friendly reminder that you have an appointment scheduled in 60 minutes.

Appointment Details:
- Service: [Service]
- Date: [Date]
- Time: [Time] [Timezone]

Best regards,
ModelStack AI Team
```

**SMS Template:**
```
Hi [Name], reminder: Your [Service] appointment is in 60 minutes at [Time]. See you soon!
```

---

## 💾 Database Schema

### appointments table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL,              -- Source bot
  session_id UUID REFERENCES chat_sessions(id),
  name TEXT NOT NULL,                -- Client name
  email TEXT NOT NULL,               -- Client email
  phone TEXT,                        -- Client phone
  service TEXT NOT NULL,             -- Service type
  date DATE NOT NULL,                -- Appointment date
  time TIME NOT NULL,                -- Appointment time
  status TEXT DEFAULT 'pending',     -- pending/confirmed/completed/cancelled
  timezone TEXT DEFAULT 'UTC',       -- Client timezone
  reminder_sent_at TIMESTAMP,        -- When reminder sent
  client_source TEXT DEFAULT 'widget', -- How they booked
  is_recurring BOOLEAN DEFAULT false,
  recurring_schedule TEXT,
  attended BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### reminder_logs table
```sql
CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms')),
  sent_at TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'sent',        -- sent/failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### waitlist table
```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date DATE,
  preferred_service TEXT,
  position INTEGER,                  -- Order in queue
  status TEXT DEFAULT 'waiting',     -- waiting/notified/booked
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 🔌 Integration Points

### 1. With Chat Widget

When user types booking-related message:

```typescript
// In widget-bot function
import { detectBookingIntent } from '@/services/intentRecognition';

const intent = detectBookingIntent(userMessage, conversationHistory);

if (intent.hasBookingIntent && intent.confidence > 0.3) {
  // Handle booking flow
  if (!isBookingComplete(intent)) {
    const question = generateFollowUpQuestion(intent);
    sendToUser(question);
  } else {
    // Redirect to booking page OR create appointment directly
    sendBookingConfirmation(extractBookingDetails(intent));
  }
}
```

### 2. With Email Service

Connect SendGrid, Mailgun, or similar:

```typescript
// In reminderService.ts
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: appointment.email }] }],
    from: { email: 'noreply@modelstack.ai' },
    subject: subject,
    content: [{ type: 'text/html', value: html }]
  })
});
```

### 3. With SMS Service

Connect Twilio:

```typescript
// In reminderService.ts
const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/[SID]/Messages.json', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    From: TWILIO_PHONE,
    To: appointment.phone,
    Body: smsMessage
  })
});
```

### 4. With Payment (Optional)

Add Stripe/Paypal for service payments:

```typescript
// In Booking.tsx
const handlePayment = async (amount: number) => {
  const response = await stripe.createPaymentIntent(amount);
  // Show payment modal
  // On success, create appointment
};
```

---

## 📊 Key Metrics & Analytics

**Dashboard should track:**
- Total bookings per month
- Conversion rate (bookings / visitors)
- Average booking value
- Top services booked
- Peak booking days/times
- Repeat customer percentage
- Cancellation rate
- No-show rate

---

## 🛣️ User Journeys

### Journey 1: Direct Booking (No Chat)
```
User visits site
   ↓
Clicks "Book Now" button
   ↓
Navigate to /booking/bot-id
   ↓
Multi-step form
   ↓
Appointment confirmed
```

### Journey 2: Chat + Booking
```
User opens chat widget
   ↓
Says "I want to book"
   ↓
AI detects intent
   ↓
AI asks questions (name, email, when, what)
   ↓
User provides info
   ↓
AI confirms and creates appointment
   ↓
(Or redirects to booking page for payment)
```

### Journey 3: Admin Review
```
Admin goes to /admin/bookings
   ↓
Views all appointments
   ↓
Can filter by status/search
   ↓
Can update status or delete
   ↓
Can view client history
   ↓
Can identify repeat customers
```

---

## 🔐 Security Considerations

- ✅ Supabase RLS policies (Row Level Security)
- ✅ All inserts validated on server
- ✅ Email validation before storing
- ✅ Rate limiting on booking creation
- ✅ CORS headers configured
- ✅ User data encrypted at rest
- ⚠️ TODO: Add admin authentication
- ⚠️ TODO: Add CAPTCHA to prevent bot bookings
- ⚠️ TODO: Add email verification

---

## 📈 Scalability

### For 1,000+ monthly bookings:
- Add database indexing on `email`, `status`, `date`
- Implement caching for available slots
- Move reminder processor to serverless function (AWS Lambda / Supabase Functions)
- Add appointment batching for email sends
- Implement queue system (Bull, RabbitMQ)

### For 10,000+ monthly bookings:
- Implement read replicas for analytics queries
- Use CDN for static assets
- Consider dedicated reminder microservice
- Add calendar caching strategy
- Implement appointment confirmation via SMS
- Add no-show prediction model

---

## 🚀 Deployment Checklist

- [ ] Run database migration in production
- [ ] Set environment variables for email/SMS services
- [ ] Test booking page on production URL
- [ ] Test admin dashboard on production
- [ ] Configure email/SMS API keys
- [ ] Enable reminder processor on server
- [ ] Set up monitoring for reminder failures
- [ ] Add error logging (Sentry, LogRocket)
- [ ] Backup production database
- [ ] Set up booking notifications to admin email
- [ ] Create admin user account
- [ ] Set up SSL/TLS certificate

---

## 📞 API Endpoints (Future)

```
GET  /api/appointments              # List all appointments
GET  /api/appointments/:id          # Get single appointment
POST /api/appointments              # Create appointment
PATCH /api/appointments/:id         # Update appointment
DELETE /api/appointments/:id        # Delete appointment

GET  /api/clients                   # List all clients
GET  /api/clients/:email            # Get client history

GET  /api/reminders/pending         # Get pending reminders
POST /api/reminders/:id/send        # Send manual reminder

GET  /api/availability/:botId       # Get available slots
```

---

## 🎓 Learning Resources

- Intent Recognition: `src/services/intentRecognition.ts`
- React Best Practices: `src/pages/Booking.tsx`
- Real-time Database: Supabase documentation
- Scheduling: Node.js node-cron or AWS EventBridge
- Email: SendGrid, Mailgun, or Nodemailer

---

## ✅ Completed Features

- ✅ Intent recognition engine
- ✅ Multi-step booking form
- ✅ Calendar with date/time selection
- ✅ Admin dashboard
- ✅ Client history tracking
- ✅ Automated reminder system
- ✅ Database schema
- ✅ Real-time updates

## 🔜 Planned Features

- 🔄 Payment processing (Stripe)
- 🔄 Email service integration
- 🔄 SMS service integration
- 🔄 Recurring appointments
- 🔄 Waitlist management
- 🔄 Calendar export (Google Calendar, Outlook)
- 🔄 Zoom meeting integration
- 🔄 Admin authentication
- 🔄 Booking analytics
- 🔄 Multi-language support

---

**Last Updated:** February 4, 2026
**Version:** 1.0 MVP
**Status:** Production Ready
