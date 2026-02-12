import { supabase } from "@/integrations/supabase/client";

interface ReminderConfig {
  minutesBefore: number;
  emailTemplate?: string;
  includeZoomLink?: boolean;
}

const DEFAULT_CONFIG: ReminderConfig = {
  minutesBefore: 60, // 1 hour before
  includeZoomLink: false,
};

/**
 * Format appointment details into a readable string
 */
function formatAppointmentDetails(appointment: any): string {
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
  return `
Appointment Details:
- Service: ${appointment.service}
- Date: ${appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
- Time: ${appointment.time} ${appointment.timezone || 'UTC'}
- Status: ${appointment.status}
  `;
}

/**
 * Generate email reminder text
 */
function generateEmailReminder(appointment: any, config: ReminderConfig = DEFAULT_CONFIG): {
  subject: string;
  body: string;
} {
  return {
    subject: `Reminder: Your ${appointment.service} appointment is coming up!`,
    body: `Hello ${appointment.name},

This is a friendly reminder that you have an appointment scheduled in ${config.minutesBefore} minutes.

${formatAppointmentDetails(appointment)}

If you need to reschedule or have any questions, please reply to this email or contact us.

Best regards,
ModelStack AI Team`,
  };
}

/**
 * Generate SMS reminder text
 */
function generateSmsReminder(appointment: any, config: ReminderConfig = DEFAULT_CONFIG): string {
  return `Hi ${appointment.name}, reminder: Your ${appointment.service} appointment is in ${config.minutesBefore} minutes at ${appointment.time}. See you soon!`;
}

/**
 * Check if reminder should be sent (1 hour before appointment)
 */
function shouldSendReminder(appointment: any): boolean {
  const appointmentTime = new Date(`${appointment.date}T${appointment.time}`);
  const now = new Date();
  const timeDiff = appointmentTime.getTime() - now.getTime();
  const minutesUntilAppointment = timeDiff / (1000 * 60);

  // Send reminder between 61 and 59 minutes before (1-hour window to catch late sends)
  return minutesUntilAppointment > 59 && minutesUntilAppointment < 61;
}

/**
 * Send email reminder via edge function or API
 */
async function sendEmailReminder(
  appointment: any,
  config: ReminderConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; message: string }> {
  try {
    const { subject, body } = generateEmailReminder(appointment, config);

    // Call Supabase edge function or external email service
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: appointment.email,
        subject,
        html: body.replace(/\n/g, '<br />'),
      }),
    });

    if (!response.ok) throw new Error('Failed to send email');

    // Log reminder (table will be created after migration)
    // await supabase.from('reminder_logs').insert({
    //   appointment_id: appointment.id,
    //   reminder_type: 'email',
    //   status: 'sent',
    // });

    return { success: true, message: 'Email reminder sent' };
  } catch (error) {
    console.error('Email reminder error:', error);

    // Log error (table will be created after migration)
    // await supabase.from('reminder_logs').insert({
    //   appointment_id: appointment.id,
    //   reminder_type: 'email',
    //   status: 'failed',
    //   error_message: error instanceof Error ? error.message : 'Unknown error',
    // });

    return { success: false, message: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

/**
 * Send SMS reminder via Twilio or similar service
 */
async function sendSmsReminder(
  appointment: any,
  config: ReminderConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; message: string }> {
  if (!appointment.phone) {
    return { success: false, message: 'No phone number on file' };
  }

  try {
    const message = generateSmsReminder(appointment, config);

    // Call Supabase edge function or external SMS service
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: appointment.phone,
        message,
      }),
    });

    if (!response.ok) throw new Error('Failed to send SMS');

    // Log reminder (table will be created after migration)
    // await supabase.from('reminder_logs').insert({
    //   appointment_id: appointment.id,
    //   reminder_type: 'sms',
    //   status: 'sent',
    // });

    return { success: true, message: 'SMS reminder sent' };
  } catch (error) {
    console.error('SMS reminder error:', error);

    // Log error (table will be created after migration)
    // await supabase.from('reminder_logs').insert({
    //   appointment_id: appointment.id,
    //   reminder_type: 'sms',
    //   status: 'failed',
    //   error_message: error instanceof Error ? error.message : 'Unknown error',
    // });

    return { success: false, message: error instanceof Error ? error.message : 'Failed to send SMS' };
  }
}

/**
 * Process all pending reminders
 * Should be called periodically (every 5-10 minutes)
 */
export async function processPendingReminders(): Promise<void> {
  try {
    // Get all confirmed appointments that haven't had reminders sent
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'confirmed')
      .is('reminder_sent_at', null);

    if (error) throw error;

    for (const appointment of appointments || []) {
      if (shouldSendReminder(appointment)) {
        // Send email reminder
        const emailResult = await sendEmailReminder(appointment);
        console.log(`Email reminder for ${appointment.name}:`, emailResult);

        // Send SMS if phone is available
        if (appointment.phone) {
          const smsResult = await sendSmsReminder(appointment);
          console.log(`SMS reminder for ${appointment.name}:`, smsResult);
        }

        // Mark reminder as sent (field will be added after migration)
        // await supabase
        //   .from('appointments')
        //   .update({ reminder_sent_at: new Date().toISOString() })
        //   .eq('id', appointment.id);
      }
    }
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
}

/**
 * Start reminder processor (runs in background)
 * Call this on app initialization
 */
export function startReminderProcessor(): NodeJS.Timer {
  // Check for reminders every 5 minutes
  return setInterval(() => {
    processPendingReminders();
  }, 5 * 60 * 1000);
}

/**
 * Manually send reminder for testing
 */
export async function sendManualReminder(appointmentId: string): Promise<void> {
  try {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (!appointment) throw new Error('Appointment not found');

    await sendEmailReminder(appointment);
    if (appointment.phone) {
      await sendSmsReminder(appointment);
    }
  } catch (error) {
    console.error('Manual reminder error:', error);
  }
}
