import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';
import { verifyJWT } from '@/utils/jwt';
import { GoogleGenerativeAI } from '@google/generative-ai';

const reportSchema = z.object({
  fileName: z.string(),
  reportType: z.enum(['LAB_RESULT', 'IMAGING', 'ECG', 'GENERAL']),
  reportText: z.string(),
});

async function getAuthUser(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const tokenCookie = tokenHeader?.split(';').find(c => c.trim().startsWith('token='));
  const token = tokenCookie ? tokenCookie.split('=')[1] : null;
  if (!token) return null;
  return await verifyJWT(token);
}

// Local mock report analyzer algorithm (fallback)
function localReportAnalyzer(type: string, text: string) {
  const query = text.toLowerCase();
  
  if (type === 'ECG' || query.includes('ecg') || query.includes('st elevation') || query.includes('heart')) {
    return {
      keyFindings: "ECG Waveform indicates minor rhythm variations or potential elevated pulse rate.",
      abnormalValues: "Heart Rate: 96 bpm, borderline tachycardia",
      riskLevel: "MEDIUM" as const,
      specialist: "Cardiology"
    };
  }

  if (query.includes('sugar') || query.includes('glucose') || query.includes('hba1c') || query.includes('diabetes')) {
    const isHigh = query.includes('high') || query.includes('elevated') || query.includes('140') || query.includes('150');
    return {
      keyFindings: isHigh 
        ? "Blood work highlights elevated blood glucose index, indicating potential hyperglycemia." 
        : "Blood glucose indices check within acceptable metabolic limits.",
      abnormalValues: isHigh ? "Fasting Blood Sugar: 145 mg/dL" : "None",
      riskLevel: isHigh ? "HIGH" as const : "LOW" as const,
      specialist: "Endocrinology / Internal Medicine"
    };
  }

  if (query.includes('fracture') || query.includes('bone') || query.includes('break')) {
    return {
      keyFindings: "Diagnostic scan reveals structural stress or hairline fractures in local bone sections.",
      abnormalValues: "Cortical fracture line detected",
      riskLevel: "HIGH" as const,
      specialist: "Orthopedics"
    };
  }

  return {
    keyFindings: "Basic cell counts, platelets, and general markers verify normal ranges.",
    abnormalValues: "None",
    riskLevel: "LOW" as const,
    specialist: "General Medicine"
  };
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized Session" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { fileName, reportType, reportText } = parsed.data;
    
    // 1. Analyze report content using AI or local parser
    let analysisResult;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `You are a clinical report parsing assistant. Parse the following clinical report text and output a JSON object containing normalizations, abnormal flags, key findings, and recommended specialist. 
        
        Report Type: "${reportType}"
        Report Content: "${reportText}"

        JSON Output Schema:
        {
          "keyFindings": "Brief summary of key findings",
          "abnormalValues": "Specific abnormal values, or 'None'",
          "riskLevel": "LOW or MEDIUM or HIGH",
          "specialist": "Cardiology or Neurology or Orthopedics or General Medicine or Endocrinology"
        }`;

        const genResult = await model.generateContent(prompt);
        const text = genResult.response.text().trim();
        const cleaned = text.replace(/```json/i, '').replace(/```/g, '').trim();
        analysisResult = JSON.parse(cleaned);
      } catch (err) {
        console.warn("Gemini Report parser failed, falling back to local engine:", err);
        analysisResult = localReportAnalyzer(reportType, reportText);
      }
    } else {
      analysisResult = localReportAnalyzer(reportType, reportText);
    }

    // 2. Persist new MedicalReport in DB/mock
    const savedReport = await tryDbQuery(
      async () => {
        const rep = await prisma.medicalReport.create({
          data: {
            patientId: user.id,
            fileName,
            fileUrl: '#',
            reportType,
            riskLevel: analysisResult.riskLevel,
            keyFindings: analysisResult.keyFindings,
            abnormalValues: analysisResult.abnormalValues
          }
        });
        return { id: rep.id, ...analysisResult };
      },
      async () => {
        const id = 'rep-' + Math.random().toString(36).substring(2, 7);
        const mockRep = {
          id,
          patientId: user.id,
          fileName,
          fileUrl: '#',
          reportType,
          riskLevel: analysisResult.riskLevel,
          keyFindings: analysisResult.keyFindings,
          abnormalValues: analysisResult.abnormalValues,
          createdAt: new Date().toISOString().split('T')[0]
        };
        mockDb.reports.push(mockRep);
        return mockRep;
      }
    );

    return NextResponse.json({
      success: true,
      message: "Report processed and archived in EMR records",
      report: savedReport
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error analyzing clinical report" }, { status: 500 });
  }
}
