// Converte centavos para R$ formatado
// Ex: 1050 → "R$ 10,50"
export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

// Converte input do usuário para centavos
// Ex: "10,50" → 1050
export const parseCurrency = (input: string): number => {
  const cleaned = input.replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(cleaned) * 100)
}

// Formata data para pt-BR
// Ex: "2026-05-01" → "01/05/2026"
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

// Formata data e hora
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}