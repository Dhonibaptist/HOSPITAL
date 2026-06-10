import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Local Dictionary-Based Symptom Fallback Engine (when no Gemini Key is supplied)
function fallbackSymptomChecker(symptomText: string) {
  const query = symptomText.toLowerCase();
  
  if (query.includes('chest pain') || query.includes('heart') || query.includes('palpitations')) {
    return {
      condition: "Potential Cardiovascular Anomaly (e.g. Arrhythmia or Angina)",
      urgency: "HIGH - Request Emergency Evaluation",
      specialist: "Cardiology / Emergency Care",
      advice: [
        "Avoid any physical exertion immediately",
        "If pain radiates to jaw or left arm, call emergency immediately",
        "Sit upright in a well-ventilated room"
      ]
    };
  }
  
  if (query.includes('headache') || query.includes('dizziness') || query.includes('migraine') || query.includes('numbness')) {
    return {
      condition: "Migraine Cephalgia or Neurological Tension",
      urgency: "Medium - Scheduled Consultation",
      specialist: "Neurology / Internal Medicine",
      advice: [
        "Rest in a darkened, quiet room",
        "Maintain adequate hydration",
        "Track frequency, severity, and sleep durations"
      ]
    };
  }

  if (query.includes('depressed') || query.includes('anxiety') || query.includes('stress') || query.includes('sad')) {
    return {
      condition: "Mood Regulation Disorder or High Tension State",
      urgency: "Medium - Mental Health Support",
      specialist: "Psychiatry / Clinical Therapy",
      advice: [
        "Practice deep diaphragmatic breathing exercise",
        "Discuss symptoms with close family or counselors",
        "Schedule structured therapy appointments"
      ]
    };
  }

  if (query.includes('bone') || query.includes('fracture') || query.includes('joint') || query.includes('knee')) {
    return {
      condition: "Joint Inflammation (Arthralgia) or Skeletal Strain",
      urgency: "Medium - Orthopedic Evaluation",
      specialist: "Orthopedics",
      advice: [
        "Apply cold compress if joints are swollen",
        "Elevate affected limbs and limit pressure load",
        "Avoid high-impact workouts"
      ]
    };
  }

  // Default Standard Fallback (Cough, Cold, Flu symptoms)
  return {
    condition: "Acute Viral Syndrome (Common Cold / Nasopharyngitis)",
    urgency: "Low - Standard Checkup",
    specialist: "General Medicine / Internal Medicine",
    advice: [
      "Keep body temperature monitored under 101°F",
      "Stay hydrated with warm broths or water",
      "Take standard over-the-counter anti-fever medications"
    ]
  };
}

export async function POST(request: Request) {
  try {
    const { symptoms } = await request.json();

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Symptoms description is empty" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Execute local parsing engine
      const response = fallbackSymptomChecker(symptoms);
      return NextResponse.json({
        success: true,
        source: 'local_engine',
        result: response
      });
    }

    // Connect with Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional clinical triage AI. Analyze the following patient symptoms and return a JSON object (strictly matching the schema below without markdown formatting or wrapping code ticks). 
    
    Symptoms: "${symptoms}"

    JSON Output Schema:
    {
      "condition": "Brief name of likely condition",
      "urgency": "Low / Medium / High",
      "specialist": "Recommended doctor specialty (e.g. Cardiology, Neurology, Orthopedics, General Medicine)",
      "advice": ["Step 1", "Step 2", "Step 3"]
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Parse response
    let jsonResult;
    try {
      // Clean up markdown ticks if Gemini included them
      const cleaned = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
      jsonResult = JSON.parse(cleaned);
    } catch (parseError) {
      console.warn("Error parsing Gemini JSON, falling back to regex match:", responseText);
      jsonResult = fallbackSymptomChecker(symptoms);
    }

    return NextResponse.json({
      success: true,
      source: 'gemini_api',
      result: jsonResult
    });

  } catch (error) {
    console.error("Gemini API error:", error);
    // Graceful fallback to prevent screen crashes
    const response = fallbackSymptomChecker("");
    return NextResponse.json({
      success: true,
      source: 'fallback_error_recovery',
      result: response
    });
  }
}
