import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteUrl, budget, objective } = body

    console.log(`🧪 Testing analysis for: ${websiteUrl}, Budget: ${budget}, Objective: ${objective}`)

    // Create a test analysis with mock data
    const supabase = await createSupabaseServerClient()
    
    const mockResults = {
      websiteAnalysis: {
        domain: new URL(websiteUrl).hostname,
        detectedLanguage: "fr",
        targetCountry: "FR", 
        industry: "service-professionnel",
        businessType: "b2c",
        suggestedKeywords: [
          "service professionnel",
          "devis gratuit", 
          "consultant expert",
          "solution sur mesure",
          "accompagnement personnalisé"
        ],
        websiteQuality: 85,
        competitiveness: "medium",
        businessModel: "service",
        targetAudience: "entreprises et particuliers"
      },
      roiPrediction: {
        estimatedClicks: Math.floor(budget / 2.5),
        estimatedCost: Math.floor(budget * 0.85),
        estimatedLeads: Math.floor(budget / 25),
        estimatedConversions: Math.floor(budget / 100),
        roiPercentage: Math.floor(Math.random() * 100) + 120, // 120-220%
        breakEvenDays: Math.floor(Math.random() * 60) + 30, // 30-90 days
        confidence: "medium"
      },
      recommendedKeywords: [
        { keyword: "service professionnel", searchVolume: 1200, cpc: 2.40, difficulty: 0.6 },
        { keyword: "devis gratuit", searchVolume: 800, cpc: 1.80, difficulty: 0.4 },
        { keyword: "consultant expert", searchVolume: 600, cpc: 3.20, difficulty: 0.7 },
        { keyword: "solution sur mesure", searchVolume: 400, cpc: 2.90, difficulty: 0.5 }
      ],
      negativeKeywords: [
        "gratuit", "free", "emploi", "stage", "formation", "tutoriel", 
        "diy", "faire soi même", "pas cher", "discount"
      ],
      budgetAllocation: {
        keywords: 70,
        remarketing: 15, 
        display: 10,
        reserve: 5
      },
      monthlyProjection: {
        month1: { 
          clicks: Math.floor(budget / 3.5), 
          cost: Math.floor(budget * 0.9), 
          leads: Math.floor(budget / 35) 
        },
        month2: { 
          clicks: Math.floor(budget / 2.8), 
          cost: Math.floor(budget * 0.95), 
          leads: Math.floor(budget / 28) 
        },
        month3: { 
          clicks: Math.floor(budget / 2.5), 
          cost: Math.floor(budget * 0.85), 
          leads: Math.floor(budget / 25) 
        }
      },
      recommendations: [
        `💡 Budget ${budget}€ optimal pour tester 5-8 mots-clés spécifiques`,
        `🎯 Objectif ${objective}: Créez une landing page dédiée pour maximiser les conversions`,
        "📊 Marché modérément compétitif: Testez d'abord les mots-clés longue traîne",
        "🚀 ROI prédit positif: Lancez une campagne test sur 30 jours"
      ]
    }

    // Create analysis record
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: analysis, error } = await supabase
      .from("profitability_analyses")
      .insert({
        user_id: user.id,
        analysis_type: "profitability_prediction", 
        input_data: { websiteUrl, budget, objective },
        result_data: mockResults,
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        credits_used: 1
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating test analysis:", error)
      return NextResponse.json({ error: "Failed to create analysis" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Test analysis completed instantly"
    })

  } catch (error) {
    console.error("Test analysis error:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}