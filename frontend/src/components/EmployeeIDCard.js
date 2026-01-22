import { useRef } from 'react';
import { Button } from './ui/button';
import { Printer, Download, X } from 'lucide-react';

/**
 * Printable Employee ID Card Component
 * For all staff: Teachers, Office Staff, Support Staff (Bai, Helper, Driver, etc.)
 * Includes Emergency Contact (Family Number)
 */
export default function EmployeeIDCard({ employee, school, onClose }) {
  const cardRef = useRef(null);

  const handlePrint = () => {
    const printContent = cardRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee ID - ${employee?.name}</title>
        <style>
          @page { 
            size: 85.6mm 54mm;
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .id-card {
            width: 85.6mm;
            height: 54mm;
            background: linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%);
            border-radius: 8px;
            padding: 8px;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            color: white;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.1;
            width: 60mm;
            height: 60mm;
            z-index: 0;
          }
          .card-content {
            position: relative;
            z-index: 1;
            height: 100%;
          }
          .school-header {
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .school-name {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!employee) return null;

  // Get role display name
  const getRoleDisplay = (role) => {
    const roleMap = {
      'teacher': 'Teacher / शिक्षक',
      'principal': 'Principal / प्रधानाचार्य',
      'vice_principal': 'Vice Principal',
      'admin': 'Admin Staff',
      'accountant': 'Accountant / लेखाकार',
      'clerk': 'Office Clerk',
      'librarian': 'Librarian / पुस्तकालयाध्यक्ष',
      'peon': 'Office Attendant',
      'helper': 'Helper / सहायक',
      'sweeper': 'Cleaning Staff / सफाई कर्मी',
      'driver': 'Driver / चालक',
      'conductor': 'Bus Conductor',
      'guard': 'Security Guard / सुरक्षा गार्ड',
      'cook': 'Cook / रसोइया',
      'gardener': 'Gardener / माली',
      'electrician': 'Electrician',
      'lab_assistant': 'Lab Assistant',
      'sports_coach': 'Sports Coach / खेल प्रशिक्षक',
      'other': employee?.designation || 'Staff'
    };
    return roleMap[role] || employee?.designation || role || 'Staff';
  };

  // Generate employee ID if not present
  const employeeId = employee.employee_id || employee.id?.slice(-8).toUpperCase() || 'EMP-' + Date.now().toString().slice(-6);

  // Academic year
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Employee ID Card Preview</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* ID Card Preview */}
        <div ref={cardRef} className="flex justify-center mb-4">
          <div className="id-card" style={{
            width: '340px',
            height: '215px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%)',
            borderRadius: '12px',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            {/* Watermark */}
            {school?.logo_url && (
              <div className="watermark" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.08,
                width: '180px',
                height: '180px',
                zIndex: 0
              }}>
                <img src={school.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}
            
            {/* Card Content */}
            <div className="card-content" style={{ position: 'relative', zIndex: 1, height: '100%' }}>
              {/* School Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {school?.name || 'School Name'}
                </div>
                <div style={{ fontSize: '7px', opacity: 0.9, marginTop: '2px' }}>
                  {school?.address || 'School Address'}
                </div>
                <div style={{ 
                  fontSize: '8px', 
                  background: 'rgba(255,255,255,0.2)', 
                  display: 'inline-block', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  marginTop: '4px',
                  fontWeight: 'bold'
                }}>
                  EMPLOYEE ID CARD
                </div>
              </div>
              
              {/* Employee Info */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Photo */}
                <div style={{ width: '70px', flexShrink: 0 }}>
                  <div style={{
                    width: '70px',
                    height: '85px',
                    background: 'white',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '10px',
                    overflow: 'hidden'
                  }}>
                    {employee.photo_url ? (
                      <img src={employee.photo_url} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      'Photo'
                    )}
                  </div>
                </div>
                
                {/* Details */}
                <div style={{ flex: 1, fontSize: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#fef08a' }}>
                    {employee.name || employee.full_name}
                  </div>
                  
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ opacity: 0.8, width: '70px', display: 'inline-block' }}>Designation:</span>
                    <span style={{ fontWeight: 'bold' }}>{getRoleDisplay(employee.role)}</span>
                  </div>
                  
                  {employee.department && (
                    <div style={{ marginBottom: '2px' }}>
                      <span style={{ opacity: 0.8, width: '70px', display: 'inline-block' }}>Department:</span>
                      <span style={{ fontWeight: 'bold' }}>{employee.department}</span>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ opacity: 0.8, width: '70px', display: 'inline-block' }}>Employee ID:</span>
                    <span style={{ fontWeight: 'bold' }}>{employeeId}</span>
                  </div>
                  
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ opacity: 0.8, width: '70px', display: 'inline-block' }}>Blood Group:</span>
                    <span style={{ fontWeight: 'bold' }}>{employee.blood_group || 'N/A'}</span>
                  </div>
                  
                  {/* Emergency Contact - Family Number */}
                  <div style={{ 
                    marginTop: '4px', 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '4px 6px', 
                    borderRadius: '4px',
                    fontSize: '8px'
                  }}>
                    <div style={{ marginBottom: '2px' }}>
                      <span style={{ opacity: 0.9 }}>📞 Self: </span>
                      <span style={{ fontWeight: 'bold' }}>{employee.phone || employee.mobile || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ opacity: 0.9 }}>🆘 Emergency: </span>
                      <span style={{ fontWeight: 'bold' }}>
                        {employee.emergency_contact || employee.family_phone || employee.alternate_phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '6px',
                opacity: 0.8
              }}>
                <div>
                  {school?.phone && <span>📞 {school.phone}</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Valid: {academicYear}</div>
                  <div style={{ fontSize: '5px' }}>Powered by Schooltino.in</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
            <Printer className="w-4 h-4 mr-2" />
            Print ID Card
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        
        {/* Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          💡 Print on PVC card (85.6mm × 54mm) for best results
        </p>
      </div>
    </div>
  );
}
