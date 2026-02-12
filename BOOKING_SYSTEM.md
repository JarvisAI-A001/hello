# ModelStack AI Booking & CRM System

## Overview
A complete, enterprise-grade booking system with intelligent intent recognition, automated reminders, and comprehensive client management dashboard.

---

## Part 1: Intent Recognition Engine

### How It Works

The AI continuously analyzes chat messages to detect booking intent and extract necessary information.

**Three-Step Process:**

1. **Intent Detection**
   - Scans for booking keywords: "book", "schedule", "appointment", "meeting", "consultation", etc.
   - Calculates confidence score based on keyword frequency
   - Requires minimum 2 keywords or 30% confidence threshold

2. **Entity Extraction**
   - **WHO**: Extracts name (capitalized words) and email (regex pattern matching)
   - **WHAT**: Identifies service type from context (repair, setup, audit, etc.)
   - **WHEN**: Parses dates (Monday, Jan 15, today) and times (3pm, 15:30, 3:30pm)

3. **Validation Loop**
   - Identifies missing information
   - Generates follow-up questions automatically
   - Confirms extracted data before booking

### Usage in Widget

```typescript
import { detectBookingIntent, generateFollowUpQuestion, isBookingComplete } from '@/services/intentRecognition';

// In chat message handler:
const intent = detectBookingIntent(userMessage, conversationHistory);

if (intent.hasBookingIntent) {
  if (!isBookingComplete(intent)) {
    const followUp = generateFollowUpQuestion(intent, messageCount);
    // Send followUp to user
  } else {
    // Show booking confirmation or redirect to booking page
    const details = extractBookingDetails(intent);
    // Create appointment
  }
}
```

---

## Part 2: Professional Booking Page

### Features

**Multi-Step Form**
- Step 1: Service Selection (Consultation, Setup, Audit, Training)
- Step 2: Personal Details (Name, Email, Timezone)
- Step 3: Date & Time Selection (Calendar with live availability)
- Step 4: Confirmation Review

**Live Availability Sync**
- Automatic timezone detection
- Shows only future dates (excluding weekends)
- Filters past time slots on current day
- Real-time slot availability

**Visual Elements**
- Glowing progress bar showing current step
- Service cards with pricing
- Interactive calendar and time grid
- Glassmorphic design with gradients

### Accessing the Page

```
/booking/:botId - Public booking page for a specific bot
```

Example: `http://localhost:8080/booking/your-bot-id`

### Service Options

| Service | Price | Duration |
|---------|-------|----------|
| Consultation | $49 | 30 min |
| Bot Setup | $199 | 1-2 hours |
| AI Audit | $299 | 1 hour |
| Training | $149 | 1 hour |

---

## Part 3: Admin Bookings Dashboard

### Accessing the Dashboard

```
/admin/bookings - Comprehensive appointment and client management
```

### Key Features

**Statistics Overview**
- Pending appointments count
- Confirmed appointments count
- Completed sessions count
- Total unique clients

**Appointments Tab**
- View all bookings with full details
- Filter by status (pending, confirmed, completed, cancelled)
- Search by name, email, or service
- Edit appointment status
- Delete appointments
- Real-time updates

**Client History Tab**
- Complete client database
- Total bookings per client
- First and last booking dates
- Source tracking (which bot referred them)
- Identify repeat customers

### Status Management

| Status | Description |
|--------|-------------|
| Pending | Awaiting client confirmation |
| Confirmed | Locked in, reminder will be sent |
| Completed | Session finished successfully |
| Cancelled | Cancelled by client or admin |

---

## Part 4: Automated Reminders

### How It Works

**Reminder Processor**
- Runs every 5 minutes
- Checks all confirmed appointments
- Sends reminders 1 hour before appointment
- Logs all reminder activity

**Reminder Methods**
- Email reminders with formatted appointment details
- SMS reminders (if phone number available)
- All reminders logged to `reminder_logs` table

### Setup

In your app initialization (e.g., `useEffect` in App.tsx):

```typescript
import { startReminderProcessor } from '@/services/reminderService';

useEffect(() => {
  const timer = startReminderProcessor();
  return () => clearInterval(timer);
}, []);
```

### Manual Reminder (for testing)

```typescript
import { sendManualReminder } from '@/services/reminderService';

// Send reminder for specific appointment
await sendManualReminder('appointment-id-here');
```

### Email Template

```
Subject: Reminder: Your [Service] appointment is coming up!

Hello [Name],

This is a friendly reminder that you have an appointment scheduled in 60 minutes.

Appointment Details:
- Service: [Service Type]
- Date: [Full Date]
- Time: [Time] [Timezone]
- Status: [Confirmed]

If you need to reschedule or have any questions, please reply to this email or contact us.

Best regards,
ModelStack AI Team
```

---

## Database Schema

### appointments table

```sql
- id: UUID (Primary Key)
- bot_id: text (Which bot generated this)
- session_id: UUID (Link to chat session)
- name: text (Client name)
- email: text (Client email)
- phone: text (Client phone - optional)
- service: text (Service type)
- date: date (Appointment date)
- time: time (Appointment time)
- status: text (pending, confirmed, completed, cancelled)
- timezone: text (Client timezone)
- reminder_sent_at: timestamp (When reminder was sent)
- notes: text (Any notes)
- created_at: timestamp
- updated_at: timestamp
```

### reminder_logs table

```sql
- id: UUID (Primary Key)
- appointment_id: UUID (FK to appointments)
- reminder_type: text (email or sms)
- sent_at: timestamp
- status: text (sent or failed)
- error_message: text (If failed)
- created_at: timestamp
```

### waitlist table

```sql
- id: UUID (Primary Key)
- bot_id: text
- name: text
- email: text
- phone: text (optional)
- preferred_date: date
- preferred_service: text
- position: integer (Order in waitlist)
- status: text (waiting, notified, booked)
- created_at: timestamp
```

---

## Integration with Chat Widget

### Step-by-Step Flow

1. **User messages in chat**
   ```
   User: "I'd like to schedule a consultation with someone"
   AI: *Detects booking intent*
   ```

2. **AI asks for details**
   ```
   AI: "I'd love to help! What's your name?"
   User: "My name is John Smith"
   AI: "And what's the best email to reach you at?"
   User: "john@example.com"
   AI: "When would you like to schedule? (e.g., Tuesday at 3 PM)"
   User: "Next Tuesday at 2 PM works"
   ```

3. **Confirmation**
   ```
   AI: "Perfect! I have you down for Tuesday, January 15th at 2:00 PM 
        for a Consultation. Should I finalize that?"
   User: "Yes, let's do it"
   ```

4. **Options**
   - Option A: Create appointment directly
   - Option B: Redirect to booking page for payment/confirmation
   - Option C: Generate booking link for later

---

## Advanced Features

### Waitlist System

When fully booked, automatically switch to waitlist mode:

```typescript
// Check if fully booked
const bookedCount = appointments.filter(a => a.date === selectedDate).length;
if (bookedCount >= MAX_SLOTS) {
  // Show "Join Waitlist" instead of booking
  addToWaitlist(userDetails);
}
```

### Recurring Appointments

```sql
ALTER TABLE appointments ADD COLUMN recurring_schedule text;
-- Options: 'daily', 'weekly', 'bi-weekly', 'monthly'
```

### Client Lifecycle

Track client journey:
- First booking → source tracking
- Return customers → frequency
- Completed → satisfaction
- Last booking → re-engagement opportunity

---

## Configuration

### Edit Reminder Timing

In `reminderService.ts`:

```typescript
const DEFAULT_CONFIG: ReminderConfig = {
  minutesBefore: 60, // Change to 30, 120, etc.
  includeZoomLink: false, // Set true if using Zoom
};
```

### Edit Time Slots

In `Booking.tsx`:

```typescript
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", // Edit as needed
  // ...
];
```

### Edit Services & Pricing

In `Booking.tsx`:

```typescript
const SERVICES = [
  { id: "consultation", label: "Consultation", description: "...", price: "$49" },
  // Add/remove services
];
```

---

## Testing

### Test Booking Page

1. Navigate to: `http://localhost:8080/booking/test-bot-id`
2. Fill out the form
3. Check database: `supabase` → `appointments` table

### Test Intent Recognition

```typescript
import { detectBookingIntent } from '@/services/intentRecognition';

const result = detectBookingIntent("I'd like to schedule an appointment for next Tuesday at 3 PM for a consultation. My name is John Doe and my email is john@example.com");

console.log(result);
// {
//   hasBookingIntent: true,
//   confidence: 0.8,
//   extractedData: {
//     who: { name: "John", email: "john@example.com" },
//     what: "consultation",
//     when: { date: "next Tuesday", time: "3 PM" }
//   },
//   requiresFollowUp: { name: false, email: false, service: false, dateTime: false }
// }
```

### Test Reminders

```typescript
import { sendManualReminder } from '@/services/reminderService';

// Send test reminder for an appointment
await sendManualReminder('appointment-uuid-here');
```

---

## Next Steps

1. **Email Service**: Connect SendGrid or Mailgun for emails
2. **SMS Service**: Integrate Twilio for SMS reminders
3. **Payment Integration**: Add Stripe for booking payments
4. **Calendar Sync**: Export to Google Calendar or Outlook
5. **Zoom Integration**: Auto-generate Zoom links in reminders
6. **Analytics**: Track booking conversion rates and sources

---

## Support

For issues or questions about the booking system, refer to:
- Intent Recognition: `src/services/intentRecognition.ts`
- Booking Page: `src/pages/Booking.tsx`
- Admin Dashboard: `src/pages/BookingsAdmin.tsx`
- Reminders: `src/services/reminderService.ts`
- Database: `supabase/migrations/20260204_booking_system.sql`
