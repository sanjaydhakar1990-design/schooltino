# 🏫 Schooltino - Pilot School Setup Guide

## School ko dene se pehle ye karo:

### Step 1: Trial Start Date Set Karo
File: `/app/frontend/src/components/TrialMode.js`

```javascript
export const TRIAL_CONFIG = {
  isTrialMode: true,
  trialDays: 30,  // 30 days trial
  trialStartDate: '2025-01-05', // <-- YE DATE BADLO (jis din school ko dena hai)
  schoolName: 'ABC School', // <-- School ka naam
  contactPhone: '+91 7879967616',
  // ... rest same
};
```

### Step 2: School Register Karo
1. Go to: https://school-erp-14.preview.emergentagent.com/app/school-registration
2. Fill school details
3. Note down the School ID

### Step 3: Admin Account Create Karo
School ke liye dedicated login banao:
- Email: school_name@schooltino.com
- Password: Strong password

### Step 4: Initial Data Setup
1. **Classes Add Karo:** Nursery se 12th tak
2. **Fee Structure Set Karo:** `/app/fee-structure`
3. **1-2 Sample Students Add Karo** for demo

---

## 📋 School ko dene wala Checklist:

### Day 1 - Installation Day:
- [ ] School visit karo
- [ ] Director se meeting (30 min)
- [ ] Admin login credentials do
- [ ] App ka demo do (15 min)
- [ ] First 5 students add karwao (hands-on)
- [ ] WhatsApp group create karo (School Staff + You)

### Day 2-7 - Initial Support:
- [ ] Daily WhatsApp check (morning + evening)
- [ ] Phone call (har 2 din)
- [ ] Issues note karo
- [ ] Minor fixes same day

### Day 8-15 - Stabilization:
- [ ] Weekly call (Monday)
- [ ] New features explain karo
- [ ] Feedback collect karo

### Day 16-30 - Full Usage:
- [ ] Bi-weekly call
- [ ] Usage report share karo
- [ ] Future plans discuss karo

---

## 📞 Support Response Time:

| Issue Type | Response Time |
|------------|---------------|
| App not opening | 30 minutes |
| Data issue | 1 hour |
| Feature query | 2-4 hours |
| New feature request | Note + discuss weekly |

---

## 🎯 Success Metrics (30 days):

Track these in the pilot:

1. **Daily Active Users:** Kitne log daily use kar rahe hain?
2. **Features Used:** Kaunsi features sabse zyada use ho rahe hain?
3. **Issues Reported:** Kitni problems aayi?
4. **Time Saved:** School staff ka kitna time bach raha hai?
5. **Satisfaction Score:** 1-10 rating from Director

---

## 📝 Feedback Template:

Weekly school se ye poochho:

1. Kya kaam aacha chal raha hai?
2. Kya mushkil aa rahi hai?
3. Kya feature chahiye jo abhi nahi hai?
4. Staff ka feedback kya hai?
5. Parents ka reaction kaisa hai?

---

## 🚀 After 30 Days:

### If Successful:
1. Case study banao
2. Testimonial video lo
3. Pricing discuss karo
4. Annual plan offer karo

### If Issues:
1. Extend trial by 15 days
2. Fix major issues
3. Re-evaluate

---

## 📱 Quick Links:

- **Admin Panel:** https://school-erp-14.preview.emergentagent.com/login
- **TeachTino:** https://school-erp-14.preview.emergentagent.com/teachtino
- **StudyTino:** https://school-erp-14.preview.emergentagent.com/studytino
- **WhatsApp Support:** wa.me/917879967616

---

## 🔐 Data Safety Promise:

School ko ye bolna:
1. "Aapka data 100% safe hai"
2. "Hum daily backup lete hain"
3. "Trial khatam hone pe bhi data delete nahi hoga"
4. "Aap kabhi bhi data export kar sakte ho"

---

Good luck with your pilot! 🎉
