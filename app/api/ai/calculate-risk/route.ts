import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';
import { verifyJWT } from '@/utils/jwt';
import { GoogleGenerativeAI } from '@google/generative-ai';

const riskInputSchema = z.object({
  bloodSugar: z.number().min(50).max(400),
  systolicBP: z.number().min(80).max(220),
  exerciseHoursPerWeek: z.number().min(0).max(40),
  smoking: z.boolean(),
});

async function getAuthUser(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const tokenCookie = tokenHeader?.split(';').find(c => c.trim().startsWith('token='));
  const token = tokenCookie ? tokenCookie.split('=')[1] : null;
  if (!token) return null;
  return await verifyJWT(token);
}

// Local mathematical algorithm for health risk index
function localRiskCalculator(bloodSugar: number, systolicBP: number, exercise: number, smoking: boolean) {
  // 1. Heart Risk calculation
  let heartRisk = 10;
  if (systolicBP > 120) heartRisk += (systolicBP - 120) * 1.5;
  if (smoking) heartRisk += 30;
  heartRisk -= exercise * 2;
  heartRisk = Math.min(95, Math.max(5, Math.round(heartRisk)));

  // 2. Diabetes Risk calculation
  let diabetesRisk = 10;
  if (bloodSugar > 100) diabetesRisk += (bloodSugar - 100) * 0.8;
  diabetesRisk -= exercise * 1.5;
  if (smoking) diabetesRisk += 10;
  diabetesRisk = Math.min(95, Math.max(5, Math.round(diabetesRisk)));

  // 3. BMI Risk calculation (estimated)
  let bmiRisk = 12;
  if (exercise < 3) bmiRisk += 15;
  if (bloodSugar > 120) bmiRisk += 10;
  bmiRisk = Math.min(95, Math.max(5, Math.round(bmiRisk)));

  // 4. Lifestyle Score
  let lifestyleScore = 80;
  lifestyleScore += exercise * 4;
  if (smoking) lifestyleScore -= 25;
  if (systolicBP > 130) lifestyleScore -= 8;
  if (bloodSugar > 110) lifestyleScore -= 8;
  lifestyleScore = Math.min(100, Math.max(10, Math.round(lifestyleScore)));

  return { heartRisk, diabetesRisk, bmiRisk, lifestyleScore };
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized Session" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = riskInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { bloodSugar, systolicBP, exerciseHoursPerWeek, smoking } = parsed.data;

    let riskScores;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a clinical cardiovascular risk calculator. Analyze the following health metrics and return risk probability percentages (0 to 100) and general lifestyle score (0 to 100) in strict JSON format. Do not add markdown or headers.

        Metrics:
        - Fasting Blood Sugar: ${bloodSugar} mg/dL
        - Systolic Blood Pressure: ${systolicBP} mmHg
        - Exercise: ${exerciseHoursPerWeek} hours/week
        - Smoking Status: ${smoking ? 'Smoker' : 'Non-Smoker'}

        JSON Schema:
        {
          "heartRisk": Integer,
          "diabetesRisk": Integer,
          "bmiRisk": Integer,
          "lifestyleScore": Integer
        }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json/i, '').replace(/```/g, '').trim();
        riskScores = JSON.parse(cleaned);
      } catch (err) {
        console.warn("Gemini Risk assessor failed, falling back to local formulas:", err);
        riskScores = localRiskCalculator(bloodSugar, systolicBP, exerciseHoursPerWeek, smoking);
      }
    } else {
      riskScores = localRiskCalculator(bloodSugar, systolicBP, exerciseHoursPerWeek, smoking);
    }

    // Persist scores in Prisma / mockDb
    const savedProfile = await tryDbQuery(
      async () => {
        const profile = await prisma.healthProfile.upsert({
          where: { patientId: user.id },
          update: {
            bloodSugar,
            systolicBP,
            exerciseHoursPerWeek,
            smoking,
            ...riskScores
          },
          create: {
            patientId: user.id,
            bloodSugar,
            systolicBP,
            exerciseHoursPerWeek,
            smoking,
            ...riskScores
          }
        });
        return profile;
      },
      async () => {
        const existingIdx = mockDb.healthProfiles.findIndex(p => p.patientId === user.id);
        const profileData = {
          id: 'hp-' + Math.random().toString(36).substring(2, 7),
          patientId: user.id,
          bloodSugar,
          systolicBP,
          exerciseHoursPerWeek,
          smoking,
          ...riskScores
        };

        if (existingIdx > -1) {
          mockDb.healthProfiles[existingIdx] = profileData;
        } else {
          mockDb.healthProfiles.push(profileData);
        }
        return profileData;
      }
    );

    return NextResponse.json({
      success: true,
      message: "Health Risk Scores successfully compiled!",
      profile: savedProfile
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error compiling health risks profile" }, { status: 500 });
  }
}
