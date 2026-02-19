import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  Bus, MapPin, Users, Phone, Car, Plus, RefreshCw,
  Route, Navigation, Clock, Search, Filter, Eye,
  AlertCircle, CheckCircle2, Settings, User, Fuel,
  Wifi, Bell, Smartphone
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

const API_URL = (process.env.REACT_APP_BACKEND_URL || '');

export default function TransportPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
    yearly_fee: 15000,
    stops: []
  });

  const [gpsDevices, setGpsDevices] = useState([]);
  const [showAddGps, setShowAddGps] = useState(false);
  const [gpsForm, setGpsForm] = useState({
    vehicle_id: '',
    device_imei: '',
    sim_number: '',
    device_brand: 'generic',
    server_ip: '',
    server_port: ''
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

  const fetchGpsDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/transport/gps-setup/status/${schoolId}`);
      const data = await res.json();
      setGpsDevices(data.vehicles || []);
    } catch (error) {
      console.error('GPS fetch error:', error);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
    fetchLiveTracking();
    fetchGpsDevices();
    
    const interval = setInterval(fetchLiveTracking, 10000);
    setTrackingInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, fetchLiveTracking, fetchGpsDevices]);

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

  const handleAddGpsDevice = async (e) => {
    e.preventDefault();
    if (!gpsForm.vehicle_id || !gpsForm.device_imei || !gpsForm.sim_number) {
      toast.error('Vehicle, IMEI aur SIM number required hai');
      return;
    }

    try {
      const params = new URLSearchParams({
        school_id: schoolId,
        vehicle_id: gpsForm.vehicle_id,
        device_imei: gpsForm.device_imei,
        sim_number: gpsForm.sim_number,
        device_brand: gpsForm.device_brand
      });
      if (gpsForm.server_ip) params.append('server_ip', gpsForm.server_ip);
      if (gpsForm.server_port) params.append('server_port', gpsForm.server_port);

      const res = await fetch(`${API_URL}/api/transport/gps-setup/add-device?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('GPS Device added successfully!');
        setShowAddGps(false);
        setGpsForm({ vehicle_id: '', device_imei: '', sim_number: '', device_brand: 'generic', server_ip: '', server_port: '' });
        fetchGpsDevices();
      }
    } catch (error) {
      toast.error('Failed to add GPS device');
    }
  };

  return (
    <div className="space-y-6" data-testid="transport-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bus className="w-8 h-8 text-amber-500" />
            {t('transport')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('live_tracking')}, {t('routes')} & {t('transport')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('refresh')}
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
                  <p className="text-sm text-muted-foreground">{t('vehicles')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('routes')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('students')}</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking">{t('live_tracking')}</TabsTrigger>
          <TabsTrigger value="vehicles">{t('vehicles')}</TabsTrigger>
          <TabsTrigger value="routes">{t('routes')}</TabsTrigger>
          <TabsTrigger value="nfc-gps">NFC & {t('gps_tracking')}</TabsTrigger>
        </TabsList>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-green-500 animate-pulse" />
                {t('live_tracking')}
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
                              {t('driver_name')}: {vehicle.driver_name}
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
              {t('add_vehicle')}
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
              {t('add_route')}
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
                      {route.yearly_fee > 0 && <p className="text-sm font-medium text-green-600">₹{route.yearly_fee}/year</p>}
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

        <TabsContent value="nfc-gps" className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <Wifi className="w-5 h-5 text-blue-600" />
              GPS & NFC Configuration
            </h3>
            <p className="text-sm text-gray-600 mb-4">GPS devices aur NFC cards ko configure karein. Vehicles mein GPS lagayein aur students ko NFC cards assign karein.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <Navigation className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">GPS Devices</h4>
                <p className="text-xs text-gray-500 mt-1">{gpsDevices.filter(d => d.gps_enabled).length} / {gpsDevices.length} vehicles configured</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">NFC Cards</h4>
                <p className="text-xs text-gray-500 mt-1">Mobile-based NFC tap attendance</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Notifications</h4>
                <p className="text-xs text-gray-500 mt-1">Auto alerts on boarding/drop</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-500" />
                    GPS Device Management
                  </CardTitle>
                  <CardDescription>Add and manage GPS trackers on your vehicles</CardDescription>
                </div>
                <Button onClick={() => setShowAddGps(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add GPS Device
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gpsDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No vehicles found</p>
                  <p className="text-sm mt-1">Pehle Vehicles tab mein vehicles add karein, phir GPS configure karein</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gpsDevices.map((device) => (
                    <div key={device.vehicle_id} className={`flex items-center justify-between p-4 rounded-lg border ${device.gps_enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${device.gps_enabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                          <Bus className={`w-5 h-5 ${device.gps_enabled ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{device.vehicle_number}</p>
                          {device.gps_device ? (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <p>IMEI: {device.gps_device.device_imei}</p>
                              <p>SIM: {device.gps_device.sim_number} | Brand: {device.gps_device.device_brand}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">GPS not configured</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={device.gps_enabled ? 'bg-green-100 text-green-700' : device.status === 'pending_activation' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}>
                          {device.gps_enabled ? 'Active' : device.gps_device ? 'Pending' : 'Not Configured'}
                        </Badge>
                        {!device.gps_enabled && (
                          <Button size="sm" variant="outline" onClick={() => {
                            setGpsForm({ ...gpsForm, vehicle_id: device.vehicle_id });
                            setShowAddGps(true);
                          }}>
                            <Settings className="w-3 h-3 mr-1" /> Configure
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-green-500" /> NFC Configuration
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">NFC Reader Mode</span>
                    <Badge className="bg-blue-100 text-blue-700">Mobile Based</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Card Format</span>
                    <span className="text-sm font-medium">NTAG215 / NTAG213</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Auto Notification</span>
                    <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Geo-fence Alerts</span>
                    <Badge className="bg-blue-100 text-blue-700">Enabled</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Vehicle attender ke NFC-enabled phone par student apna ID card tap karega. Attendance auto-mark hoga.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> GPS Setup Guide
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="text-sm font-medium">GPS Device Khareedein</p>
                      <p className="text-xs text-muted-foreground">Concox GT06N (₹2,500) ya Teltonika FMB920 (₹4,000)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="text-sm font-medium">M2M SIM Card Lein</p>
                      <p className="text-xs text-muted-foreground">Jio/Airtel M2M SIM - ₹50-100/month GPRS plan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <div>
                      <p className="text-sm font-medium">Vehicle mein Install Karein</p>
                      <p className="text-xs text-muted-foreground">Dashboard ke neeche, ignition wire se connect</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                    <div>
                      <p className="text-sm font-medium">Yahan Device Add Karein</p>
                      <p className="text-xs text-muted-foreground">IMEI aur SIM number enter karein, 2-5 min mein online</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('add_vehicle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('vehicle_number')} *</label>
                <Input
                  value={vehicleForm.vehicle_number}
                  onChange={(e) => setVehicleForm({...vehicleForm, vehicle_number: e.target.value})}
                  placeholder="UP32 AB 1234"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('type')}</label>
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
                <label className="text-sm font-medium">{t('capacity')}</label>
                <Input
                  type="number"
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm({...vehicleForm, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('driver_name')} *</label>
                <Input
                  value={vehicleForm.driver_name}
                  onChange={(e) => setVehicleForm({...vehicleForm, driver_name: e.target.value})}
                  placeholder="Driver name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('driver_phone')}</label>
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
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {t('add_vehicle')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Route Dialog */}
      <Dialog open={showAddRoute} onOpenChange={setShowAddRoute}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('add_route')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRoute} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('route_name')} *</label>
                <Input
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({...routeForm, route_name: e.target.value})}
                  placeholder="Gomti Nagar Route"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('route_number')} *</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Monthly Fee (₹)</label>
                <Input
                  type="number"
                  value={routeForm.monthly_fee}
                  onChange={(e) => setRouteForm({...routeForm, monthly_fee: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Yearly Fee (₹)</label>
                <Input
                  type="number"
                  value={routeForm.yearly_fee}
                  onChange={(e) => setRouteForm({...routeForm, yearly_fee: parseFloat(e.target.value)})}
                  placeholder="Optional - yearly discount"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddRoute(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {t('add_route')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddGps} onOpenChange={setShowAddGps}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-500" />
              {t('add')} GPS Device
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGpsDevice} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Vehicle *</label>
              <select
                value={gpsForm.vehicle_id}
                onChange={(e) => setGpsForm({...gpsForm, vehicle_id: e.target.value})}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Device IMEI *</label>
                <Input
                  value={gpsForm.device_imei}
                  onChange={(e) => setGpsForm({...gpsForm, device_imei: e.target.value})}
                  placeholder="863456789012345"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">15 digit IMEI (device par likha hai)</p>
              </div>
              <div>
                <label className="text-sm font-medium">SIM Number *</label>
                <Input
                  value={gpsForm.sim_number}
                  onChange={(e) => setGpsForm({...gpsForm, sim_number: e.target.value})}
                  placeholder="9876543210"
                />
                <p className="text-xs text-muted-foreground mt-1">M2M SIM ka number</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Device Brand</label>
              <select
                value={gpsForm.device_brand}
                onChange={(e) => setGpsForm({...gpsForm, device_brand: e.target.value})}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="generic">Generic / GT06N</option>
                <option value="concox">Concox</option>
                <option value="teltonika">Teltonika</option>
                <option value="queclink">Queclink</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Server IP (Optional)</label>
                <Input
                  value={gpsForm.server_ip}
                  onChange={(e) => setGpsForm({...gpsForm, server_ip: e.target.value})}
                  placeholder="e.g. 103.x.x.x"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Server Port (Optional)</label>
                <Input
                  type="number"
                  value={gpsForm.server_port}
                  onChange={(e) => setGpsForm({...gpsForm, server_port: e.target.value})}
                  placeholder="e.g. 5023"
                />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Device install karne ke baad 2-5 minute mein online ho jayega. Agar na ho toh SIM balance aur APN settings check karein.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddGps(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {t('add')} Device
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
