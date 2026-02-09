import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Building, Plus, Search, Edit, Users, UserPlus,
  UtensilsCrossed, IndianRupee, BedDouble, DoorOpen,
  CheckCircle, Clock, AlertCircle, Calendar,
  BarChart3, Download, Filter
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const demoRooms = [
  { id: 1, roomNo: '101', type: 'Single', capacity: 1, occupied: 1, floor: 'Ground', block: 'A', student: 'Aarav Sharma' },
  { id: 2, roomNo: '102', type: 'Double', capacity: 2, occupied: 2, floor: 'Ground', block: 'A', student: 'Priya Patel, Sneha Gupta' },
  { id: 3, roomNo: '103', type: 'Double', capacity: 2, occupied: 1, floor: 'Ground', block: 'A', student: 'Rahul Singh' },
  { id: 4, roomNo: '201', type: 'Dormitory', capacity: 6, occupied: 5, floor: '1st', block: 'A', student: '5 students' },
  { id: 5, roomNo: '202', type: 'Single', capacity: 1, occupied: 0, floor: '1st', block: 'A', student: '-' },
  { id: 6, roomNo: '301', type: 'Double', capacity: 2, occupied: 2, floor: '2nd', block: 'B', student: 'Arjun Kumar, Vikram Yadav' },
  { id: 7, roomNo: '302', type: 'Dormitory', capacity: 8, occupied: 7, floor: '2nd', block: 'B', student: '7 students' },
  { id: 8, roomNo: '303', type: 'Single', capacity: 1, occupied: 1, floor: '2nd', block: 'B', student: 'Kavya Mishra' },
  { id: 9, roomNo: '401', type: 'Double', capacity: 2, occupied: 0, floor: '3rd', block: 'B', student: '-' },
  { id: 10, roomNo: '402', type: 'Dormitory', capacity: 6, occupied: 4, floor: '3rd', block: 'B', student: '4 students' },
];

const demoStudents = [
  { id: 1, name: 'Aarav Sharma', class: '10-A', room: '101', block: 'A', feeStatus: 'Paid', checkIn: '2026-04-05', guardian: 'Mr. Ramesh Sharma', phone: '9876543210' },
  { id: 2, name: 'Priya Patel', class: '9-B', room: '102', block: 'A', feeStatus: 'Paid', checkIn: '2026-04-06', guardian: 'Mr. Suresh Patel', phone: '9876543211' },
  { id: 3, name: 'Rahul Singh', class: '11-A', room: '103', block: 'A', feeStatus: 'Due', checkIn: '2026-04-05', guardian: 'Mr. Ajay Singh', phone: '9876543212' },
  { id: 4, name: 'Sneha Gupta', class: '9-B', room: '102', block: 'A', feeStatus: 'Paid', checkIn: '2026-04-07', guardian: 'Mr. Ravi Gupta', phone: '9876543213' },
  { id: 5, name: 'Arjun Kumar', class: '12-A', room: '301', block: 'B', feeStatus: 'Partial', checkIn: '2026-04-05', guardian: 'Mr. Manoj Kumar', phone: '9876543214' },
  { id: 6, name: 'Vikram Yadav', class: '12-B', room: '301', block: 'B', feeStatus: 'Paid', checkIn: '2026-04-06', guardian: 'Mr. Dinesh Yadav', phone: '9876543215' },
  { id: 7, name: 'Kavya Mishra', class: '10-B', room: '303', block: 'B', feeStatus: 'Due', checkIn: '2026-04-08', guardian: 'Mr. Sanjay Mishra', phone: '9876543216' },
];

const demoMessMenu = {
  Monday: { breakfast: 'Poha, Chai, Fruits', lunch: 'Dal, Rice, Roti, Sabzi, Salad', snack: 'Samosa, Chai', dinner: 'Paneer Curry, Roti, Rice, Dal' },
  Tuesday: { breakfast: 'Idli Sambar, Juice', lunch: 'Rajma, Rice, Roti, Raita', snack: 'Bread Pakora, Chai', dinner: 'Chole, Rice, Roti, Salad' },
  Wednesday: { breakfast: 'Paratha, Curd, Chai', lunch: 'Kadhi Chawal, Roti, Sabzi', snack: 'Vada Pav, Juice', dinner: 'Mix Veg, Dal, Rice, Roti' },
  Thursday: { breakfast: 'Upma, Chai, Banana', lunch: 'Dal Makhani, Rice, Roti, Papad', snack: 'Dhokla, Chai', dinner: 'Aloo Gobi, Roti, Rice, Raita' },
  Friday: { breakfast: 'Chole Bhature, Lassi', lunch: 'Sambhar Rice, Roti, Sabzi', snack: 'Pav Bhaji', dinner: 'Shahi Paneer, Roti, Rice, Salad' },
  Saturday: { breakfast: 'Dosa, Chutney, Coffee', lunch: 'Pulao, Raita, Dal, Roti', snack: 'Momos, Juice', dinner: 'Biryani, Raita, Salad' },
  Sunday: { breakfast: 'Aloo Paratha, Dahi, Chai', lunch: 'Special Thali - Paneer, Dal, Rice, 3 Sabzi, Roti, Sweet', snack: 'Cake, Ice Cream', dinner: 'Pav Bhaji, Pulao, Salad' },
};

const demoFeeStructure = [
  { id: 1, component: 'Room Charges (Single)', monthly: 3000, quarterly: 8500, yearly: 33000 },
  { id: 2, component: 'Room Charges (Double)', monthly: 2000, quarterly: 5700, yearly: 22000 },
  { id: 3, component: 'Room Charges (Dormitory)', monthly: 1200, quarterly: 3400, yearly: 13000 },
  { id: 4, component: 'Mess Charges', monthly: 3500, quarterly: 10000, yearly: 38000 },
  { id: 5, component: 'Laundry', monthly: 500, quarterly: 1400, yearly: 5500 },
  { id: 6, component: 'Electricity & Water', monthly: 800, quarterly: 2300, yearly: 9000 },
];

const demoFeeCollection = [
  { id: 1, student: 'Aarav Sharma', room: '101', totalDue: 44500, paid: 44500, balance: 0, status: 'Paid' },
  { id: 2, student: 'Priya Patel', room: '102', totalDue: 32000, paid: 32000, balance: 0, status: 'Paid' },
  { id: 3, student: 'Rahul Singh', room: '103', totalDue: 32000, paid: 16000, balance: 16000, status: 'Due' },
  { id: 4, student: 'Arjun Kumar', room: '301', totalDue: 32000, paid: 24000, balance: 8000, status: 'Partial' },
  { id: 5, student: 'Kavya Mishra', room: '303', totalDue: 44500, paid: 0, balance: 44500, status: 'Due' },
];

export default function HostelPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState(demoRooms);
  const [students, setStudents] = useState(demoStudents);
  const [messMenu, setMessMenu] = useState(demoMessMenu);
  const [feeCollection, setFeeCollection] = useState(demoFeeCollection);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showEditMealDialog, setShowEditMealDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [assignForm, setAssignForm] = useState({ studentName: '', class: '' });
  const [studentForm, setStudentForm] = useState({ name: '', class: '', room: '', block: '', guardian: '', phone: '' });
  const [mealForm, setMealForm] = useState({ breakfast: '', lunch: '', snack: '', dinner: '' });

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + r.occupied, 0);
  const totalCollection = feeCollection.reduce((sum, f) => sum + f.paid, 0);
  const totalDue = feeCollection.reduce((sum, f) => sum + f.balance, 0);

  const handleAssignStudent = () => {
    if (!assignForm.studentName) {
      toast.error('Student name ज़रूरी है');
      return;
    }
    if (selectedRoom) {
      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, occupied: Math.min(r.occupied + 1, r.capacity) } : r));
    }
    toast.success(`${assignForm.studentName} को Room ${selectedRoom?.roomNo} में assign किया गया`);
    setShowAssignDialog(false);
    setAssignForm({ studentName: '', class: '' });
    setSelectedRoom(null);
  };

  const handleAddStudent = () => {
    if (!studentForm.name || !studentForm.class || !studentForm.room) {
      toast.error('Name, class और room ज़रूरी है');
      return;
    }
    setStudents(prev => [...prev, {
      id: Date.now(),
      ...studentForm,
      feeStatus: 'Due',
      checkIn: new Date().toISOString().split('T')[0],
    }]);
    toast.success(`${studentForm.name} hostel में जोड़ा गया!`);
    setShowAddStudentDialog(false);
    setStudentForm({ name: '', class: '', room: '', block: '', guardian: '', phone: '' });
  };

  const handleEditMeal = () => {
    if (selectedDay) {
      setMessMenu(prev => ({ ...prev, [selectedDay]: { ...mealForm } }));
      toast.success(`${selectedDay} का menu update हो गया!`);
    }
    setShowEditMealDialog(false);
    setSelectedDay(null);
  };

  const openEditMeal = (day) => {
    setSelectedDay(day);
    setMealForm({ ...messMenu[day] });
    setShowEditMealDialog(true);
  };

  const openAssignDialog = (room) => {
    setSelectedRoom(room);
    setShowAssignDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Building className="w-8 h-8" />
              Hostel Management
            </h1>
            <p className="text-rose-100 mt-2">
              Rooms, mess, and student care — all managed centrally
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{rooms.length}</p>
              <p className="text-xs text-rose-100">Total Rooms</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalOccupied}/{totalCapacity}</p>
              <p className="text-xs text-rose-100">Occupancy</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-xs text-rose-100">Students</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">₹{(totalCollection / 1000).toFixed(0)}K</p>
              <p className="text-xs text-rose-100">Collected</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4" /> Rooms
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="mess" className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" /> Mess
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4" /> Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Room Allocation (कमरा आवंटन)</h3>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Room No</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Type</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Capacity</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Occupied</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Floor</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Block</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Student(s)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room.id} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-bold text-gray-900">{room.roomNo}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className={
                            room.type === 'Single' ? 'border-blue-200 text-blue-700' :
                            room.type === 'Double' ? 'border-purple-200 text-purple-700' :
                            'border-orange-200 text-orange-700'
                          }>
                            {room.type}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-900">{room.capacity}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-sm font-bold ${room.occupied >= room.capacity ? 'text-red-600' : room.occupied > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {room.occupied}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-500">{room.floor}</td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-700">Block {room.block}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{room.student}</td>
                        <td className="py-3.5 px-4">
                          {room.occupied < room.capacity && (
                            <Button size="sm" variant="outline" onClick={() => openAssignDialog(room)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                              <UserPlus className="w-3 h-3 mr-1" /> Assign
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search hostel students..." className="pl-10" />
            </div>
            <Button onClick={() => setShowAddStudentDialog(true)} className="bg-rose-600 hover:bg-rose-700">
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Student Name</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Class</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Room</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Block</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Fee Status</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Check-in</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Guardian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(student => (
                      <tr key={student.id} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-700">{student.class}</td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{student.room}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">Block {student.block}</td>
                        <td className="py-3.5 px-4">
                          <Badge className={
                            student.feeStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                            student.feeStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {student.feeStatus}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{student.checkIn}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-500">{student.guardian}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mess" className="mt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Mess Menu (भोजन मेनू) — Weekly Planner</h3>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Day (दिन)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Breakfast (नाश्ता)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Lunch (दोपहर)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Snack (शाम)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Dinner (रात)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(messMenu).map(([day, meals]) => (
                      <tr key={day} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-bold text-gray-900">{day}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{meals.breakfast}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{meals.lunch}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{meals.snack}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{meals.dinner}</td>
                        <td className="py-3.5 px-4">
                          <Button size="sm" variant="outline" onClick={() => openEditMeal(day)}>
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Hostel Fee Structure (शुल्क संरचना)</h3>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Component</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Monthly (₹)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Quarterly (₹)</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Yearly (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoFeeStructure.map(fee => (
                      <tr key={fee.id} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{fee.component}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-700">₹{fee.monthly.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-700">₹{fee.quarterly.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-sm font-bold text-gray-900">₹{fee.yearly.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Fee Collection Tracking (शुल्क वसूली)</h3>
            <div className="flex gap-3">
              <div className="bg-green-50 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-bold text-green-700">₹{(totalCollection / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-600">Collected</p>
              </div>
              <div className="bg-red-50 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-bold text-red-700">₹{(totalDue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-red-600">Pending</p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Student</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Room</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Total Due</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Paid</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Balance</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeCollection.map(fee => (
                      <tr key={fee.id} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-semibold text-gray-900">{fee.student}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{fee.room}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-700">₹{fee.totalDue.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-sm font-bold text-green-600">₹{fee.paid.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-sm font-bold text-red-600">₹{fee.balance.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <Badge className={
                            fee.status === 'Paid' ? 'bg-green-100 text-green-700' :
                            fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {fee.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Student to Room {selectedRoom?.roomNo} (छात्र आवंटित करें)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input value={assignForm.studentName} onChange={(e) => setAssignForm(f => ({ ...f, studentName: e.target.value }))} placeholder="Student name" />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Input value={assignForm.class} onChange={(e) => setAssignForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. 10-A" />
            </div>
            <div className="p-3 bg-rose-50 rounded-lg">
              <p className="text-sm text-gray-700">Room: <strong>{selectedRoom?.roomNo}</strong> | Type: <strong>{selectedRoom?.type}</strong></p>
              <p className="text-sm text-gray-700">Block: <strong>{selectedRoom?.block}</strong> | Floor: <strong>{selectedRoom?.floor}</strong></p>
              <p className="text-sm text-gray-700">Available: <strong>{selectedRoom ? selectedRoom.capacity - selectedRoom.occupied : 0}</strong> beds</p>
            </div>
            <Button onClick={handleAssignStudent} className="w-full bg-rose-600 hover:bg-rose-700">
              <UserPlus className="w-4 h-4 mr-2" /> Assign Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Hostel Student (छात्र जोड़ें)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input value={studentForm.name} onChange={(e) => setStudentForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Input value={studentForm.class} onChange={(e) => setStudentForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. 10-A" />
              </div>
              <div className="space-y-2">
                <Label>Room No.</Label>
                <select value={studentForm.room} onChange={(e) => setStudentForm(f => ({ ...f, room: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                  <option value="">Select Room</option>
                  {rooms.filter(r => r.occupied < r.capacity).map(r => (
                    <option key={r.id} value={r.roomNo}>{r.roomNo} ({r.type} - {r.capacity - r.occupied} beds free)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Block</Label>
              <select value={studentForm.block} onChange={(e) => setStudentForm(f => ({ ...f, block: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="">Select Block</option>
                <option value="A">Block A</option>
                <option value="B">Block B</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Guardian Name</Label>
              <Input value={studentForm.guardian} onChange={(e) => setStudentForm(f => ({ ...f, guardian: e.target.value }))} placeholder="Guardian name" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={studentForm.phone} onChange={(e) => setStudentForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
            </div>
            <Button onClick={handleAddStudent} className="w-full bg-rose-600 hover:bg-rose-700">
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditMealDialog} onOpenChange={setShowEditMealDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {selectedDay} Menu ({selectedDay} का मेनू)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Breakfast (नाश्ता)</Label>
              <Input value={mealForm.breakfast} onChange={(e) => setMealForm(f => ({ ...f, breakfast: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Lunch (दोपहर का भोजन)</Label>
              <Input value={mealForm.lunch} onChange={(e) => setMealForm(f => ({ ...f, lunch: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Snack (शाम का नाश्ता)</Label>
              <Input value={mealForm.snack} onChange={(e) => setMealForm(f => ({ ...f, snack: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Dinner (रात का खाना)</Label>
              <Input value={mealForm.dinner} onChange={(e) => setMealForm(f => ({ ...f, dinner: e.target.value }))} />
            </div>
            <Button onClick={handleEditMeal} className="w-full bg-rose-600 hover:bg-rose-700">
              <CheckCircle className="w-4 h-4 mr-2" /> Save Menu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}