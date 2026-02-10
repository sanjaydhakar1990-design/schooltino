import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  FileText, Printer, Search, Loader2, Download, User, Calendar,
  GraduationCap, Award, BookOpen, CheckCircle, Building2, Stamp
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CERTIFICATE_TYPES = {
  tc: { name: 'Transfer Certificate', name_hi: 'स्थानान्तरण प्रमाण पत्र', icon: FileText },
  character: { name: 'Character Certificate', name_hi: 'चरित्र प्रमाण पत्र', icon: Award },
  bonafide: { name: 'Bonafide Certificate', name_hi: 'वास्तविक छात्र प्रमाण पत्र', icon: CheckCircle }
};

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  return num.toString();
};

export default function CertificateGenerator() {
  const { schoolId, user } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [classes, setClasses] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('tc');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState(null);
  
  const [tcData, setTcData] = useState({
    tc_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    leaving_date: new Date().toISOString().split('T')[0],
    reason: 'On parent request',
    conduct: 'Good',
    attendance: 'Regular',
    fees_paid: true,
    dues_amount: 0,
    promoted_to: '',
    remarks: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
    }
  }, [schoolId]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudent(null);
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [schoolRes, classRes] = await Promise.all([
        axios.get(`${API}/schools/${schoolId}`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/classes?school_id=${schoolId}`, { headers })
      ]);
      
      setSchool(schoolRes.data);
      setClasses(classRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async (classId) => {
    setLoadingStudents(true);
    setSelectedStudent(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API}/students?school_id=${schoolId}&class_id=${classId}`, { headers });
      setStudents(res.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      toast.error('Students load करने में error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    return s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase());
  });

  const handleGenerate = async () => {
    if (!selectedStudent) {
      toast.error('कृपया student select करें');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API}/certificates`, {
        school_id: schoolId,
        student_id: selectedStudent.id,
        type: activeTab,
        data: activeTab === 'tc' ? tcData : {},
        generated_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});

      const certificate = generateCertificateContent(activeTab, selectedStudent, school, tcData);
      setGeneratedCertificate(certificate);
      setShowPreview(true);
      toast.success('Certificate generated!');
    } catch (error) {
      toast.error('Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const generateCertificateContent = (type, student, school, tcData) => {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const studentClass = classes.find(c => c.id === student.class_id);
    
    switch (type) {
      case 'tc':
        return {
          type: 'tc',
          title: 'TRANSFER CERTIFICATE',
          title_hi: 'स्थानान्तरण प्रमाण पत्र',
          content: `
            <div style="font-family: 'Times New Roman', serif; padding: 40px; border: 3px double #000; margin: 20px; background: #fff;">
              <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                ${school?.logo_url ? `<img src="${school.logo_url}" style="width: 80px; height: 80px; object-fit: contain;" />` : ''}
                <h1 style="margin: 10px 0 5px; font-size: 24px;">${school?.name || 'SCHOOL NAME'}</h1>
                <p style="margin: 0; font-size: 12px;">${school?.address || ''}</p>
                <p style="margin: 5px 0; font-size: 12px;">Phone: ${school?.phone || ''} | Email: ${school?.email || ''}</p>
                <h2 style="margin: 15px 0 0; font-size: 18px; text-decoration: underline;">TRANSFER CERTIFICATE</h2>
                <p style="margin: 5px 0; font-size: 14px;">स्थानान्तरण प्रमाण पत्र</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 8px; width: 50%;"><b>T.C. No.:</b> ${tcData.tc_number}</td><td><b>Date:</b> ${today}</td></tr>
                <tr><td style="padding: 8px;"><b>Admission No.:</b> ${student.admission_no || student.student_id}</td><td><b>S.R. No.:</b> ${student.sr_no || '-'}</td></tr>
              </table>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 15px;">
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px; width: 40%;">1. Name of Student</td><td style="padding: 10px;"><b>${student.name}</b></td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">2. Father's Name</td><td style="padding: 10px;">${student.father_name || '-'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">3. Mother's Name</td><td style="padding: 10px;">${student.mother_name || '-'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">4. Date of Birth</td><td style="padding: 10px;">${student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : '-'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">5. Nationality</td><td style="padding: 10px;">Indian</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">6. Category</td><td style="padding: 10px;">${student.category || 'General'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">7. Date of Admission</td><td style="padding: 10px;">${student.admission_date ? new Date(student.admission_date).toLocaleDateString('en-IN') : '-'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">8. Class at Admission</td><td style="padding: 10px;">${student.admission_class || '-'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">9. Class at Leaving</td><td style="padding: 10px;">${studentClass?.name || student.class_name || '-'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">10. Date of Leaving</td><td style="padding: 10px;">${tcData.leaving_date ? new Date(tcData.leaving_date).toLocaleDateString('en-IN') : today}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">11. Reason for Leaving</td><td style="padding: 10px;">${tcData.reason}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">12. Qualified for Promotion</td><td style="padding: 10px;">${tcData.promoted_to || 'Yes'}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">13. Conduct & Character</td><td style="padding: 10px;">${tcData.conduct}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">14. Attendance</td><td style="padding: 10px;">${tcData.attendance}</td></tr>
                <tr style="border-bottom: 1px dotted #999;"><td style="padding: 10px;">15. Fee Dues</td><td style="padding: 10px;">${tcData.fees_paid ? 'Nil' : '₹' + tcData.dues_amount}</td></tr>
                <tr><td style="padding: 10px;">16. Remarks</td><td style="padding: 10px;">${tcData.remarks || '-'}</td></tr>
              </table>
              <div style="display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px;">
                <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 150px; margin-top: 40px;"></div><p style="margin: 5px 0;">Class Teacher</p></div>
                <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 150px; margin-top: 40px;"></div><p style="margin: 5px 0;">Principal</p></div>
              </div>
            </div>
          `
        };
        
      case 'character':
        return {
          type: 'character',
          title: 'CHARACTER CERTIFICATE',
          title_hi: 'चरित्र प्रमाण पत्र',
          content: `
            <div style="font-family: 'Times New Roman', serif; padding: 40px; border: 3px double #000; margin: 20px; background: #fff;">
              <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px;">
                ${school?.logo_url ? `<img src="${school.logo_url}" style="width: 80px; height: 80px; object-fit: contain;" />` : ''}
                <h1 style="margin: 10px 0 5px; font-size: 24px;">${school?.name || 'SCHOOL NAME'}</h1>
                <p style="margin: 0; font-size: 12px;">${school?.address || ''}</p>
                <h2 style="margin: 20px 0 0; font-size: 20px; text-decoration: underline;">CHARACTER CERTIFICATE</h2>
                <p style="margin: 5px 0; font-size: 14px;">चरित्र प्रमाण पत्र</p>
              </div>
              <p style="font-size: 14px; margin-bottom: 10px; text-align: right;"><b>Date:</b> ${today}</p>
              <p style="font-size: 15px; line-height: 2; text-align: justify; margin-top: 30px;">
                This is to certify that <b>${student.name}</b>, Son/Daughter of <b>${student.father_name || 'Mr. _______'}</b>, 
                was a bonafide student of this school. He/She was admitted in class <b>${student.admission_class || '-'}</b> 
                and studied up to class <b>${studentClass?.name || student.class_name || '-'}</b>.
              </p>
              <p style="font-size: 15px; line-height: 2; text-align: justify; margin-top: 20px;">
                During his/her stay in this institution, his/her conduct and character was found to be <b>GOOD</b>. 
                He/She bears a good moral character and has not been involved in any kind of disciplinary action.
              </p>
              <p style="font-size: 15px; line-height: 2; text-align: justify; margin-top: 20px;">
                I wish him/her all the best for his/her future endeavors.
              </p>
              <div style="display: flex; justify-content: flex-end; margin-top: 60px;">
                <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 180px; margin-top: 40px;"></div><p style="margin: 5px 0; font-weight: bold;">Principal</p><p style="margin: 0; font-size: 12px;">${school?.name || ''}</p></div>
              </div>
            </div>
          `
        };
        
      case 'bonafide':
        return {
          type: 'bonafide',
          title: 'BONAFIDE CERTIFICATE',
          title_hi: 'वास्तविक छात्र प्रमाण पत्र',
          content: `
            <div style="font-family: 'Times New Roman', serif; padding: 40px; border: 3px double #000; margin: 20px; background: #fff;">
              <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px;">
                ${school?.logo_url ? `<img src="${school.logo_url}" style="width: 80px; height: 80px; object-fit: contain;" />` : ''}
                <h1 style="margin: 10px 0 5px; font-size: 24px;">${school?.name || 'SCHOOL NAME'}</h1>
                <p style="margin: 0; font-size: 12px;">${school?.address || ''}</p>
                <h2 style="margin: 20px 0 0; font-size: 20px; text-decoration: underline;">BONAFIDE CERTIFICATE</h2>
                <p style="margin: 5px 0; font-size: 14px;">वास्तविक छात्र प्रमाण पत्र</p>
              </div>
              <p style="font-size: 14px; margin-bottom: 10px; text-align: right;"><b>Date:</b> ${today}</p>
              <p style="font-size: 15px; line-height: 2.2; text-align: justify; margin-top: 30px;">
                This is to certify that <b>${student.name}</b>, Son/Daughter of <b>${student.father_name || 'Mr. _______'}</b>, 
                is a bonafide student of this school bearing Admission No. <b>${student.admission_no || student.student_id}</b>.
              </p>
              <p style="font-size: 15px; line-height: 2.2; text-align: justify; margin-top: 20px;">
                He/She is currently studying in Class <b>${studentClass?.name || student.class_name || '-'}</b> for the academic session 
                <b>${new Date().getFullYear()}-${new Date().getFullYear() + 1}</b>.
              </p>
              <p style="font-size: 15px; line-height: 2.2; text-align: justify; margin-top: 20px;">
                His/Her date of birth as per our records is <b>${student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</b>.
              </p>
              <p style="font-size: 15px; line-height: 2.2; text-align: justify; margin-top: 20px;">
                This certificate is issued on his/her request for the purpose of <b>_________________________</b>.
              </p>
              <div style="display: flex; justify-content: flex-end; margin-top: 60px;">
                <div style="text-align: center;"><div style="border-top: 1px solid #000; width: 180px; margin-top: 40px;"></div><p style="margin: 5px 0; font-weight: bold;">Principal</p><p style="margin: 0; font-size: 12px;">${school?.name || ''}</p></div>
              </div>
            </div>
          `
        };
        
      default:
        return null;
    }
  };

  const handlePrint = () => {
    if (!generatedCertificate) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>${generatedCertificate.title}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
            @page { size: A4; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        ${generatedCertificate.content}
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const CertTypeIcon = CERTIFICATE_TYPES[activeTab]?.icon || FileText;

  return (
    <div className="space-y-6" data-testid="certificate-generator">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-purple-600" />
            Certificate Generator
          </h1>
          <p className="text-slate-500 mt-1">TC, Character, Bonafide Certificates</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          {Object.entries(CERTIFICATE_TYPES).map(([key, cert]) => {
            const Icon = cert.icon;
            return (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cert.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Student / छात्र चुनें
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Class चुनें *</Label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                >
                  <option value="">-- Class चुनें --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `(${cls.section})` : ''}</option>
                  ))}
                </select>
              </div>

              {selectedClass && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search student..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {loadingStudents ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      </div>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <div
                          key={student.id || student.student_id}
                          onClick={() => setSelectedStudent(student)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedStudent?.id === student.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-slate-200 hover:border-purple-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {student.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{student.name}</p>
                              <p className="text-xs text-slate-500">
                                {student.student_id} {student.class_name ? `• ${student.class_name}` : ''}
                              </p>
                            </div>
                            {selectedStudent?.id === student.id && (
                              <CheckCircle className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-8">No students found</p>
                    )}
                  </div>
                </>
              )}

              {!selectedClass && (
                <div className="text-center py-8 text-slate-400">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">पहले class चुनें</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CertTypeIcon className="w-5 h-5 text-purple-600" />
                {CERTIFICATE_TYPES[activeTab]?.name}
              </CardTitle>
              <CardDescription>{CERTIFICATE_TYPES[activeTab]?.name_hi}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStudent ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Selected Student / चयनित छात्र</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Name:</span> {selectedStudent.name}</div>
                      <div><span className="text-slate-500">ID:</span> {selectedStudent.student_id}</div>
                      <div><span className="text-slate-500">Father:</span> {selectedStudent.father_name || '-'}</div>
                      <div><span className="text-slate-500">Class:</span> {selectedStudent.class_name || classes.find(c => c.id === selectedStudent.class_id)?.name || '-'}</div>
                    </div>
                  </div>

                  {activeTab === 'tc' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>TC Number</Label>
                        <Input
                          value={tcData.tc_number}
                          onChange={(e) => setTcData(prev => ({ ...prev, tc_number: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input type="date" value={tcData.issue_date} onChange={(e) => setTcData(prev => ({ ...prev, issue_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Leaving Date</Label>
                        <Input type="date" value={tcData.leaving_date} onChange={(e) => setTcData(prev => ({ ...prev, leaving_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason for Leaving</Label>
                        <select value={tcData.reason} onChange={(e) => setTcData(prev => ({ ...prev, reason: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                          <option value="On parent request">On parent request</option>
                          <option value="Transfer to another school">Transfer to another school</option>
                          <option value="Completed education">Completed education</option>
                          <option value="Family relocation">Family relocation</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Conduct</Label>
                        <select value={tcData.conduct} onChange={(e) => setTcData(prev => ({ ...prev, conduct: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                          <option value="Excellent">Excellent</option>
                          <option value="Very Good">Very Good</option>
                          <option value="Good">Good</option>
                          <option value="Satisfactory">Satisfactory</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Attendance</Label>
                        <select value={tcData.attendance} onChange={(e) => setTcData(prev => ({ ...prev, attendance: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                          <option value="Regular">Regular</option>
                          <option value="Irregular">Irregular</option>
                        </select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Remarks</Label>
                        <Input value={tcData.remarks} onChange={(e) => setTcData(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Any additional remarks..." />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleGenerate}
                      disabled={generating}
                      className="bg-purple-600 hover:bg-purple-700 gap-2"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Generate Certificate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a student to generate certificate</p>
                  <p className="text-sm mt-1">पहले class चुनें, फिर student select करें</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              {generatedCertificate?.title}
            </DialogTitle>
          </DialogHeader>
          
          {generatedCertificate && (
            <>
              <div 
                className="border rounded-lg overflow-hidden bg-white"
                dangerouslySetInnerHTML={{ __html: generatedCertificate.content }}
              />
              
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 gap-2">
                  <Printer className="w-4 h-4" />
                  Print Certificate
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
