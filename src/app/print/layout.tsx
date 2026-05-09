export default function PrintRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ margin: 0, padding: 0, background: 'white' }}>
      {children}
    </div>
  )
}