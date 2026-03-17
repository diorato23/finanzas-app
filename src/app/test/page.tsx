export default function TestPage() {
  return (
    <div className="p-20">
      <h1 className="text-4xl font-bold">Teste de Renderização</h1>
      <p>Se você consegue ver esta página, o roteamento básico está funcionando.</p>
      <p>Hora atual: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}
