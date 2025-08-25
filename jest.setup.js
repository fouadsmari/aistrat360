import "@testing-library/jest-dom"

// Add missing browser APIs
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (namespace) => (key) => `${namespace}.${key}`,
  useLocale: () => "fr",
  useParams: () => ({ locale: "fr" }),
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ locale: "fr" }),
  usePathname: () => "/fr/dashboard",
}))

// Don't mock Supabase here - mock it in individual test files

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
  }),
}))
