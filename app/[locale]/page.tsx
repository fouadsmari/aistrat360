import { redirect } from "next/navigation"

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Redirect to login page for this locale
  redirect(`/${locale}/login`)
}
