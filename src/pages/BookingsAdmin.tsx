import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock,
  MessageSquare,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from "lucide-react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
  bot_id: string;
}

interface ClientHistory {
  email: string;
  totalBookings: number;
  firstBooking: string;
  lastBooking: string;
  source: string;
}

export default function BookingsAdmin() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientHistory, setClientHistory] = useState<Map<string, ClientHistory>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editedStatus, setEditedStatus] = useState("");

  // Statistics
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const totalRevenue = appointments
    .filter((a) => a.status === "completed")
    .length * 199; // Average price

  // Fetch appointments and build client history
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .order("date", { ascending: false });

        if (error) throw error;

        const typedData = (data || []).map((d: any) => ({
          ...d,
          status: (d.status as "pending" | "confirmed" | "completed" | "cancelled") || "pending"
        }));
        setAppointments(typedData);

        // Build client history map
        const history = new Map<string, ClientHistory>();
        for (const apt of data || []) {
          if (!history.has(apt.email)) {
            history.set(apt.email, {
              email: apt.email,
              totalBookings: 0,
              firstBooking: apt.created_at,
              lastBooking: apt.created_at,
              source: apt.bot_id,
            });
          }
          const client = history.get(apt.email)!;
          client.totalBookings++;
          client.lastBooking = apt.created_at;
          if (new Date(apt.created_at) < new Date(client.firstBooking)) {
            client.firstBooking = apt.created_at;
          }
        }
        setClientHistory(history);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedAppointment || !editedStatus) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: editedStatus })
        .eq("id", selectedAppointment.id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === selectedAppointment.id
            ? { ...apt, status: editedStatus as any }
            : apt
        )
      );

      setIsEditDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      apt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const appointmentDays = Array.from(new Set(appointments.map((apt) => apt.date))).map(
    (date) => new Date(`${date}T00:00:00`)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "confirmed":
        return <Clock3 className="w-4 h-4 text-blue-500" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <MessageSquare className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Bookings & CRM</h1>
        <p className="text-muted-foreground">Manage appointments, track clients, and monitor bookings</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{confirmedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Scheduled appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{completedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Finished sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{clientHistory.size}</p>
            <p className="text-xs text-muted-foreground mt-1">Unique contacts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="clients">Client History</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>Manage and track all bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Search by name, email, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No appointments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{apt.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{apt.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{apt.service}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(`${apt.date}T${apt.time}`).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(apt.status)}
                              <span className="text-sm capitalize">{apt.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setEditedStatus(apt.status);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDelete(apt.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Days with appointments are highlighted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <CalendarUI
                  mode="single"
                  modifiers={{ hasAppointment: appointmentDays }}
                  modifiersClassNames={{
                    hasAppointment: "bg-primary/15 text-primary font-semibold"
                  }}
                  className="rounded-md border"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-primary/60" />
                <span>Appointment day</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client History Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Database</CardTitle>
              <CardDescription>View client booking history and source tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Email</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>First Booking</TableHead>
                      <TableHead>Last Booking</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(clientHistory.values()).map((client) => (
                      <TableRow key={client.email}>
                        <TableCell className="font-medium">{client.email}</TableCell>
                        <TableCell>
                          <Badge>{client.totalBookings}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(client.firstBooking).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(client.lastBooking).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{client.source || "Direct"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Appointment Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedAppointment?.name}'s appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={editedStatus} onValueChange={setEditedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>Update Status</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
