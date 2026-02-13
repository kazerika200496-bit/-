import './globals.css'

export const metadata = {
  title: 'いしだクリーニング 資材発注',
  description: 'Ishida Cleaning Material Ordering App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
