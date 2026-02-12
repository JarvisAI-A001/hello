# Booking System Quick Start Guide

## 🚀 Installation & Setup

### Step 1: Files Created
Your booking system includes 4 new core files:

```
src/
├── services/
│   ├── intentRecognition.ts        # AI Intent Detection Engine
│   └── reminderService.ts           # Automated Reminders System
├── pages/
│   ├── Booking.tsx                  # Public Booking Page
│   └── BookingsAdmin.tsx            # Admin Dashboard
└── App.tsx                          # Updated with new routes
```

### Step 2: Database Migration

Run this SQL in your Supabase dashboard:

```sql
-- Navigate to: SQL Editor → New Query
-- Copy the contents of: supabase/migrations/20260204_booking_system.sql
-- Execute the query
```

This creates:
- Enhanced `appointments` table with new fields
- `reminder_logs` table for tracking
- `waitlist` table for overflow bookings

### Step 3: Access the Pages

**Public Booking Page:**
```
http://localhost:8080/booking/YOUR_BOT_ID
```

**Admin Dashboard:**
```
http://localhost:8080/admin/bookings
```

---

## 🎯 How to Use

### For Users: Making a Booking

1. Navigate to the booking page for a specific bot
2. Select a service (Consultation, Setup, Audit, Training)
3. Enter name, email, and timezone is auto-detected
4. Choose date and time from available slots
5. Review and confirm booking
6. Success! Confirmation email sent

### For Admins: Managing Bookings

1. Go to `/admin/bookings`
2. **View Statistics**: See pending, confirmed, and completed bookings
3. **Manage Appointments**: 
   - Search by name, email, or service
   - Filter by status
   - Update status (pending → confirmed → completed)
   - Delete bookings
4. **Track Clients**: View client history, repeat customers, and booking sources

---

## 🧠 AI Intent Recognition

The AI automatically detects booking intent in chat conversations.

### Example Conversation:

```
User: "I'd like to schedule a consultation"
AI: *Detects booking intent* "I'd love to help! What's your name?"

User: "John Smith"
AI: "And your email address?"

User: "john@example.com"
AI: "When would you like to meet? (e.g., Tuesday at 3 PM)"

User: "Next Tuesday at 2 PM"
AI: "Perfect! I have you for Tuesday, Jan 15 at 2:00 PM for Consultation. 
     Confirm? [Yes/No]"

User: "Yes"
AI: "Booking confirmed! Check your email for details."
→ Appointment created in database
```

### Using in Your Chat Widget:

```typescript
// In widget-bot/index.ts or your chat handler:
import { 
  detectBookingIntent, 
  generateFollowUpQuestion,
  isBookingComplete,
  extractBookingDetails 
} from '@/services/intentRecognition';

const intent = detectBookingIntent(userMessage, conversationHistory);

if (intent.hasBookingIntent && intent.confidence > 0.3) {
  if (!isBookingComplete(intent)) {
    // Ask for missing info
    const question = generateFollowUpQuestion(intent, messageCount);
    botResponse = question;
  } else {
    // All info collected, create booking
    const details = extractBookingDetails(intent);
    // Save to database
    await supabase.from('appointments').insert({
      name: details.name,
      email: details.email,
      service: details.service,
      date: parsedDate,
      time: parsedTime,
      bot_id: botId,
      status: 'pending'
    });
    botResponse = `Great! I've scheduled you for ${details.service} on ${details.datetime}. Check your email!`;
  }
}
```

---

## ⏰ Automated Reminders

Reminders are sent **1 hour before** confirmed appointments.

### Setup Reminders (in App.tsx or main.tsx):

```typescript
import { startReminderProcessor } from '@/services/reminderService';

useEffect(() => {
  // Start checking for reminders every 5 minutes
  const timer = startReminderProcessor();
  
  // Cleanup when component unmounts
  return () => clearInterval(timer);
}, []);
```

### What Reminders Include:

**Email:**
```
Subject: Reminder: Your [Service] appointment is coming up!

Hello [Name],

This is a friendly reminder that you have an appointment scheduled in 60 minutes.

Appointment Details:
- Service: [Service Type]
- Date: [Full Date]
- Time: [Time] [Timezone]
- Status: Confirmed

If you need to reschedule or have any questions, please reply to this email.

Best regards,
ModelStack AI Team
```

**SMS (if phone provided):**
```
Hi [Name], reminder: Your [Service] appointment is in 60 minutes at [Time]. See you soon!
```

### Test Reminders:

```typescript
import { sendManualReminder } from '@/services/reminderService';

// Send immediate test reminder
await sendManualReminder('appointment-uuid-here');
```

---

## 📊 Admin Dashboard Features

### Statistics Cards
- **Pending**: Awaiting confirmation
- **Confirmed**: Locked in, reminders will be sent
- **Completed**: Finished sessions
- **Total Clients**: Unique email addresses

### Appointments Table
- Search: By name, email, service type
- Filter: By status (all, pending, confirmed, completed, cancelled)
- Actions: Edit status, delete booking
- Real-time: Updates instantly

### Client Database
- Email address
- Total bookings count
- First booking date
- Last booking date
- Booking source (which bot)

---

## 📅 Customization Guide

### Change Service Options

Edit `src/pages/Booking.tsx`:

```typescript
const SERVICES = [
  { id: "consultation", label: "Consultation", description: "One-on-one expert advice", price: "$49" },
  { id: "setup", label: "Bot Setup", description: "Full AI bot configuration", price: "$199" },
  // Add your own services
  { id: "custom", label: "Custom Service", description: "Your description", price: "$XXX" },
];
```

### Change Time Slots

Edit `src/pages/Booking.tsx`:

```typescript
const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", // Start earlier or later
  "09:30 AM", "10:00 AM", "10:30 AM",
  // ... up to end time
  "05:00 PM", "05:30 PM" // End time
];
```

### Change Reminder Timing

Edit `src/services/reminderService.ts`:

```typescript
const DEFAULT_CONFIG: ReminderConfig = {
  minutesBefore: 60,    // Change to 30, 120, etc.
  includeZoomLink: false, // Set true if using Zoom
};
```

### Change Available Days

Edit `src/pages/Booking.tsx` - `getAvailableDates()` function:

```typescript
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 30; i++) { // Show 30 days ahead
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) { // Skip weekends
      dates.push(/* ... */);
    }
  }
  
  return dates.slice(0, 14); // Show first 14 available days
};
```

---

## 🔌 Integration Points

### 1. Chat Widget Integration

When user says something like "I want to book an appointment", AI should:
- Detect the intent automatically
- Ask clarifying questions
- Collect name, email, service, date/time
- Create appointment in database OR redirect to booking page

### 2. Email Service Integration

For actual email reminders, connect SendGrid/Mailgun:

```typescript
// In reminderService.ts, replace the fetch call:
const response = await sendgrid.send({
  to: appointment.email,
  from: 'noreply@modelstack.ai',
  subject: subject,
  html: body,
});
```

### 3. SMS Service Integration

For SMS reminders, connect Twilio:

```typescript
// In reminderService.ts:
const response = await twilio.messages.create({
  body: message,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: appointment.phone,
});
```

### 4. Calendar Export

Add Google Calendar or Outlook sync:

```typescript
// Add to BookingsAdmin.tsx
const exportToCalendar = (appointment) => {
  const startTime = new Date(`${appointment.date}T${appointment.time}`);
  // Generate .ics file or Google Calendar link
};
```

---

## 🧪 Testing Checklist

- [ ] Navigate to `/booking/test-bot` and complete a booking
- [ ] Verify appointment appears in `/admin/bookings`
- [ ] Try filtering by status in admin dashboard
- [ ] Search by name/email in admin dashboard
- [ ] Update appointment status (pending → confirmed)
- [ ] Check that reminder_logs are created when status is confirmed
- [ ] Test intent recognition with various messages
- [ ] Verify timezone auto-detection in booking form
- [ ] Test that past time slots are filtered on current day
- [ ] Verify email/SMS sent (if services connected)

---

## 📋 Database Structure

### appointments table

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  bot_id TEXT,                    -- Which bot generated this
  name TEXT,                       -- Client name
  email TEXT,                      -- Client email
  phone TEXT,                      -- Client phone (optional)
  service TEXT,                    -- Service type
  date DATE,                       -- Appointment date
  time TIME,                       -- Appointment time
  status TEXT,                     -- pending, confirmed, completed, cancelled
  timezone TEXT,                   -- Client's timezone
  reminder_sent_at TIMESTAMP,      -- When reminder was sent
  notes TEXT,                      -- Any notes
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### reminder_logs table

```sql
CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY,
  appointment_id UUID,             -- FK to appointments
  reminder_type TEXT,              -- 'email' or 'sms'
  sent_at TIMESTAMP,               -- When sent
  status TEXT,                     -- 'sent' or 'failed'
  error_message TEXT,              -- If failed
  created_at TIMESTAMP
);
```

### waitlist table

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY,
  bot_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  preferred_date DATE,
  preferred_service TEXT,
  position INTEGER,
  status TEXT,                     -- 'waiting', 'notified', 'booked'
  created_at TIMESTAMP
);
```

---

## 🚨 Troubleshooting

### Booking page shows blank?
- Check if you're using correct bot ID: `/booking/actual-bot-id`
- Verify Supabase connection is working
- Check browser console for errors

### Admin dashboard not loading?
- Ensure you're navigated to `/admin/bookings`
- Check Supabase RLS policies are correct
- Verify appointments table exists in database

### Reminders not sending?
- Email/SMS services not configured (expected for MVP)
- Check `reminder_logs` table to see if attempts were made
- Verify appointment status is "confirmed"
- Check browser console for errors

### Intent recognition not working?
- Requires at least 2 booking keywords to detect
- Check conversation history is being passed correctly
- Test with: "I'd like to schedule an appointment"

---

## 📞 Support & Next Steps

### Immediate Next Steps:
1. Run database migration
2. Test booking page with test bot ID
3. Verify appointments appear in admin dashboard
4. Start reminder processor in your app

### Future Enhancements:
1. Connect SendGrid for email
2. Connect Twilio for SMS
3. Add Stripe for payment processing
4. Add Google Calendar sync
5. Add Zoom meeting links
6. Add recurring appointments
7. Build client portal (users can view/cancel their bookings)
8. Add booking analytics

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `src/services/intentRecognition.ts` | AI intent detection and entity extraction |
| `src/services/reminderService.ts` | Automated email/SMS reminders |
| `src/pages/Booking.tsx` | Multi-step booking form (public) |
| `src/pages/BookingsAdmin.tsx` | Appointment management dashboard |
| `supabase/migrations/20260204_booking_system.sql` | Database schema |
| `BOOKING_SYSTEM.md` | Comprehensive documentation |

---

## 🎉 You're All Set!

Your professional booking system is ready to use. Start by:
1. Testing a booking at `/booking/your-bot-id`
2. Viewing it in the admin dashboard at `/admin/bookings`
3. Integrating intent recognition into your chat widget

For detailed information, see `BOOKING_SYSTEM.md`
