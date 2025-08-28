import { createSupabaseServerClient } from "./supabase-server"

export class CacheManager {
  /**
   * Generate a deterministic cache key
   */
  private generateCacheKey(
    inputData: any,
    service: string,
    endpoint: string
  ): string {
    // Sort object keys for consistent hashing
    const sortedInput = JSON.stringify(inputData, Object.keys(inputData).sort())
    const keyString = `${service}:${endpoint}:${sortedInput}`
    
    // Create a simple hash
    let hash = 0
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    return `${service}_${endpoint}_${Math.abs(hash)}`
  }

  /**
   * Get cached response if available and not expired
   */
  async getCachedResponse(
    inputData: any,
    serviceType: string,
    endpointType: string
  ): Promise<any | null> {
    try {
      const supabase = await createSupabaseServerClient()
      const cacheKey = this.generateCacheKey(inputData, serviceType, endpointType)

      const { data: cached, error } = await supabase
        .from("api_cache")
        .select("api_response, hit_count")
        .eq("cache_key", cacheKey)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (error || !cached) {
        return null
      }

      // Update hit count and last accessed time
      await supabase
        .from("api_cache")
        .update({
          hit_count: (cached.hit_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("cache_key", cacheKey)

      console.log(`🎯 Cache HIT: ${serviceType}/${endpointType} (saved API call)`)
      return cached.api_response
    } catch (error) {
      console.error("Cache retrieval error:", error)
      return null
    }
  }

  /**
   * Store response in cache
   */
  async setCachedResponse(
    inputData: any,
    serviceType: string,
    endpointType: string,
    apiResponse: any
  ): Promise<void> {
    try {
      const supabase = await createSupabaseServerClient()
      const cacheKey = this.generateCacheKey(inputData, serviceType, endpointType)
      
      // Set expiration to 90 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      const { error } = await supabase.from("api_cache").upsert({
        cache_key: cacheKey,
        service_type: serviceType,
        endpoint_type: endpointType,
        input_data: inputData,
        api_response: apiResponse,
        expires_at: expiresAt.toISOString(),
        hit_count: 0,
        created_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Cache storage error:", error)
      } else {
        console.log(`💾 Cache STORED: ${serviceType}/${endpointType}`)
      }
    } catch (error) {
      console.error("Cache storage error:", error)
    }
  }

  /**
   * Clear expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const supabase = await createSupabaseServerClient()
      
      const { error } = await supabase
        .from("api_cache")
        .delete()
        .lt("expires_at", new Date().toISOString())

      if (error) {
        console.error("Cache cleanup error:", error)
      } else {
        console.log("🧹 Expired cache entries cleaned")
      }
    } catch (error) {
      console.error("Cache cleanup error:", error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number
    totalHits: number
    avgHitRate: number
    sizeEstimate: string
  } | null> {
    try {
      const supabase = await createSupabaseServerClient()
      
      const { data, error } = await supabase
        .from("api_cache")
        .select("hit_count")

      if (error || !data) {
        return null
      }

      const totalEntries = data.length
      const totalHits = data.reduce((sum, item) => sum + (item.hit_count || 0), 0)
      const avgHitRate = totalEntries > 0 ? totalHits / totalEntries : 0

      return {
        totalEntries,
        totalHits,
        avgHitRate: Math.round(avgHitRate * 100) / 100,
        sizeEstimate: `${Math.round(totalEntries * 5)}KB`, // Rough estimate
      }
    } catch (error) {
      console.error("Cache stats error:", error)
      return null
    }
  }
}