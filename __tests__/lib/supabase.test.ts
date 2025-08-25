import { supabase, supabaseAdmin } from "@/lib/supabase"

// Mock the actual Supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      insert: jest.fn(),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}))

describe("Supabase Configuration", () => {
  it("exports supabase client", () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(supabase.from).toBeDefined()
  })

  it("exports supabaseAdmin client", () => {
    expect(supabaseAdmin).toBeDefined()
    expect(supabaseAdmin.from).toBeDefined()
  })

  it("supabase client has auth methods", () => {
    expect(typeof supabase.auth.signInWithPassword).toBe("function")
    expect(typeof supabase.auth.getUser).toBe("function")
    expect(typeof supabase.auth.signOut).toBe("function")
  })

  it("supabase client has database methods", () => {
    const table = supabase.from("test")
    expect(typeof table.select).toBe("function")
    expect(typeof table.update).toBe("function")
    expect(typeof table.insert).toBe("function")
    expect(typeof table.delete).toBe("function")
  })

  it("supabaseAdmin client has database methods", () => {
    const adminTable = supabaseAdmin.from("test")
    expect(typeof adminTable.select).toBe("function")
  })
})
