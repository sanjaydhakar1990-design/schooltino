/**
 * SCHOOL MARKETING PAGE
 * Each school can share this page to market themselves
 * Dynamic school-specific content
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Building, Users, GraduationCap, BookOpen, Award, Star, Phone, Mail,
  MapPin, Clock, Calendar, CheckCircle, Camera, Brain, MessageCircle,
  Share2, Copy, ExternalLink, Shield, Heart, TrendingUp, Zap
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || '';

const SchoolMarketingPage = () => {
  const { schoolId } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyQuote, setDailyQuote] = useState('');

  // Daily motivational quotes for schools
  const quotes = [
    "शिक्षा सबसे बड़ा हथियार है जिससे आप दुनिया बदल सकते हैं। - Nelson Mandela",
    "अच्छी शिक्षा एक बेहतर भविष्य की नींव है।",
    "हर बच्चे में एक प्रतिभा छुपी होती है, बस उसे पहचानने की जरूरत है।",
    "ज्ञान का दीपक जलाओ, अंधकार दूर भगाओ।",
    "पढ़ाई में लगाओ ध्यान, बनो देश का सम्मान।",
    "शिक्षा से बढ़कर कोई धन नहीं।",
    "आज की मेहनत, कल की सफलता।"
  ];

  useEffect(() => {
    // Set daily quote based on day
    const dayIndex = new Date().getDay();
    setDailyQuote(quotes[dayIndex]);
    
    fetchSchoolData();
  }, [schoolId]);

  const fetchSchoolData = async () => {
    try {
      // Try to fetch school data
      const res = await axios.get(`${API}/schools/${schoolId}`);
      setSchool(res.data);
    } catch (err) {
      // Use demo data if not found
      setSchool({
        name: "आदर्श विद्या मंदिर",
        tagline: "ज्ञान का मंदिर, संस्कार का केंद्र",
        established: "1995",
        board: "MP Board / CBSE",
        classes: "Nursery to 12th",
        students: "1500+",
        teachers: "75+",
        address: "Main Road, City Name, MP",
        phone: "+91 78799 67616",
        email: "info@school.com",
        features: [
          "AI-Powered Smart Classes",
          "CCTV Monitored Campus",
          "Online Fee Payment",
          "Parent Mobile App",
          "Transport Facility",
          "Sports & Extra Activities"
        ],
        achievements: [
          "100% Results - 10th & 12th",
          "State Topper 2024",
          "Best School Award 2023"
        ],
        logo: null
      });
    } finally {
      setLoading(false);
    }
  };

  const shareOnWhatsApp = () => {
    const text = `🏫 *${school?.name}*\n\n${school?.tagline}\n\n✅ ${school?.classes}\n✅ ${school?.students} Students\n✅ ${school?.teachers} Teachers\n✅ ${school?.board}\n\n📍 ${school?.address}\n📞 ${school?.phone}\n\n💡 "${dailyQuote}"\n\n🌐 Powered by Schooltino AI`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const copyShareText = () => {
    const text = `🏫 *${school?.name}*\n\n${school?.tagline}\n\n✅ ${school?.classes}\n✅ ${school?.students} Students\n✅ ${school?.teachers} Teachers\n\n📞 ${school?.phone}\n\n💡 "${dailyQuote}"`;
    navigator.clipboard.writeText(text);
    toast.success('Copied! WhatsApp में paste करो');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading School Info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      {/* Header with School Logo */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Building className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">{school?.name}</h1>
              <p className="text-xs text-blue-200">Est. {school?.established}</p>
            </div>
          </div>
          <button
            onClick={shareOnWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Building className="w-14 h-14 text-white" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          {school?.name}
        </h1>
        <p className="text-xl text-blue-200 mb-8">
          {school?.tagline}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <GraduationCap className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{school?.students}</p>
            <p className="text-xs text-blue-200">Students</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{school?.teachers}</p>
            <p className="text-xs text-blue-200">Teachers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{school?.classes}</p>
            <p className="text-xs text-blue-200">Classes</p>
          </div>
        </div>

        {/* Board */}
        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-8">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-white font-medium">{school?.board}</span>
        </div>
      </div>

      {/* Daily Quote */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 text-center">
          <p className="text-lg text-amber-200 italic">"{dailyQuote}"</p>
          <p className="text-xs text-amber-400 mt-2">📅 आज का विचार</p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">✨ हमारी विशेषताएं</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {school?.features?.map((feature, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-white text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">🏆 उपलब्धियां</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {school?.achievements?.map((achievement, idx) => (
            <div key={idx} className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full px-4 py-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-white fill-white" />
              <span className="text-white text-sm font-medium">{achievement}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Powered by Schooltino */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <span className="text-white font-bold text-lg">Powered by Schooltino AI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-200">
            <span className="flex items-center gap-1"><Camera className="w-4 h-4" /> Smart CCTV</span>
            <span className="flex items-center gap-1"><Brain className="w-4 h-4" /> AI Assistant</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Safe Campus</span>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">📞 संपर्क करें</h2>
          
          <div className="space-y-4 mb-6">
            <a href={`tel:${school?.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium">{school?.phone}</span>
            </a>
            <a href={`mailto:${school?.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium">{school?.email}</span>
            </a>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-medium">{school?.address}</span>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-3">
            <button
              onClick={copyShareText}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Copy className="w-5 h-5" />
              Copy
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Share
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/20 py-4 text-center">
        <p className="text-blue-200 text-sm">
          Made with ❤️ using <a href="https://schoolerp-7.preview.emergentagent.com" className="text-amber-400 hover:underline">Schooltino</a>
        </p>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={`https://wa.me/917879967616?text=Hi!%20I%20saw%20${encodeURIComponent(school?.name)}%20page`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all transform hover:scale-110 z-50"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
};

export default SchoolMarketingPage;
