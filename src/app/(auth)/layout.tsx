// src/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O fundo é controlado pela própria página (login/register)
  // para suportar modo escuro
  return <>{children}</>
}