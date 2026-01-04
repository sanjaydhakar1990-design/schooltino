import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  School,
  Building2,
  Globe,
  Phone,
  Mail,
  Calendar,
  FileText,
  Image,
  Target,
  Users,
  Award,
  BookOpen,
  Loader2,
  Check,
  Upload,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FACILITIES_OPTIONS = [
  'Computer Lab', 'Science Lab', 'Library', 'Playground', 'Sports Complex',
  'Auditorium', 'Smart Classes', 'CCTV Surveillance', 'Transport', 'Canteen',
  'Medical Room', 'Music Room', 'Art Room', 'Dance Room', 'Swimming Pool',
  'Basketball Court', 'Football Ground', 'Indoor Games', 'AC Classrooms', 'WiFi Campus'
];

export default function SchoolRegistrationForm() {
  const { user, selectSchool } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    registration_number: '',
    established_year: '',
    board_type: 'CBSE',
    school_type: 'K-12',
    medium: 'English',
    shift: 'Day',
    
    // Step 2: Address & Contact
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    whatsapp_number: '',
    website_url: '',
    
    // Step 3: About School (for AI)
    motto: '',
    principal_name: '',
    principal_message: '',
    about_school: '',
    vision: '',
    mission: '',
    achievements: '',
    total_capacity: '',
    facilities: [],
    
    // Step 4: Social & App Requirements
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    app_requirements: '',
    ai_assistant_name: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      // Store file for later upload
      setFormData(prev => ({ ...prev, logoFile: file }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, photoFile: file }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Prepare data
      const submitData = {
        ...formData,
        established_year: formData.established_year ? parseInt(formData.established_year) : null,
        total_capacity: formData.total_capacity ? parseInt(formData.total_capacity) : null
      };
      
      // Remove file objects from submit data
      delete submitData.logoFile;
      delete submitData.photoFile;

      // Create school
      const response = await axios.post(`${API}/schools`, submitData);
      const schoolId = response.data.id;

      // Upload logo if exists
      if (formData.logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', formData.logoFile);
        await axios.post(`${API}/schools/${schoolId}/upload-photo?photo_type=logo`, logoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Upload school photo if exists
      if (formData.photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('file', formData.photoFile);
        await axios.post(`${API}/schools/${schoolId}/upload-photo?photo_type=main`, photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('🎉 School registered successfully! AI is now ready to help.');
      selectSchool(schoolId);
      
      // Reset form
      setStep(1);
      setFormData({
        name: '', registration_number: '', established_year: '', board_type: 'CBSE',
        school_type: 'K-12', medium: 'English', shift: 'Day', address: '', city: '',
        state: '', pincode: '', phone: '', email: '', whatsapp_number: '', website_url: '',
        motto: '', principal_name: '', principal_message: '', about_school: '', vision: '',
        mission: '', achievements: '', total_capacity: '', facilities: [], facebook_url: '',
        instagram_url: '', youtube_url: '', app_requirements: '', ai_assistant_name: ''
      });
      setLogoPreview(null);
      setPhotoPreview(null);

    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Failed to register school');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const isStepValid = () => {
    switch(step) {
      case 1:
        return formData.name && formData.board_type;
      case 2:
        return formData.address && formData.city && formData.state;
      case 3:
        return true; // Optional fields
      case 4:
        return true; // Optional fields
      default:
        return false;
    }
  };

  if (user?.role !== 'director') {
    return (
      <div className="text-center py-20">
        <School className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Restricted</h2>
        <p className="text-slate-500">Only Director can register new schools.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" data-testid="school-registration-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <School className="w-8 h-8 text-indigo-600" />
          School Registration
        </h1>
        <p className="text-slate-500 mt-2">
          Fill complete details so AI can understand your school better
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Basic Info', icon: Building2 },
          { num: 2, label: 'Contact', icon: Phone },
          { num: 3, label: 'About School', icon: BookOpen },
          { num: 4, label: 'Social & AI', icon: Target }
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                step === s.num
                  ? 'bg-indigo-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step > s.num ? (
                <Check className="w-5 h-5" />
              ) : (
                <s.icon className="w-5 h-5" />
              )}
              <span className="font-medium hidden sm:inline">{s.label}</span>
              <span className="font-medium sm:hidden">{s.num}</span>
            </div>
            {idx < 3 && (
              <div className={`w-8 md:w-16 h-1 mx-2 rounded ${step > s.num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Basic Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label>School Name *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Delhi Public School"
                  required
                  data-testid="school-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Registration/Affiliation Number</Label>
                <Input
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="e.g., CBSE/12345"
                  data-testid="registration-number-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Established Year</Label>
                <Input
                  type="number"
                  name="established_year"
                  value={formData.established_year}
                  onChange={handleChange}
                  placeholder="e.g., 1995"
                  min="1800"
                  max={new Date().getFullYear()}
                  data-testid="established-year-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Board Type *</Label>
                <select
                  name="board_type"
                  value={formData.board_type}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  data-testid="board-type-select"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="IB">IB</option>
                  <option value="Cambridge">Cambridge</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>School Type</Label>
                <select
                  name="school_type"
                  value={formData.school_type}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="Primary">Primary (1-5)</option>
                  <option value="Middle">Middle (6-8)</option>
                  <option value="Secondary">Secondary (9-10)</option>
                  <option value="Senior Secondary">Senior Secondary (11-12)</option>
                  <option value="K-12">K-12 (All Classes)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Medium of Instruction</Label>
                <select
                  name="medium"
                  value={formData.medium}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Both">English + Hindi</option>
                  <option value="Regional">Regional Language</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>School Shift</Label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Day">Day Shift</option>
                  <option value="Both">Both Shifts</option>
                </select>
              </div>
            </div>

            {/* Logo & Photo Upload */}
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  School Logo
                </Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo Preview" className="w-24 h-24 mx-auto object-contain" />
                      <button
                        onClick={() => { setLogoPreview(null); setFormData(p => ({ ...p, logoFile: null })); }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-sm text-slate-500">Click to upload logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  School Building Photo
                </Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="Photo Preview" className="w-full h-24 mx-auto object-cover rounded" />
                      <button
                        onClick={() => { setPhotoPreview(null); setFormData(p => ({ ...p, photoFile: null })); }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-sm text-slate-500">Click to upload photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Phone className="w-5 h-5 text-indigo-600" />
              Contact Information
            </h2>

            <div className="space-y-2">
              <Label>Full Address *</Label>
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Complete address with landmark"
                rows={2}
                required
                data-testid="address-input"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Delhi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g., Delhi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g., 110001"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="info@school.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website URL
                </Label>
                <Input
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://www.yourschool.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: About School */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              About School (AI ke liye important)
            </h2>
            <p className="text-sm text-slate-500">
              Ye details AI ko aapki school ke baare mein samajhne mein help karegi
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School Motto</Label>
                <Input
                  name="motto"
                  value={formData.motto}
                  onChange={handleChange}
                  placeholder="e.g., Knowledge is Power"
                />
              </div>
              <div className="space-y-2">
                <Label>Principal Name</Label>
                <Input
                  name="principal_name"
                  value={formData.principal_name}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Sharma"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Principal's Message</Label>
              <Textarea
                name="principal_message"
                value={formData.principal_message}
                onChange={handleChange}
                placeholder="Principal ka message for parents and students..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>About School (Brief Description)</Label>
              <Textarea
                name="about_school"
                value={formData.about_school}
                onChange={handleChange}
                placeholder="School ki history, values, aur specialities ke baare mein likhein..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vision</Label>
                <Textarea
                  name="vision"
                  value={formData.vision}
                  onChange={handleChange}
                  placeholder="School ka vision statement..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Mission</Label>
                <Textarea
                  name="mission"
                  value={formData.mission}
                  onChange={handleChange}
                  placeholder="School ka mission statement..."
                  rows={2}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Achievements
                </Label>
                <Textarea
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleChange}
                  placeholder="School ki notable achievements..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Student Capacity
                </Label>
                <Input
                  type="number"
                  name="total_capacity"
                  value={formData.total_capacity}
                  onChange={handleChange}
                  placeholder="e.g., 2000"
                />
              </div>
            </div>

            {/* Facilities */}
            <div className="space-y-3">
              <Label>Facilities (Select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {FACILITIES_OPTIONS.map(facility => (
                  <button
                    key={facility}
                    type="button"
                    onClick={() => handleFacilityToggle(facility)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.facilities.includes(facility)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {formData.facilities.includes(facility) && <Check className="w-3 h-3 inline mr-1" />}
                    {facility}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Social & AI */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Social Media & App Requirements
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Facebook URL</Label>
                <Input
                  name="facebook_url"
                  value={formData.facebook_url}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourschool"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourschool"
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input
                  name="youtube_url"
                  value={formData.youtube_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@yourschool"
                />
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                <Target className="w-5 h-5" />
                App Customization for AI
              </h3>
              
              <div className="space-y-2">
                <Label>What features do you need most from this app?</Label>
                <Textarea
                  name="app_requirements"
                  value={formData.app_requirements}
                  onChange={handleChange}
                  placeholder="e.g., Attendance tracking, Fee management, Parent communication, Homework tracking, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom AI Assistant Name (Optional)</Label>
                <Input
                  name="ai_assistant_name"
                  value={formData.ai_assistant_name}
                  onChange={handleChange}
                  placeholder="e.g., SchoolBot, EduHelper (default: Schooltino AI)"
                />
                <p className="text-xs text-slate-500">
                  AI assistant ka naam jo students aur teachers se baat karega
                </p>
              </div>
            </div>

            {/* Summary Preview */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Registration Summary</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">School:</span>
                  <span className="ml-2 font-medium">{formData.name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Board:</span>
                  <span className="ml-2 font-medium">{formData.board_type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Location:</span>
                  <span className="ml-2 font-medium">{formData.city}, {formData.state}</span>
                </div>
                <div>
                  <span className="text-slate-500">Facilities:</span>
                  <span className="ml-2 font-medium">{formData.facilities.length} selected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className="btn-primary flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isStepValid()}
              className="btn-primary flex items-center gap-2"
              data-testid="register-school-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Register School
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
