import "./globals.css"
import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: '格式译专家 - 专业文档翻译平台',
  description: '提供专业、高效、精准的文档翻译服务',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}