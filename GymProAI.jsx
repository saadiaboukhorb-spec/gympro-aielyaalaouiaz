import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Flame, Brain, Ruler, Calendar, Sparkles, Trophy, Calculator, Gauge, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

// ملاحظة: يستخدم هذا الملف TailwindCSS + Framer Motion + Recharts.
// كل شيء يعمل داخل ملف واحد. فقط ضعه في مشروع React (Vite/Next) أو استعمل المعاينة هنا.
// الواجهة باللغة العربية وتدعم RTL.

// -------------------------------------------------------
// أدوات مساعدة: حساب السعرات، TDEE، الماكروز، 1RM، برنامج تمارين
// -------------------------------------------------------

function mifflinStJeor({ gender, weight, height, age }: { gender: "male" | "female"; weight; height; age; }) {
  // الوزن بالكيلوغرام، الطول بالسنتيمتر
  const s = gender === "male" ? 5 : -161;
  return (10 * weight) + (6.25 * height) - (5 * age) + s; // BMR
}

function activityFactor(level) {
  switch (level) {
    case "sedentary": return 1.2;
    case "light": return 1.375;
    case "moderate": return 1.55;
    case "active": return 1.725;
    case "athlete": return 1.9;
    default: return 1.55;
  }
}

function tdee({ bmr, level }: { bmr; level; }) {
  return Math.round(bmr * activityFactor(level));
}

function macrosSplit(calories, goal: "cut" | "recomp" | "bulk", weight) {
  // بروتين 1.8-2.2 غ/كغ — نختار 2.0 افتراضياً
  const proteinG = Math.round(weight * 2.0);
  const proteinCals = proteinG * 4;
  let fatPct = 0.25; // 25% من السعرات دهون
  if (goal === "cut") fatPct = 0.30;
  if (goal === "bulk") fatPct = 0.20;
  const fatCals = Math.round(calories * fatPct);
  const fatG = Math.round(fatCals / 9);
  const carbsCals = Math.max(calories - proteinCals - fatCals, 0);
  const carbsG = Math.round(carbsCals / 4);
  return { proteinG, fatG, carbsG };
}

function epley1RM({ weight, reps }: { weight; reps; }) {
  // معادلة إيپلي لتقدير 1RM
  return Math.round(weight * (1 + reps / 30));
}

function generatePlan({ days, level, goal }: { days; level: "beginner" | "intermediate" | "advanced"; goal: "cut" | "recomp" | "bulk"; }) {
  // يجهز برنامج مبسّط حسب عدد الأيام والمستوى والهدف
  const templates, any> = {
    beginner: {
      3: [
        { title: "اليوم 1 — علوي (Push)", exercises: ["ضغط صدر بار/دامبل", "كتف أمامي", "متوازي/دمبل ترايسبس", "بطن"] },
        { title: "اليوم 2 — سفلي", exercises: ["سكوات", "لانجز", "رومانيان ديدلفت", "سحب كابل للفخذ", "ساقين مكينة"] },
        { title: "اليوم 3 — علوي (Pull)", exercises: ["سحب علوي", "بار رو", "فيس بول", "بايسبس بار/دامبل", "بطن"] },
      ],
      4: [
        { title: "اليوم 1 — Push", exercises: ["ضغط صدر", "كتف علوي", "ترايسبس كابل", "بطن"] },
        { title: "اليوم 2 — Pull", exercises: ["سحب علوي", "بار رو", "بايسبس", "فيس بول"] },
        { title: "اليوم 3 — Lower", exercises: ["سكوات", "هامسترينغ", "كواد", "ساقين"] },
        { title: "اليوم 4 — Full Body خفيف", exercises: ["ضغط دمبل", "ددلفت خفيف", "سحب مقعد", "بايسبس/ترايسبس"] },
      ],
    },
    intermediate: {
      4: [
        { title: "اليوم 1 — صدر/ترايسبس", exercises: ["بنچ بار ثقيل", "ضغط دمبل مائل", "تفتيح", "ترايسبس كابل"] },
        { title: "اليوم 2 — ظهر/بايسبس", exercises: ["ددلفت", "سحب علوي", "بار رو", "بايسبس بار"] },
        { title: "اليوم 3 — أرجل", exercises: ["سكوات", "هاك سكوات", "لانجز", "ساقين"] },
        { title: "اليوم 4 — أكتاف/كور", exercises: ["كتف أمامي/جانبي", "فيس بول", "شرايين", "كور"] },
      ],
      5: [
        { title: "اليوم 1 — Push ثقيل", exercises: ["بنچ ثقيل", "كتف بار", "ترايسبس ديبس"] },
        { title: "اليوم 2 — Pull ثقيل", exercises: ["ددلفت", "بار رو", "بايسبس بار"] },
        { title: "اليوم 3 — Lower ثقيل", exercises: ["سكوات", "أمامية", "هاك سكوات"] },
        { title: "اليوم 4 — Push خفيف/ضخ دم", exercises: ["ضغط دمبل", "جانبي", "ترايسبس كابل"] },
        { title: "اليوم 5 — Pull خفيف/ضخ دم", exercises: ["سحب علوي", "T-Bar", "بايسبس دمبل"] },
      ],
    },
    advanced: {
      6: [
        { title: "صدر", exercises: ["بنچ بار", "مائل دمبل", "تفتيح", "كابل كروس"] },
        { title: "ظهر", exercises: ["ددلفت", "بار رو", "سحب علوي", "سحب ضيق"] },
        { title: "أرجل (كواد)", exercises: ["سكوات أمامي", "هاك سكوات", "اكستنشن"] },
        { title: "أكتاف", exercises: ["كتف بار", "جانبي", "فيس بول"] },
        { title: "أرجل (هامسترينغ)", exercises: ["رومانيان ديدلفت", "كورل", "لانجز"] },
        { title: "ذراع/كور", exercises: ["بايسبس بار/دمبل", "ترايسبس", "كور"] },
      ],
    },
  };

  const key = level as keyof typeof templates;
  const daysKey = String(days) as keyof typeof templates[typeof key];
  const plan = (templates as any)[key]?.[days] || templates.beginner[3];

  const notes = goal === "cut"
    ? "ركّز على عجز حراري صغير 10–20%، ونفّذ كارديو 2–3 مرّات أسبوعياً."
    : goal === "bulk"
      ? "زد السعرات 5–15% مع تقدّم تدريجي في الأوزان (Progressive Overload)."
      : "حافظ على سعرات الصيانة، وركّز على التقنية وجودة الحركة.";

  return { plan, notes };
}

function aiCoachAdvice(inputs) {
  // مساعد ذكي مبسّط يعمل محلياً دون إنترنت
  const tips[] = [];
  const { goal, sleep, proteinG, tdee, caloriesTarget, experience, injuries } = inputs;

  if (sleep && sleep < 7) tips.push("حاول تنام 7–9 ساعات: النمو يحدث أثناء النوم.");
  if (goal === "cut" && caloriesTarget > tdee * 0.95) tips.push("للتنشيف: اجعل العجز 10–20% من TDEE لتخس بسرعة صحية.");
  if (goal === "bulk" && caloriesTarget < tdee * 1.05) tips.push("لزيادة الكتلة: زد السعرات 5–15% فوق TDEE.");
  if (proteinG && proteinG < 1.6 * (inputs.weight || 70)) tips.push("ارفع البروتين إلى ~2 غ/كغ وزن لحماية العضلات.");
  if (experience === "beginner") tips.push("ابدأ بتكرارات 6–12 و3–4 مجموعات، وركّز على التكنيك.");
  if (injuries?.trim()) tips.push("استشر مختص وأعدّل التمارين لتجنّب الألم.");
  if (!tips.length) tips.push("استمر! حمّل تدريجي، وثبّت نظامك 8–12 أسبوعاً ثم قيّم النتائج.");
  return tips;
}

// -------------------------------------------------------
// الواجهة
// -------------------------------------------------------

export default function GymProAI() {
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(20);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("recomp");
  const [days, setDays] = useState(4);
  const [experience, setExperience] = useState("beginner");
  const [sleep, setSleep] = useState(7);
  const [injuries, setInjuries] = useState("");

  const bmr = useMemo(() => Math.round(mifflinStJeor({ gender, weight, height, age })), [gender, weight, height, age]);
  const baseTDEE = useMemo(() => tdee({ bmr, level: activity }), [bmr, activity]);
  const targetCalories = useMemo(() => {
    if (goal === "cut") return Math.round(baseTDEE * 0.85);
    if (goal === "bulk") return Math.round(baseTDEE * 1.10);
    return baseTDEE;
  }, [baseTDEE, goal]);
  const { proteinG, fatG, carbsG } = useMemo(() => macrosSplit(targetCalories, goal, weight), [targetCalories, goal, weight]);

  const { plan, notes } = useMemo(() => generatePlan({ days, level: experience, goal }), [days, experience, goal]);
  const tips = useMemo(() => aiCoachAdvice({ goal, sleep, proteinG, tdee: baseTDEE, caloriesTarget: targetCalories, experience, injuries, weight }), [goal, sleep, proteinG, baseTDEE, targetCalories, experience, injuries, weight]);

  const macroData = [
    { name: "بروتين", value: proteinG * 4 },
    { name: "دهون", value: fatG * 9 },
    { name: "كارب", value: carbsG * 4 },
  ];

  const progressData = [
    { week: "الأسبوع 1", kg: weight },
    { week: "الأسبوع 4", kg: goal === "cut" ? weight - 1.5 : goal === "bulk" ? weight + 1 : weight },
    { week: "الأسبوع 8", kg: goal === "cut" ? weight - 3 : goal === "bulk" ? weight + 2 : weight + 0.2 },
    { week: "الأسبوع 12", kg: goal === "cut" ? weight - 4.5 : goal === "bulk" ? weight + 3 : weight + 0.5 },
  ];

  // معرض صور تمارين (روابط مباشرة من Unsplash)
  const gallery = [
    { src: "https://images.unsplash.com/photo-1599058917212-d750089bc5a2?auto=format&fit=crop&w=1200&q=60", alt: "دمبل وتمارين قوة" },
    { src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=60", alt: "سكوات داخل الجيم" },
    { src: "https://images.unsplash.com/photo-1517963879433-6ad2b056d2a8?auto=format&fit=crop&w=1200&q=60", alt: "ددلفت" },
    { src: "https://images.unsplash.com/photo-1517838277536-f5fef32b9959?auto=format&fit=crop&w=1200&q=60", alt: "بنچ برس" },
    { src: "https://images.unsplash.com/photo-1550345195-cf1f3b27e93e?auto=format&fit=crop&w=1200&q=60", alt: "تمرين سحب ليدي" },
    { src: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=60", alt: "قَفز الحبل وتمارين كارديو" },
  ];

  // 1RM Calculator state
  const [liftWeight, setLiftWeight] = useState(80);
  const [liftReps, setLiftReps] = useState(5);
  const oneRM = useMemo(() => epley1RM({ weight: liftWeight, reps: liftReps }), [liftWeight, liftReps]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      {/* شريط علوي */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-900/60 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div initial={{ rotate: -20, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring" }}>
              <Dumbbell className="w-6 h-6" />
            </motion.div>
            <span className="font-bold">GymPro — بإشراف المدرب: محمد اليعلاوي</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm opacity-80">
            <a href="#calc" className="hover:opacity-100">حساب السعرات</a>
            <a href="#plan" className="hover:opacity-100">برنامج التمرين</a>
            <a href="#ai" className="hover:opacity-100">مساعد الذكاء الاصطناعي</a>
            <a href="#gallery" className="hover:opacity-100">صور</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              ابنِ جسمك بذكاء — خطّة شخصية
            </h1>
            <p className="mt-4 text-white/80">
              احسب سعراتك تلقائياً، احصل على تقسيم الماكروز، وأنشئ برنامج تمارين مخصص حسب هدفك ومستواك.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10"><Flame className="w-4 h-4"/>سعرات و ماكروز</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10"><Calendar className="w-4 h-4"/>خطة أسبوعية</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10"><Brain className="w-4 h-4"/>نصائح ذكية</span>
            </div>
          </motion.div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-fuchsia-600/20 via-cyan-500/10 to-violet-600/20 blur-2xl rounded-3xl"/>
            <div className="relative rounded-3xl p-6 bg-white/5 border border-white/10 shadow-2xl">
              <div className="text-sm opacity-80">المدرب المسؤول</div>
              <div className="text-2xl font-bold mt-1">محمد اليعلاوي</div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Gauge className="w-5 h-5 mx-auto"/>
                  <div className="text-xs mt-1">BMR</div>
                  <div className="font-bold">{bmr}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Flame className="w-5 h-5 mx-auto"/>
                  <div className="text-xs mt-1">TDEE</div>
                  <div className="font-bold">{baseTDEE}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Calculator className="w-5 h-5 mx-auto"/>
                  <div className="text-xs mt-1">السعرات الهدف</div>
                  <div className="font-bold">{targetCalories}</div>
                </div>
              </div>
              <div className="mt-4 text-xs opacity-70">* القيم تتغير مباشرةً حسب بياناتك بالأسفل.</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* المدخلات الأساسية */}
      <section id="calc" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="rounded-3xl p-6 bg-white/5 border border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2"><Ruler className="w-5 h-5"/> بيانات الجسم</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <div>الجنس</div>
                <select value={gender} onChange={e=>setGender(e.target.value as any)} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </label>
              <label className="space-y-1">
                <div>العمر (سنة)</div>
                <input type="number" value={age} onChange={e=>setAge(parseInt(e.target.value||"0"))} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10"/>
              </label>
              <label className="space-y-1">
                <div>الطول (سم)</div>
                <input type="number" value={height} onChange={e=>setHeight(parseInt(e.target.value||"0"))} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10"/>
              </label>
              <label className="space-y-1">
                <div>الوزن (كغ)</div>
                <input type="number" value={weight} onChange={e=>setWeight(parseFloat(e.target.value||"0"))} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10"/>
              </label>
              <label className="space-y-1 col-span-2">
                <div>النشاط اليومي</div>
                <select value={activity} onChange={e=>setActivity(e.target.value)} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                  <option value="sedentary">قليل</option>
                  <option value="light">خفيف</option>
                  <option value="moderate">متوسط</option>
                  <option value="active">نشِط</option>
                  <option value="athlete">رياضي جداً</option>
                </select>
              </label>
            </div>
          </motion.div>

          <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="rounded-3xl p-6 bg-white/5 border border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2"><Flame className="w-5 h-5"/> الهدف الغذائي</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <div>الهدف</div>
                <select value={goal} onChange={e=>setGoal(e.target.value as any)} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                  <option value="cut">تنشيف</option>
                  <option value="recomp">Recomp</option>
                  <option value="bulk">زيادة كتلة</option>
                </select>
              </label>
              <label className="space-y-1">
                <div>أيام التمرين/أسبوع</div>
                <input type="number" min={3} max={6} value={days} onChange={e=>setDays(parseInt(e.target.value||"3"))} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10"/>
              </label>
              <label className="space-y-1">
                <div>المستوى</div>
                <select value={experience} onChange={e=>setExperience(e.target.value as any)} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                  <option value="beginner">مبتدئ</option>
                  <option value="intermediate">متوسط</option>
                  <option value="advanced">متقدم</option>
                </select>
              </label>
              <label className="space-y-1">
                <div>النوم (ساعات/ليلة)</div>
                <input type="number" value={sleep} onChange={e=>setSleep(parseFloat(e.target.value||"0"))} className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10"/>
              </label>
              <label className="space-y-1 col-span-2">
                <div>إصابات/آلام (اختياري)</div>
                <input type="text" value={injuries} onChange={e=>setInjuries(e.target.value)} placeholder="مثال: ألم ركبة خفيف" className="w-full bg-black/40 rounded-xl px-3 py-2 border border-white/10"/>
              </label>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs opacity-70">السعرات الهدف</div>
                <div className="text-2xl font-bold">{targetCalories}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs opacity-70">البروتين (غ)</div>
                <div className="text-2xl font-bold">{proteinG}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs opacity-70">الكارب (غ)</div>
                <div className="text-2xl font-bold">{carbsG}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 col-span-3">
                <div className="text-xs opacity-70">الدهون (غ)</div>
                <div className="text-2xl font-bold">{fatG}</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="rounded-3xl p-6 bg-white/5 border border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5"/> توزيع السعرات (تقديري)</h2>
            <div className="h-56 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {macroData.map((_, idx) => <Cell key={idx} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="kg" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </section>

      {/* برنامج التمرين */}
      <section id="plan" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
          <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5"/> برنامجك للأسبوع</h2>
          <p className="text-white/80 text-sm mt-2">{notes}</p>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {plan.map((day, i) => (
              <motion.div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/10" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="font-bold">{day.title}</div>
                <ul className="mt-2 text-sm opacity-90 space-y-1 list-disc pr-4">
                  {day.exercises.map((ex, idx) => (
                    <li key={idx}>{ex} — 3–4 مجموعات × 6–12 تكرار</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🆕 AI Coach بعد برنامج التمرين مباشرة */}
      <section id="ai" className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
          <h2 className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5"/> مساعد الذكاء الاصطناعي (محلي)</h2>
          <p className="text-sm text-white/80 mt-1">نصائح فورية مبنية على بياناتك الحالية دون اتصال.</p>
          <div className="mt-4 grid gap-2">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 shrink-0"/>
                <p className="text-sm">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* معرض الصور */}
      <section id="gallery" className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
          <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5"/> معرض التمارين</h2>
          <p className="text-sm text-white/80 mt-1">صور عالية الجودة من Unsplash تُلهمك داخل الجيم.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((img, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-56 object-cover hover:scale-105 transition duration-500" />
                <div className="p-3 text-xs opacity-80">{img.alt}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-xs text-white/60">
        صنع بحب 💪 — بإشراف <span className="font-semibold">محمد اليعلاوي</span> . 0669273522 هذا المحتوى تعليمي لتواصل مع لكوتش.
      </footer>
    </div>
  );
}