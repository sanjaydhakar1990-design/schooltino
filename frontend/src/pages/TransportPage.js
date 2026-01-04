import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Bus, MapPin, Users, Phone, Car, Plus, RefreshCw,
  Route, Navigation, Clock, Search, Filter, Eye,
  AlertCircle, CheckCircle2, Settings, User, Fuel
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TransportPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [liveTracking, setLiveTracking] = useState([]);
  const [trackingInterval, setTrackingInterval] = useState(null);

  const schoolId = user?.school_id || 'school123';

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_number: '',
    vehicle_type: 'bus',
    capacity: 40,
    driver_name: '',
    driver_phone: '',
    conductor_name: '',
    conductor_phone: ''
  });

  const [routeForm, setRouteForm] = useState({
    route_name: '',
    route_number: '',
    morning_start_time: '07:00',
    evening_start_time: '14:00',
    monthly_fee: 1500,
    stops: []
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vehiclesRes, routesRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/transport/vehicles?school_id=${schoolId}`),
        fetch(`${API_URL}/api/transport/routes?school_id=${schoolId}`),
        fetch(`${API_URL}/api/transport/analytics?school_id=${schoolId}`)
      ]);
      
      const vehiclesData = await vehiclesRes.json();
      const routesData = await routesRes.json();
      const analyticsData = await analyticsRes.json();
      
      setVehicles(vehiclesData.vehicles || []);
      setRoutes(routesData.routes || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchLiveTracking = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/transport/track-all?school_id=${schoolId}`);
      const data = await res.json();
      setLiveTracking(data.vehicles || []);
    } catch (error) {
      console.error('Tracking error:', error);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
    fetchLiveTracking();
    
    // Auto-refresh tracking every 10 seconds
    const interval = setInterval(fetchLiveTracking, 10000);
    setTrackingInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, fetchLiveTracking]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.vehicle_number || !vehicleForm.driver_name) {
      toast.error('Vehicle number aur Driver name required hai');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/transport/vehicles?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Vehicle added!');
        setShowAddVehicle(false);
        setVehicleForm({ vehicle_number: '', vehicle_type: 'bus', capacity: 40, driver_name: '', driver_phone: '', conductor_name: '', conductor_phone: '' });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to add vehicle');
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.route_name || !routeForm.route_number) {
      toast.error('Route name aur number required hai');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/transport/routes?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Route created!');
        setShowAddRoute(false);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to create route');
    }
  };

  return (
    <div className="space-y-6" data-testid="transport-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bus className="w-8 h-8 text-amber-500" />
            Transport Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Vehicle Tracking, Routes & Student Transport
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicles</p>
                  <p className="text-3xl font-bold">{analytics.total_vehicles}</p>
                </div>
                <Bus className="w-10 h-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Routes</p>
                  <p className="text-3xl font-bold">{analytics.total_routes}</p>
                </div>
                <Route className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-3xl font-bold">{analytics.students_using_transport}</p>
                </div>
                <Users className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On Route</p>
                  <p className="text-3xl font-bold">{liveTracking.filter(v => v.status === 'on_route').length}</p>
                </div>
                <Navigation className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tracking" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
        </TabsList>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-green-500 animate-pulse" />
                Live Vehicle Tracking
              </CardTitle>
              <CardDescription>
                Real-time vehicle locations (GPS SIMULATED - Live GPS pending)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveTracking.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No vehicles to track
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {liveTracking.map((vehicle) => (
                    <Card key={vehicle.id} className={`border-l-4 ${vehicle.status === 'on_route' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Bus className="w-5 h-5" />
                              {vehicle.vehicle_number}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Driver: {vehicle.driver_name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {vehicle.driver_phone}
                            </p>
                          </div>
                          <Badge variant={vehicle.status === 'on_route' ? 'default' : 'secondary'}>
                            {vehicle.status === 'on_route' ? 'Moving' : 'Stopped'}
                          </Badge>
                        </div>
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Lat:</span> {vehicle.location?.lat?.toFixed(4)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Lng:</span> {vehicle.location?.lng?.toFixed(4)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Speed:</span> {vehicle.location?.speed} km/h
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  GPS tracking is currently SIMULATED. Real GPS device integration coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowAddVehicle(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10">
                      <Bus className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{vehicle.vehicle_number}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{vehicle.vehicle_type} • {vehicle.capacity} seats</p>
                    </div>
                    <Badge variant="outline">{vehicle.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{vehicle.driver?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{vehicle.driver?.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowAddRoute(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
          </div>
          <div className="grid gap-4">
            {routes.map((route) => (
              <Card key={route.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10">
                        <Route className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{route.route_name}</h3>
                        <p className="text-sm text-muted-foreground">Route #{route.route_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{route.monthly_fee}/month</p>
                      <p className="text-sm text-muted-foreground">{route.total_students || 0} students</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Morning: {route.morning_start_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Evening: {route.evening_start_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {route.stops?.length || 0} stops
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Vehicle Number *</label>
                <Input
                  value={vehicleForm.vehicle_number}
                  onChange={(e) => setVehicleForm({...vehicleForm, vehicle_number: e.target.value})}
                  placeholder="UP32 AB 1234"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={vehicleForm.vehicle_type}
                  onChange={(e) => setVehicleForm({...vehicleForm, vehicle_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="bus">Bus</option>
                  <option value="van">Van</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <Input
                  type="number"
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm({...vehicleForm, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Driver Name *</label>
                <Input
                  value={vehicleForm.driver_name}
                  onChange={(e) => setVehicleForm({...vehicleForm, driver_name: e.target.value})}
                  placeholder="Driver name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Driver Phone</label>
                <Input
                  value={vehicleForm.driver_phone}
                  onChange={(e) => setVehicleForm({...vehicleForm, driver_phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Conductor Name</label>
                <Input
                  value={vehicleForm.conductor_name}
                  onChange={(e) => setVehicleForm({...vehicleForm, conductor_name: e.target.value})}
                  placeholder="Conductor name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddVehicle(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                Add Vehicle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Route Dialog */}
      <Dialog open={showAddRoute} onOpenChange={setShowAddRoute}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Route</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRoute} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Route Name *</label>
                <Input
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({...routeForm, route_name: e.target.value})}
                  placeholder="Gomti Nagar Route"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Route Number *</label>
                <Input
                  value={routeForm.route_number}
                  onChange={(e) => setRouteForm({...routeForm, route_number: e.target.value})}
                  placeholder="R-01"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Morning Start</label>
                <Input
                  type="time"
                  value={routeForm.morning_start_time}
                  onChange={(e) => setRouteForm({...routeForm, morning_start_time: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Evening Start</label>
                <Input
                  type="time"
                  value={routeForm.evening_start_time}
                  onChange={(e) => setRouteForm({...routeForm, evening_start_time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Monthly Fee (₹)</label>
              <Input
                type="number"
                value={routeForm.monthly_fee}
                onChange={(e) => setRouteForm({...routeForm, monthly_fee: parseFloat(e.target.value)})}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddRoute(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Route
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
