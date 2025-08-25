import NextLink from "next/link"
import { useLocale } from "next-intl"
import { ComponentProps } from "react"

type LinkProps = ComponentProps<typeof NextLink>

export function Link({ href, ...rest }: LinkProps) {
  const locale = useLocale()

  return <NextLink href={`/${locale}${href === "/" ? "" : href}`} {...rest} />
}
