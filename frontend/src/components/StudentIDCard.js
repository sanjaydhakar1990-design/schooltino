import { useRef } from 'react';
import { Button } from './ui/button';
import { Printer, Download } from 'lucide-react';

/**
 * Printable Student ID Card Component
 * Professional format with school logo watermark
 */
export default function StudentIDCard({ student, school, onClose }) {
  const cardRef = useRef(null);

  const handlePrint = () => {
    const printContent = cardRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student ID - ${student?.name}</title>
        <style>
          @page { 
            size: 85.6mm 54mm; /* Standard ID card size */
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
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
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
          .school-address {
            font-size: 6px;
            opacity: 0.9;
          }
          .student-info {
            display: flex;
            gap: 8px;
          }
          .photo-section {
            width: 22mm;
            flex-shrink: 0;
          }
          .student-photo {
            width: 22mm;
            height: 26mm;
            background: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 8px;
          }
          .student-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
          }
          .details-section {
            flex: 1;
            font-size: 7px;
          }
          .detail-row {
            display: flex;
            margin-bottom: 2px;
          }
          .detail-label {
            width: 20mm;
            opacity: 0.8;
          }
          .detail-value {
            font-weight: bold;
          }
          .student-name {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 4px;
            color: #fef08a;
          }
          .student-id-badge {
            background: rgba(255,255,255,0.2);
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            display: inline-block;
            margin-top: 4px;
          }
          .card-footer {
            position: absolute;
            bottom: 6px;
            left: 8px;
            right: 8px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 5px;
            opacity: 0.8;
          }
          .validity {
            text-align: right;
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

  if (!student) return null;

  // Generate academic year
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full">
        <h3 className="text-lg font-bold mb-4">Student ID Card Preview</h3>
        
        {/* ID Card Preview */}
        <div ref={cardRef} className="flex justify-center mb-4">
          <div className="id-card" style={{
            width: '340px',
            height: '215px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
            borderRadius: '12px',
            padding: '12px',
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            {/* Background Watermark - School Logo */}
            {school?.logo_url && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.1,
                width: '200px',
                height: '200px',
                zIndex: 0,
                pointerEvents: 'none'
              }}>
                <img src={school.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}
            
            {/* Card Content */}
            <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
              {/* School Header with Logo */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.3)', 
                paddingBottom: '6px', 
                marginBottom: '8px' 
              }}>
                {/* School Logo in Header */}
                {school?.logo_url && (
                  <div style={{
                    width: '35px',
                    height: '35px',
                    background: 'white',
                    borderRadius: '50%',
                    padding: '2px',
                    flexShrink: 0
                  }}>
                    <img src={school.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
                  </div>
                )}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {school?.name || 'School Name'}
                  </div>
                  <div style={{ fontSize: '7px', opacity: 0.9 }}>
                    {school?.address || ''}
                  </div>
                </div>
              </div>
              
              {/* Student Info */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Photo */}
                <div style={{ width: '80px', flexShrink: 0 }}>
                  <div style={{
                    width: '80px',
                    height: '95px',
                    background: 'white',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '10px',
                    overflow: 'hidden'
                  }}>
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      'Photo'
                    )}
                  </div>
                </div>
                
                {/* Details */}
                <div style={{ flex: 1, fontSize: '9px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', color: '#fef08a' }}>
                    {student.name}
                  </div>
                  
                  <div style={{ marginBottom: '3px' }}>
                    <span style={{ opacity: 0.8, width: '65px', display: 'inline-block' }}>Class:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {student.class_name || student.class_display || student.class || 'N/A'}
                      {student.section && student.section !== 'A' ? ` - ${student.section}` : ''}
                    </span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <span style={{ opacity: 0.8, width: '65px', display: 'inline-block' }}>DOB:</span>
                    <span style={{ fontWeight: 'bold' }}>{student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A'}</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <span style={{ opacity: 0.8, width: '65px', display: 'inline-block' }}>Blood:</span>
                    <span style={{ fontWeight: 'bold' }}>{student.blood_group || 'N/A'}</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <span style={{ opacity: 0.8, width: '65px', display: 'inline-block' }}>Father:</span>
                    <span style={{ fontWeight: 'bold' }}>{student.father_name || 'N/A'}</span>
                  </div>
                  
                  {/* Emergency Contact - Parent Mobile */}
                  <div style={{ 
                    marginTop: '4px', 
                    background: 'rgba(255,255,255,0.15)', 
                    padding: '3px 6px', 
                    borderRadius: '4px',
                    fontSize: '8px'
                  }}>
                    <span style={{ opacity: 0.9 }}>📞 Emergency: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {student.parent_phone || student.father_phone || student.mother_phone || student.guardian_phone || 'N/A'}
                    </span>
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
                fontSize: '7px',
                opacity: 0.8
              }}>
                <div>
                  📞 {school?.phone || student.mobile}
                </div>
                <div style={{ textAlign: 'right' }}>
                  Valid: {academicYear}<br/>
                  Powered by Schooltino
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" />
            Print ID Card
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
