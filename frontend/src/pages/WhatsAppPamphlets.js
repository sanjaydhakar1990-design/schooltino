/**
 * SCHOOLTINO - WhatsApp Marketing Pamphlets
 * Daily shareable content for WhatsApp status and groups
 */

import React, { useState, useRef } from 'react';
import { 
  Brain, Mic, Camera, Users, BookOpen, CreditCard, Download, Share2,
  CheckCircle, Star, Zap, Phone, MessageCircle, Copy, ExternalLink,
  Sparkles, Target, Award, TrendingUp, Shield, Clock, Heart
} from 'lucide-react';
import { toast } from 'sonner';

const WhatsAppPamphlets = () => {
  const [selectedPamphlet, setSelectedPamphlet] = useState(0);
  const pamphletRef = useRef(null);

  const WHATSAPP_NUMBER = "917879967616";
  const WEBSITE_URL = "https://form-submit-fix-3.preview.emergentagent.com";

  // Daily shareable pamphlets data
  const pamphlets = [
    {
      id: 1,
      title: "Tino AI - Voice Assistant",
      tagline: "बोलो और काम हो जाए! 🎤",
      description: "अब आपके स्कूल का अपना Alexa! सिर्फ बोलकर Attendance लगाओ, Fee Reminder भेजो, Reports देखो!",
      features: ["Hindi + English Voice", "Instant Actions", "24/7 Available"],
      gradient: "from-purple-600 to-indigo-700",
      icon: Brain,
      whatsappText: "🎤 *Schooltino - AI Voice Assistant*\n\nबोलो और काम हो जाए!\n\n✅ Voice से Attendance\n✅ Voice से Fee Reminder\n✅ Hindi + English Support\n\n📞 Demo के लिए: wa.me/917879967616\n🌐 Website: meri-schooltino.preview.emergentagent.com"
    },
    {
      id: 2,
      title: "Smart CCTV + AI",
      tagline: "Face Recognition से Auto Attendance! 📷",
      description: "Gate पर आते ही Student पहचान, Attendance लग गई, Parents को notification चला गया!",
      features: ["Face Recognition", "Auto Attendance", "Real-time Alerts"],
      gradient: "from-emerald-600 to-teal-700",
      icon: Camera,
      whatsappText: "📷 *Schooltino - Smart CCTV*\n\nFace Recognition से Auto Attendance!\n\n✅ Gate Entry = Auto Attendance\n✅ Parents को Instant Alert\n✅ Unknown Person Detection\n\n📞 Demo: wa.me/917879967616\n🌐 meri-schooltino.preview.emergentagent.com"
    },
    {
      id: 3,
      title: "AI Paper Generator",
      tagline: "5 मिनट में Question Paper! 📝",
      description: "NCERT, MP Board - कोई भी syllabus, कोई भी class, instant question paper ready!",
      features: ["NCERT + State Boards", "Auto Difficulty Levels", "Print Ready"],
      gradient: "from-orange-500 to-red-600",
      icon: BookOpen,
      whatsappText: "📝 *Schooltino - AI Paper Generator*\n\n5 मिनट में Question Paper!\n\n✅ NCERT + MP Board Support\n✅ Class 1-12 All Subjects\n✅ Easy/Medium/Hard Levels\n\n📞 Demo: wa.me/917879967616\n🌐 meri-schooltino.preview.emergentagent.com"
    },
    {
      id: 4,
      title: "Smart Fee Management",
      tagline: "Online Payment + Auto Reminder! 💰",
      description: "UPI, Card, Net Banking - सब accepted! Pending fee का auto reminder, instant receipt!",
      features: ["Online Payment", "Auto Reminders", "Instant Receipt"],
      gradient: "from-pink-500 to-rose-600",
      icon: CreditCard,
      whatsappText: "💰 *Schooltino - Smart Fees*\n\nOnline Payment + Auto Reminder!\n\n✅ UPI/Card/Net Banking\n✅ Auto Fee Reminders\n✅ Digital Receipt\n\n📞 Demo: wa.me/917879967616\n🌐 meri-schooltino.preview.emergentagent.com"
    },
    {
      id: 5,
      title: "Complete School Solution",
      tagline: "80+ Features एक जगह! 🚀",
      description: "Students, Teachers, Fees, Attendance, CCTV, Transport - सब कुछ एक app में!",
      features: ["All-in-One Solution", "₹999/month से शुरू", "Free Trial"],
      gradient: "from-blue-600 to-cyan-600",
      icon: Zap,
      whatsappText: "🚀 *Schooltino - Complete School Management*\n\n80+ Features एक जगह!\n\n✅ AI Voice Assistant\n✅ Smart CCTV + Face ID\n✅ Online Fee Payment\n✅ AI Paper Generator\n✅ Transport Tracking\n\n💰 ₹999/month से शुरू\n📞 Free Demo: wa.me/917879967616"
    },
    {
      id: 6,
      title: "Free 30-Day Trial",
      tagline: "अभी शुरू करो - Free! 🎁",
      description: "No Credit Card, No Hidden Charges! 30 दिन free में try करो, पसंद आए तो continue करो!",
      features: ["30 Days Free", "Full Features", "No Card Required"],
      gradient: "from-amber-500 to-orange-600",
      icon: Award,
      whatsappText: "🎁 *Schooltino - FREE TRIAL*\n\n30 दिन Free - कोई Hidden Charges नहीं!\n\n✅ सभी Features Free\n✅ No Credit Card\n✅ Cancel Anytime\n\n🚀 अभी शुरू करो: wa.me/917879967616\n🌐 meri-schooltino.preview.emergentagent.com"
    },
    {
      id: 7,
      title: "Parents App",
      tagline: "Real-time Updates for Parents! 👨‍👩‍👧",
      description: "बच्चा school पहुंचा? Attendance लगी? Homework क्या है? सब instant notification!",
      features: ["Live Tracking", "Instant Alerts", "Homework Updates"],
      gradient: "from-violet-600 to-purple-700",
      icon: Users,
      whatsappText: "👨‍👩‍👧 *Schooltino - Parents App*\n\nReal-time Updates for Parents!\n\n✅ बच्चा पहुंचा - Alert\n✅ Attendance - Alert\n✅ Homework Updates\n✅ Fee Reminder\n\n📞 Demo: wa.me/917879967616\n🌐 meri-schooltino.preview.emergentagent.com"
    }
  ];

  // Copy WhatsApp text
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied! अब WhatsApp में paste करो');
  };

  // Share on WhatsApp
  const shareOnWhatsApp = (text) => {
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  // Open WhatsApp with pre-filled message
  const contactWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi!%20I%20want%20demo%20of%20Schooltino`, '_blank');
  };

  const currentPamphlet = pamphlets[selectedPamphlet];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">WhatsApp Marketing Kit</h1>
              <p className="text-xs text-green-100">Daily Share करो, Business बढ़ाओ!</p>
            </div>
          </div>
          <a 
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-all"
          >
            Website →
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Instructions */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            कैसे Use करें?
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <div>
                <p className="font-medium text-white">Pamphlet चुनो</p>
                <p className="text-sm">नीचे से कोई भी design select करो</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <div>
                <p className="font-medium text-white">Copy या Share करो</p>
                <p className="text-sm">Text copy करो या direct WhatsApp share</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
              <div>
                <p className="font-medium text-white">Status/Groups में लगाओ</p>
                <p className="text-sm">Daily अलग-अलग pamphlet share करो</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pamphlet Preview */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            <div 
              ref={pamphletRef}
              className={`bg-gradient-to-br ${currentPamphlet.gradient} rounded-3xl p-8 text-white shadow-2xl`}
            >
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Schooltino</h4>
                  <p className="text-xs text-white/70">AI-Powered School Management</p>
                </div>
              </div>

              {/* Main Icon */}
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <currentPamphlet.icon className="w-10 h-10" />
              </div>

              {/* Content */}
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{currentPamphlet.title}</h2>
                <p className="text-3xl font-bold mb-4">{currentPamphlet.tagline}</p>
                <p className="text-white/90 mb-6">{currentPamphlet.description}</p>

                {/* Features */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {currentPamphlet.features.map((feature, idx) => (
                    <span key={idx} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      ✓ {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="bg-white/20 rounded-2xl p-4">
                  <p className="text-sm mb-2">Free Demo के लिए WhatsApp करें</p>
                  <p className="text-2xl font-bold">📞 +91 78799 67616</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => copyToClipboard(currentPamphlet.whatsappText)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Copy className="w-5 h-5" />
                Copy Text
              </button>
              <button
                onClick={() => shareOnWhatsApp(currentPamphlet.whatsappText)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Share2 className="w-5 h-5" />
                Share on WhatsApp
              </button>
            </div>
          </div>

          {/* Pamphlet Selector */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Pamphlets चुनो (Daily अलग share करो)</h3>
            <div className="space-y-3">
              {pamphlets.map((pamphlet, idx) => (
                <button
                  key={pamphlet.id}
                  onClick={() => setSelectedPamphlet(idx)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedPamphlet === idx 
                      ? 'bg-gradient-to-r ' + pamphlet.gradient + ' text-white shadow-lg scale-[1.02]' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedPamphlet === idx ? 'bg-white/20' : 'bg-gray-700'
                    }`}>
                      <pamphlet.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{pamphlet.title}</h4>
                      <p className={`text-sm ${selectedPamphlet === idx ? 'text-white/70' : 'text-gray-500'}`}>
                        {pamphlet.tagline}
                      </p>
                    </div>
                    {selectedPamphlet === idx && (
                      <CheckCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Share Section */}
        <div className="mt-12 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Quick WhatsApp Messages
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "General Inquiry",
                text: "🏫 *Schooltino - AI School Management*\n\nआपके स्कूल के लिए complete solution!\n\n✅ AI Voice Assistant\n✅ Smart CCTV\n✅ Online Fees\n✅ 80+ Features\n\n📞 +91 78799 67616\n🌐 meri-schooltino.preview.emergentagent.com"
              },
              {
                title: "Free Trial Offer",
                text: "🎁 *FREE TRIAL - 30 Days!*\n\nSchool Management Software\n\n✅ कोई Hidden Charges नहीं\n✅ Cancel Anytime\n✅ Full Features\n\n👉 अभी शुरू करें: wa.me/917879967616"
              },
              {
                title: "Feature Highlight",
                text: "🤖 *AI से School चलाओ!*\n\n\"Attendance लगाओ\" - बोला और लग गई!\n\"Fee reminder भेजो\" - बोला और चला गया!\n\nTry करो FREE: wa.me/917879967616"
              },
              {
                title: "Testimonial Share",
                text: "⭐⭐⭐⭐⭐\n\n\"Schooltino ने हमारे school को पूरी तरह बदल दिया!\"\n- Director, सरस्वती विद्या मंदिर\n\n📞 Demo: wa.me/917879967616"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-medium text-white mb-2">{item.title}</h4>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap mb-3 font-sans">
                  {item.text.substring(0, 100)}...
                </pre>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(item.text)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                  <button
                    onClick={() => shareOnWhatsApp(item.text)}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tips */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">📅 Daily Marketing Tips</h3>
          <div className="grid md:grid-cols-7 gap-2 text-center text-sm">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div key={day} className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">{day}</p>
                <p className="text-white font-medium">{pamphlets[idx]?.title.split(' ')[0] || 'General'}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4 text-center">
            💡 हर दिन अलग feature highlight करो - ज़्यादा engagement मिलेगी!
          </p>
        </div>
      </div>

      {/* Floating Contact Button */}
      <button
        onClick={contactWhatsApp}
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all transform hover:scale-110 z-50"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    </div>
  );
};

export default WhatsAppPamphlets;
