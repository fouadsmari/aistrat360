import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import * as XLSX from "xlsx"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("google_ads_campaigns")
      .select(
        `
        *,
        user_websites (
          name,
          url,
          business_type
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Determine campaign type
    const campaignType = campaign.recommended_type || campaign.campaign_type
    const websiteName =
      campaign.user_websites?.name || campaign.user_websites?.url || "Website"

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // 1. Campaigns Sheet
    const campaignsData = [
      {
        Campaign: campaign.campaign_name,
        "Campaign Type": campaignType === "pmax" ? "Performance Max" : "Search",
        "Campaign Status": "Enabled",
        "Campaign Daily Budget": campaign.budget_recommendation || 50.0,
        Networks:
          campaignType === "search"
            ? "Google search;Search partners"
            : "All networks",
        Languages: Array.isArray(campaign.target_languages)
          ? campaign.target_languages.join(";")
          : "French",
        Locations: Array.isArray(campaign.target_locations)
          ? campaign.target_locations.join(";")
          : "France",
        "Bid Strategy Type": campaign.bid_strategy || "Maximize conversions",
        "Start Date": new Date().toISOString().split("T")[0],
        "Campaign Goal": "Sales",
        "Target CPA": campaign.target_cpa || "",
        "Target ROAS": campaign.target_roas || "",
      },
    ]
    const campaignsSheet = XLSX.utils.json_to_sheet(campaignsData)
    XLSX.utils.book_append_sheet(workbook, campaignsSheet, "Campaigns")

    // 2. Ad Groups Sheet (only for Search campaigns)
    if (campaignType === "search") {
      const adGroupsData = [
        {
          Campaign: campaign.campaign_name,
          "Ad Group": `${websiteName}_AdGroup_1`,
          "Ad Group Type": "Standard",
          "Ad Group Status": "Enabled",
          "Max CPC": "",
          "Target CPA": campaign.target_cpa || "",
          "Targeting Method": "Keywords",
        },
      ]
      const adGroupsSheet = XLSX.utils.json_to_sheet(adGroupsData)
      XLSX.utils.book_append_sheet(workbook, adGroupsSheet, "Ad Groups")

      // 3. Keywords Sheet (only for Search campaigns)
      const keywordsData = campaign.keywords.map((keyword: any) => ({
        Campaign: campaign.campaign_name,
        "Ad Group": `${websiteName}_AdGroup_1`,
        Keyword: keyword.keyword,
        "Match Type":
          keyword.searchVolume > 10000
            ? "Phrase"
            : keyword.searchVolume > 1000
              ? "Broad"
              : "Exact",
        "Max CPC": (keyword.cpc * 0.8).toFixed(2), // 20% below estimated CPC
        Status: "Enabled",
        "Final URL": campaign.page_url,
        "Monthly Volume": keyword.searchVolume,
        Competition: keyword.competition,
        "Suggested Bid": keyword.cpc.toFixed(2),
      }))
      const keywordsSheet = XLSX.utils.json_to_sheet(keywordsData)
      XLSX.utils.book_append_sheet(workbook, keywordsSheet, "Keywords")
    }

    // 4. Responsive Search Ads Sheet
    const headlines = Array.isArray(campaign.headlines)
      ? campaign.headlines
      : []
    const descriptions = Array.isArray(campaign.descriptions)
      ? campaign.descriptions
      : []

    const rsaData = [
      {
        Campaign: campaign.campaign_name,
        "Ad Group":
          campaignType === "search"
            ? `${websiteName}_AdGroup_1`
            : `${websiteName}_AssetGroup_1`,
        Status: "Enabled",
        "Headline 1": headlines[0] || "",
        "Headline 2": headlines[1] || "",
        "Headline 3": headlines[2] || "",
        "Headline 4": headlines[3] || "",
        "Headline 5": headlines[4] || "",
        "Headline 6": headlines[5] || "",
        "Headline 7": headlines[6] || "",
        "Headline 8": headlines[7] || "",
        "Headline 9": headlines[8] || "",
        "Headline 10": headlines[9] || "",
        "Headline 11": headlines[10] || "",
        "Headline 12": headlines[11] || "",
        "Headline 13": headlines[12] || "",
        "Headline 14": headlines[13] || "",
        "Headline 15": headlines[14] || "",
        "Description 1": descriptions[0] || "",
        "Description 2": descriptions[1] || "",
        "Description 3": descriptions[2] || "",
        "Description 4": descriptions[3] || "",
        "Final URL": campaign.page_url,
        "Display URL Path 1": "ads",
        "Display URL Path 2": "landing",
      },
    ]
    const rsaSheet = XLSX.utils.json_to_sheet(rsaData)
    XLSX.utils.book_append_sheet(workbook, rsaSheet, "Responsive Search Ads")

    // 5. Performance Max Assets (if PMax campaign)
    if (campaignType === "pmax") {
      const assetGroupsData = [
        {
          Campaign: campaign.campaign_name,
          "Asset Group Name": `${websiteName}_AssetGroup_1`,
          Status: "Enabled",
          "Final URL": campaign.page_url,
        },
      ]
      const assetGroupsSheet = XLSX.utils.json_to_sheet(assetGroupsData)
      XLSX.utils.book_append_sheet(
        workbook,
        assetGroupsSheet,
        "PMax Asset Groups"
      )

      const textAssetsData = [
        ...headlines.map((headline: string, index: number) => ({
          Campaign: campaign.campaign_name,
          "Asset Group": `${websiteName}_AssetGroup_1`,
          "Asset Type": "Headline",
          "Asset Text": headline,
          "Performance Label": index < 3 ? "Primary" : "",
        })),
        ...descriptions.map((description: string) => ({
          Campaign: campaign.campaign_name,
          "Asset Group": `${websiteName}_AssetGroup_1`,
          "Asset Type": "Description",
          "Asset Text": description,
          "Performance Label": "Primary",
        })),
      ]
      const textAssetsSheet = XLSX.utils.json_to_sheet(textAssetsData)
      XLSX.utils.book_append_sheet(
        workbook,
        textAssetsSheet,
        "PMax Text Assets"
      )
    }

    // 6. Campaign Info Sheet
    const personas = Array.isArray(campaign.personas) ? campaign.personas : []
    const campaignInfoData = [
      { Field: "Campaign Name", Value: campaign.campaign_name },
      {
        Field: "Campaign Type",
        Value: campaignType === "pmax" ? "Performance Max" : "Search",
      },
      {
        Field: "Generated Date",
        Value: new Date().toISOString().split("T")[0],
      },
      { Field: "Page URL", Value: campaign.page_url },
      { Field: "Page Title", Value: campaign.page_title || "" },
      { Field: "Total Keywords", Value: campaign.keywords.length },
      {
        Field: "Recommended Budget",
        Value: `€${campaign.budget_recommendation || 50}`,
      },
      {
        Field: "Target Locations",
        Value: Array.isArray(campaign.target_locations)
          ? campaign.target_locations.join(", ")
          : "France",
      },
      {
        Field: "Target Languages",
        Value: Array.isArray(campaign.target_languages)
          ? campaign.target_languages.join(", ")
          : "French",
      },
      {
        Field: "Bid Strategy",
        Value: campaign.bid_strategy || "Maximize conversions",
      },
      {
        Field: "Target CPA",
        Value: campaign.target_cpa ? `€${campaign.target_cpa}` : "",
      },
      {
        Field: "Target ROAS",
        Value: campaign.target_roas ? `${campaign.target_roas}%` : "",
      },
      { Field: "", Value: "" }, // Separator
      { Field: "TARGET PERSONAS", Value: "" },
      ...personas.flatMap((persona: any, index: number) => [
        { Field: `Persona ${index + 1} Name`, Value: persona.name || "" },
        { Field: `Persona ${index + 1} Age`, Value: persona.age_range || "" },
        { Field: `Persona ${index + 1} Gender`, Value: persona.gender || "" },
        {
          Field: `Persona ${index + 1} Interests`,
          Value: Array.isArray(persona.interests)
            ? persona.interests.join(", ")
            : "",
        },
        {
          Field: `Persona ${index + 1} Behavior`,
          Value: persona.behavior || "",
        },
        {
          Field: `Persona ${index + 1} Pain Points`,
          Value: Array.isArray(persona.pain_points)
            ? persona.pain_points.join(", ")
            : "",
        },
        { Field: "", Value: "" }, // Separator
      ]),
    ]
    const campaignInfoSheet = XLSX.utils.json_to_sheet(campaignInfoData)
    XLSX.utils.book_append_sheet(workbook, campaignInfoSheet, "Campaign Info")

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    })

    // Update export timestamp
    await supabase
      .from("google_ads_campaigns")
      .update({
        status: "exported",
        exported_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    // Return Excel file
    const fileName = `GoogleAds_${campaign.campaign_name}_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Excel export error:", error)
    return NextResponse.json(
      {
        error: "Failed to export campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
