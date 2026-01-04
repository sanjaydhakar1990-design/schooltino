import React, { useState, useEffect } from 'react';
import { X, Gift, Clock, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

// Trial Configuration
export const TRIAL_CONFIG = {
  isTrialMode: true,
  trialDays: 30,
  trialStartDate: '2025-01-04', // Adjust this when giving to school
  schoolName: '', // Will be set during setup
  contactPhone: '+91 7879967616',
  contactWhatsApp: '+91 7879967616',
  supportEmail: 'support@schooltino.in',
  features: {
    aiSupport: true,
    feePayment: true, // UI only, actual payment manual
    onlineExams: true,
    attendance: true,
    reports: true,
    allFeatures: true
  }
};

// Calculate days remaining
export const getTrialDaysRemaining = () => {
  const start = new Date(TRIAL_CONFIG.trialStartDate);
  const now = new Date();
  const diffTime = (start.getTime() + TRIAL_CONFIG.trialDays * 24 * 60 * 60 * 1000) - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const isTrialExpired = () => {
  return getTrialDaysRemaining() <= 0;
};

// Trial Banner Component
export function TrialBanner({ onClose }) {
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setDaysRemaining(getTrialDaysRemaining());
  }, []);

  if (!TRIAL_CONFIG.isTrialMode) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <span className="font-medium">🎉 FREE Trial Active</span>
          </div>
          <span className="hidden sm:inline text-emerald-100">|</span>
          <div className="hidden sm:flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {daysRemaining > 0 
                ? `${daysRemaining} din remaining` 
                : 'Trial expired - Contact us to continue'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Full AI Support
          </Button>
          <a 
            href={`https://wa.me/917879967616?text=Hi, I'm using Schooltino trial. Need help!`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            WhatsApp Support
          </a>
        </div>
      </div>

      {showDetails && (
        <div className="max-w-7xl mx-auto mt-2 p-3 bg-white/10 rounded-lg text-sm">
          <p className="font-medium mb-2">✨ Trial Period Benefits:</p>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <li>✅ All Features Unlocked</li>
            <li>✅ AI Accountant</li>
            <li>✅ Online Exams</li>
            <li>✅ Attendance System</li>
            <li>✅ Fee Management</li>
            <li>✅ WhatsApp Support</li>
            <li>✅ Training Included</li>
            <li>✅ Data Safe Forever</li>
          </ul>
          <p className="mt-2 text-emerald-100 text-xs">
            📞 Help chahiye? Call/WhatsApp: {TRIAL_CONFIG.contactPhone}
          </p>
        </div>
      )}
    </div>
  );
}

// Support FAB (Floating Action Button)
export function SupportFAB() {
  const [isOpen, setIsOpen] = useState(false);

  if (!TRIAL_CONFIG.isTrialMode) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl p-4 w-72 border">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Need Help?
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Trial period me unlimited support available hai!
          </p>
          
          <div className="space-y-2">
            <a
              href={`https://wa.me/917879967616?text=Hi, I need help with Schooltino`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-800">WhatsApp</p>
                <p className="text-xs text-green-600">Instant Reply</p>
              </div>
            </a>
            
            <a
              href="tel:+917879967616"
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-blue-800">Call Us</p>
                <p className="text-xs text-blue-600">+91 7879967616</p>
              </div>
            </a>
          </div>
          
          <p className="text-xs text-slate-400 mt-3 text-center">
            Support Hours: 9 AM - 9 PM
          </p>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen 
            ? 'bg-slate-700 rotate-45' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}

// Trial Status Card for Dashboard
export function TrialStatusCard() {
  const daysRemaining = getTrialDaysRemaining();
  
  if (!TRIAL_CONFIG.isTrialMode) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-6 h-6" />
            <span className="font-bold text-lg">Free Trial Active</span>
          </div>
          <p className="text-emerald-100 text-sm mb-4">
            All premium features unlocked!
          </p>
          
          <div className="flex items-center gap-4">
            <div>
              <p className="text-3xl font-bold">{daysRemaining}</p>
              <p className="text-xs text-emerald-200">Days Left</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-sm font-medium">Includes:</p>
              <p className="text-xs text-emerald-200">AI Support • All Features</p>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <a
            href="https://wa.me/917879967616"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Get Help
          </a>
        </div>
      </div>
    </div>
  );
}

export default { TrialBanner, SupportFAB, TrialStatusCard, TRIAL_CONFIG };
