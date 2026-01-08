/**
 * SCHOOLTINO - Marketing Brochure Page
 * Share this page link on WhatsApp for impressive marketing
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, Mic, Camera, Users, BookOpen, CreditCard, Bus, Shield,
  CheckCircle, Star, ArrowRight, Phone, Mail, MessageCircle,
  Play, Zap, Award, Clock, Globe, Heart, TrendingUp, Building,
  GraduationCap, UserCheck, Bell, BarChart3, Calendar, FileText
} from 'lucide-react';

const MarketingPage = () => {
  const [isVisible, setIsVisible] = useState({});
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Tino AI Brain",
      titleHi: "टीनो AI ब्रेन",
      desc: "बोलो और काम हो जाए! Alexa जैसा AI Assistant",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: Mic,
      title: "Voice Commands",
      titleHi: "आवाज़ से कंट्रोल",
      desc: "Hindi, English, Hinglish - कोई भी भाषा बोलो",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Camera,
      title: "CCTV + AI",
      titleHi: "स्मार्ट CCTV",
      desc: "Face Recognition, Auto Attendance, Gate Greeting",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: Users,
      title: "Complete Management",
      titleHi: "पूरा प्रबंधन",
      desc: "Students, Teachers, Staff - सब एक जगह",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: CreditCard,
      title: "Smart Fees",
      titleHi: "स्मार्ट फीस",
      desc: "Online Payment, Auto Reminders, Full Tracking",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: BookOpen,
      title: "AI Paper Generator",
      titleHi: "AI पेपर जनरेटर",
      desc: "NCERT/MP Board - Instant Question Papers",
      color: "from-violet-500 to-purple-500"
    }
  ];

  const stats = [
    { number: "50+", label: "Schools", labelHi: "स्कूल" },
    { number: "10,000+", label: "Students", labelHi: "विद्यार्थी" },
    { number: "500+", label: "Teachers", labelHi: "शिक्षक" },
    { number: "99.9%", label: "Uptime", labelHi: "अपटाइम" }
  ];

  const testimonials = [
    {
      name: "राजेश शर्मा",
      role: "Director, सरस्वती विद्या मंदिर",
      text: "Schooltino ने हमारे स्कूल को पूरी तरह बदल दिया। अब मैं बस बोलता हूं और Tino सब काम कर देता है!",
      rating: 5
    },
    {
      name: "Dr. Priya Singh",
      role: "Principal, Modern Public School",
      text: "AI Paper Generator से हमारा exam preparation time 70% कम हो गया। Amazing tool!",
      rating: 5
    },
    {
      name: "अमित पटेल",
      role: "Owner, Kids Academy",
      text: "CCTV + Face Recognition से parents को real-time updates मिलते हैं। Trust बढ़ गया!",
      rating: 5
    }
  ];

  const packages = [
    {
      name: "Basic",
      price: "₹999",
      period: "/month",
      features: [
        "100 Students तक",
        "Attendance Management",
        "Fee Management",
        "Basic Reports",
        "Email Support"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "₹2,499",
      period: "/month",
      features: [
        "500 Students तक",
        "Tino AI Assistant",
        "Voice Commands",
        "AI Paper Generator",
        "CCTV Integration",
        "24/7 Support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: [
        "Unlimited Students",
        "Multi-Branch Support",
        "Custom Integrations",
        "Dedicated Manager",
        "On-site Training",
        "White Label Option"
      ],
      popular: false
    }
  ];

  const allFeatures = [
    { icon: Brain, name: "Tino AI Brain", nameHi: "AI ब्रेन" },
    { icon: Mic, name: "Voice Assistant", nameHi: "वॉइस असिस्टेंट" },
    { icon: Camera, name: "CCTV Integration", nameHi: "CCTV इंटीग्रेशन" },
    { icon: UserCheck, name: "Face Recognition", nameHi: "फेस रिकॉग्निशन" },
    { icon: Users, name: "Student Management", nameHi: "स्टूडेंट मैनेजमेंट" },
    { icon: GraduationCap, name: "Teacher Portal", nameHi: "टीचर पोर्टल" },
    { icon: CreditCard, name: "Fee Management", nameHi: "फीस मैनेजमेंट" },
    { icon: Calendar, name: "Attendance", nameHi: "अटेंडेंस" },
    { icon: BookOpen, name: "AI Paper Generator", nameHi: "AI पेपर जनरेटर" },
    { icon: FileText, name: "Report Cards", nameHi: "रिपोर्ट कार्ड" },
    { icon: Bus, name: "Transport Tracking", nameHi: "बस ट्रैकिंग" },
    { icon: Bell, name: "Smart Notifications", nameHi: "स्मार्ट नोटिफिकेशन" },
    { icon: Shield, name: "Safety Alerts", nameHi: "सेफ्टी अलर्ट्स" },
    { icon: BarChart3, name: "Analytics", nameHi: "एनालिटिक्स" },
    { icon: Building, name: "Front Office", nameHi: "फ्रंट ऑफिस" },
    { icon: Heart, name: "Health Module", nameHi: "हेल्थ मॉड्यूल" }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Schooltino</h1>
                <p className="text-xs text-purple-200">AI-Powered School Management</p>
              </div>
            </div>
            <Link 
              to="/"
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all"
            >
              Login →
            </Link>
          </div>

          {/* Hero Content */}
          <div className="flex flex-col lg:flex-row items-center gap-12 pt-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-purple-100">India's #1 AI School Software</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                बोलो और <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">काम हो जाए!</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-purple-100 mb-8 max-w-xl">
                Tino AI - आपके स्कूल का Alexa! 🎤 बोलकर Attendance लगाओ, Fees Reminder भेजो, Reports देखो - सब कुछ आवाज़ से!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a 
                  href="https://wa.me/919876543210?text=Hi!%20I%20want%20demo%20of%20Schooltino"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-green-500/30 transition-all transform hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Demo बुक करें
                </a>
                <Link 
                  to="/"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Free Trial शुरू करें
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-purple-200">100% Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="text-sm text-purple-200">24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-purple-200">Hindi + English</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="flex-1 relative">
              <div className="relative w-full max-w-lg mx-auto">
                <img 
                  src="https://images.unsplash.com/photo-1601655781320-205e34c94eb1?w=600&h=400&fit=crop" 
                  alt="Smart School Management"
                  className="rounded-2xl shadow-2xl shadow-purple-500/30 border-4 border-white/10"
                />
                {/* Floating Cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-3 animate-bounce" style={{animationDuration: '3s'}}>
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-800">AI Active</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-xl p-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    <span className="text-sm font-semibold">"Attendance लगाओ"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {stat.number}
                </div>
                <div className="text-gray-600 mt-2">{stat.labelHi}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              🚀 Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              एक Software में सब कुछ - No Need for Multiple Apps!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-2">{feature.titleHi}</p>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tino AI Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Brain className="w-5 h-5 text-amber-400" />
                <span className="text-purple-200">Powered by AI</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                मिलिए <span className="text-amber-400">Tino AI</span> से!
              </h2>
              
              <p className="text-lg text-purple-100 mb-8">
                Tino AI आपके स्कूल का virtual assistant है। बस बोलो:
              </p>

              <div className="space-y-4 mb-8">
                {[
                  '"Aaj ki attendance batao"',
                  '"Class 10 ki condition batao"',
                  '"Fee reminder bhejo"',
                  '"Weak students kaun hai"',
                  '"Teacher kaisa padha raha"'
                ].map((cmd, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
                    <Mic className="w-5 h-5 text-green-400 animate-pulse" />
                    <span className="text-white font-medium">{cmd}</span>
                    <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                  </div>
                ))}
              </div>

              <a 
                href="https://wa.me/919876543210?text=Hi!%20I%20want%20to%20try%20Tino%20AI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-all"
              >
                Tino से बात करें <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            <div className="flex-1">
              <img 
                src="https://images.unsplash.com/photo-1541178735493-479c1a27ed24?w=600&h=400&fit=crop" 
                alt="Tino AI Assistant"
                className="rounded-2xl shadow-2xl border-4 border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              80+ Features in One Platform
            </h2>
            <p className="text-gray-600">सब कुछ एक जगह - No More Juggling Multiple Apps!</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-indigo-50 transition-colors">
                <feature.icon className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                  <p className="text-xs text-gray-500">{feature.nameHi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ❤️ Happy Schools
            </h2>
            <p className="text-gray-600">See what our users say about Schooltino</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xl text-gray-700 mb-6 italic">
                "{testimonials[activeTestimonial].text}"
              </p>
              <div className="font-semibold text-gray-900">{testimonials[activeTestimonial].name}</div>
              <div className="text-sm text-indigo-600">{testimonials[activeTestimonial].role}</div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-3 h-3 rounded-full transition-colors ${activeTestimonial === idx ? 'bg-indigo-600' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              💰 Simple Pricing
            </h2>
            <p className="text-gray-600">Choose the plan that fits your school</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg, idx) => (
              <div 
                key={idx}
                className={`relative rounded-2xl p-8 ${pkg.popular ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/30 scale-105' : 'bg-white border-2 border-gray-100'}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${pkg.popular ? 'text-white' : 'text-gray-900'}`}>
                  {pkg.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${pkg.popular ? 'text-white' : 'text-indigo-600'}`}>
                    {pkg.price}
                  </span>
                  <span className={pkg.popular ? 'text-purple-200' : 'text-gray-500'}>
                    {pkg.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${pkg.popular ? 'text-green-300' : 'text-green-500'}`} />
                      <span className={pkg.popular ? 'text-purple-100' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <a 
                  href={`https://wa.me/919876543210?text=Hi!%20I%20want%20${pkg.name}%20plan%20for%20my%20school`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center py-3 rounded-full font-semibold transition-all ${pkg.popular ? 'bg-white text-indigo-600 hover:shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            🎉 Start Your Free Trial Today!
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            30 दिन का Free Trial - No Credit Card Required
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://wa.me/919876543210?text=Hi!%20I%20want%20free%20trial%20of%20Schooltino"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp पर Contact करें
            </a>
            <a 
              href="tel:+919876543210"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all"
            >
              <Phone className="w-6 h-6" />
              Call: +91 98765 43210
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Schooltino</h3>
                <p className="text-xs">AI-Powered School Management</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="mailto:support@schooltino.com" className="hover:text-white transition-colors flex items-center gap-2">
                <Mail className="w-5 h-5" />
                support@schooltino.com
              </a>
              <a href="tel:+919876543210" className="hover:text-white transition-colors flex items-center gap-2">
                <Phone className="w-5 h-5" />
                +91 98765 43210
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2026 Schooltino. Made with ❤️ in India
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/919876543210?text=Hi!%20I%20want%20to%20know%20more%20about%20Schooltino"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all transform hover:scale-110 animate-bounce"
        style={{animationDuration: '2s'}}
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
};

export default MarketingPage;
