import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BookingStep {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const BOOKING_STEPS: BookingStep[] = [
  { id: 1, title: "Service", icon: <AlertCircle className="w-4 h-4" /> },
  { id: 2, title: "Details", icon: <User className="w-4 h-4" /> },
  { id: 3, title: "Time", icon: <Clock className="w-4 h-4" /> },
  { id: 4, title: "Confirm", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const SERVICES = [
  { id: "consultation", label: "Consultation", description: "One-on-one expert advice", price: "$49" },
  { id: "setup", label: "Bot Setup", description: "Full AI bot configuration", price: "$199" },
  { id: "audit", label: "AI Audit", description: "Comprehensive system review", price: "$299" },
  { id: "training", label: "Training", description: "Team training & onboarding", price: "$149" },
];

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

export default function BookingPage() {
  const { botId } = useParams<{ botId?: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [timezone, setTimezone] = useState("UTC");
  
  // Form data
  const [selectedService, setSelectedService] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);

  // Detect timezone
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  // Get available dates (next 30 days, excluding weekends)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Skip weekends
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        dates.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        });
      }
    }
    return dates.slice(0, 14); // Show next 14 available days
  };

  const availableDates = getAvailableDates();

  // Filter available time slots based on selected date
  useEffect(() => {
    if (selectedDate === new Date().toISOString().split('T')[0]) {
      // If today, hide past times
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const filtered = TIME_SLOTS.filter(slot => {
        const [time, period] = slot.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : hours;
        const slotTime = adjustedHours * 60 + minutes;
        const currentTime = currentHour * 60 + currentMinutes;
        return slotTime > currentTime + 60; // Only future slots + 1 hour buffer
      });
      setAvailableSlots(filtered);
    } else {
      setAvailableSlots(TIME_SLOTS);
    }
  }, [selectedDate]);

  const handleBooking = async () => {
    if (!selectedService || !name || !email || !selectedDate || !selectedTime) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create appointment in database
      const { error: insertError } = await supabase
        .from("appointments")
        .insert({
          bot_id: botId || "unknown",
          name,
          email,
          phone: null,
          service: selectedService,
          date: selectedDate,
          time: selectedTime,
          status: "pending",
          notes: `Timezone: ${timezone}, Service: ${selectedService}`,
        });

      if (insertError) throw insertError;

      // Success!
      setIsSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedService("");
        setName("");
        setEmail("");
        setSelectedDate("");
        setSelectedTime("");
        setIsSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-500/50 bg-green-500/5">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-4">
              A confirmation email has been sent to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Schedule Your Consultation</h1>
          <p className="text-muted-foreground">Choose a time that works best for you</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {BOOKING_STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    currentStep >= step.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {step.icon}
                  <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                </button>
                {idx < BOOKING_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-1 flex-1 mx-2 transition-all",
                      currentStep > step.id ? "bg-accent" : "bg-secondary"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Your Service</CardTitle>
              <CardDescription>Choose the service that best fits your needs</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service.id);
                    setCurrentStep(2);
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    selectedService === service.id
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50 hover:bg-secondary/50"
                  )}
                >
                  <h3 className="font-semibold text-sm mb-1">{service.label}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                  <Badge variant="outline" className="text-xs">{service.price}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Personal Details */}
        {currentStep === 2 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Help us get to know you better</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Timezone</label>
                <Input
                  value={timezone}
                  disabled
                  className="bg-background/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Date & Time Selection */}
        {currentStep === 3 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Choose Date & Time</CardTitle>
              <CardDescription>Select a time slot that works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Select Date</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableDates.map((date) => (
                    <button
                      key={date.date}
                      onClick={() => setSelectedDate(date.date)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-sm font-medium",
                        selectedDate === date.date
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      {date.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Select Time</label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "p-2 rounded-lg border-2 transition-all text-xs font-medium",
                        selectedTime === slot
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(4)} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Confirm Your Booking</CardTitle>
              <CardDescription>Review your details before confirming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Service:</span>
                  <span className="font-semibold">
                    {SERVICES.find(s => s.id === selectedService)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-semibold">{name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-semibold">{email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Date & Time:</span>
                  <span className="font-semibold">
                    {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })} at {selectedTime}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleBooking}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
