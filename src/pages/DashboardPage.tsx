import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Apple, FileText, TestTubeDiagonal, Search, FlaskConical, User } from 'lucide-react'

const examTypes = [
  { name: 'Analisis de Alimentos', href: '/dashboard/exam/foods', icon: Apple, description: 'Analisis clinico general' },
  { name: 'Hemograma Completo', href: '/dashboard/exam/hemograma-completo', icon: TestTubeDiagonal, description: 'Analisis de componentes sanguineos' },
  { name: 'Sangre Oculta en Heces', href: '/dashboard/exam/deteccion-sangre-oculta', icon: Search, description: 'Test de inmunoensayo cromatografico' },
  { name: 'Examen General', href: '/dashboard/exam/examen-general', icon: FlaskConical, description: 'Panel completo de analisis general' },
  { name: 'Bioquimico', href: '/dashboard/exam/bioquimico', icon: FlaskConical, description: 'Perfil bioquimico del paciente' },
  { name: 'Examen Nino', href: '/dashboard/exam/nino', icon: User, description: 'Registro pediatrico con parametros clinicos' },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div className="animate-fade-in space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido a Laboratorio</h1>
        <p className="text-muted-foreground">
          Selecciona un tipo de examen para empezar a ingresar resultados o gestionar reportes existentes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {examTypes.map((exam, index) => (
          <Card
            key={exam.name}
            className="animate-slide-in-up cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 75}ms` }}
            onClick={() => navigate(exam.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{exam.name}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <exam.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">{exam.description}</p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate(exam.href) }}>
                Nuevo Reporte
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle>Gestionar Resultados</CardTitle>
          <CardDescription>Ver, editar o imprimir todos los resultados de laboratorio enviados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate('/dashboard/results')}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Todos los Resultados
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
