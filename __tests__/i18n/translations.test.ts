import frMessages from "@/messages/fr.json"
import enMessages from "@/messages/en.json"

describe("Translations", () => {
  describe("French translations", () => {
    it("contains required common keys", () => {
      expect(frMessages.common).toBeDefined()
      expect(frMessages.common.loading).toBe("Chargement...")
      expect(frMessages.common.save).toBe("Enregistrer")
      expect(frMessages.common.cancel).toBe("Annuler")
      expect(frMessages.common.language).toBe("Langue")
    })

    it("contains auth keys", () => {
      expect(frMessages.auth).toBeDefined()
      expect(frMessages.auth.login).toBe("Connexion")
      expect(frMessages.auth.email).toBe("Adresse email")
      expect(frMessages.auth.password).toBe("Mot de passe")
      expect(frMessages.auth.loginButton).toBe("Se connecter")
    })

    it("contains dashboard keys", () => {
      expect(frMessages.dashboard).toBeDefined()
      expect(frMessages.dashboard.title).toBe("Tableau de bord")
    })

    it("contains profile keys", () => {
      expect(frMessages.profile).toBeDefined()
      expect(frMessages.profile.title).toBe("Mon profil")
      expect(frMessages.profile.language).toBe("Langue préférée")
    })
  })

  describe("English translations", () => {
    it("contains required common keys", () => {
      expect(enMessages.common).toBeDefined()
      expect(enMessages.common.loading).toBe("Loading...")
      expect(enMessages.common.save).toBe("Save")
      expect(enMessages.common.cancel).toBe("Cancel")
      expect(enMessages.common.language).toBe("Language")
    })

    it("contains auth keys", () => {
      expect(enMessages.auth).toBeDefined()
      expect(enMessages.auth.login).toBe("Login")
      expect(enMessages.auth.email).toBe("Email address")
      expect(enMessages.auth.password).toBe("Password")
      expect(enMessages.auth.loginButton).toBe("Sign in")
    })

    it("contains dashboard keys", () => {
      expect(enMessages.dashboard).toBeDefined()
      expect(enMessages.dashboard.title).toBe("Dashboard")
    })

    it("contains profile keys", () => {
      expect(enMessages.profile).toBeDefined()
      expect(enMessages.profile.title).toBe("My Profile")
      expect(enMessages.profile.language).toBe("Preferred Language")
    })
  })

  describe("Translation consistency", () => {
    function getNestedKeys(obj: any, prefix = ""): string[] {
      return Object.keys(obj).reduce((keys: string[], key: string) => {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === "object" && obj[key] !== null) {
          return keys.concat(getNestedKeys(obj[key], fullKey))
        }
        return keys.concat(fullKey)
      }, [])
    }

    it("has same keys in both languages", () => {
      const frKeys = getNestedKeys(frMessages).sort()
      const enKeys = getNestedKeys(enMessages).sort()

      expect(frKeys).toEqual(enKeys)
    })

    it("has no empty translation values in French", () => {
      const checkEmptyValues = (obj: any, path = ""): string[] => {
        const emptyKeys: string[] = []

        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key

          if (typeof value === "object" && value !== null) {
            emptyKeys.push(...checkEmptyValues(value, currentPath))
          } else if (typeof value === "string" && value.trim() === "") {
            emptyKeys.push(currentPath)
          }
        }

        return emptyKeys
      }

      const emptyKeys = checkEmptyValues(frMessages)
      expect(emptyKeys).toEqual([])
    })

    it("has no empty translation values in English", () => {
      const checkEmptyValues = (obj: any, path = ""): string[] => {
        const emptyKeys: string[] = []

        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key

          if (typeof value === "object" && value !== null) {
            emptyKeys.push(...checkEmptyValues(value, currentPath))
          } else if (typeof value === "string" && value.trim() === "") {
            emptyKeys.push(currentPath)
          }
        }

        return emptyKeys
      }

      const emptyKeys = checkEmptyValues(enMessages)
      expect(emptyKeys).toEqual([])
    })
  })
})
