const exactTitles: Record<string, string> = {
  '/': 'Inicio',
  '/dashboard': 'Inicio',
  '/dashboard/results': 'Resultados',
  '/dashboard/metrics': 'Métricas',
  '/dashboard/users': 'Gestión de Usuarios',
  '/dashboard/account': 'Configuración de Cuenta',
  '/dashboard/account/password': 'Cambiar Contraseña',
  '/dashboard/exam/foods': 'Análisis de Alimentos',
  '/dashboard/exam/hemograma-completo': 'Hemograma Completo',
  '/dashboard/exam/deteccion-sangre-oculta': 'Sangre Oculta en Heces',
  '/dashboard/exam/examen-general': 'Examen General',
  '/dashboard/exam/bioquimico': 'Bioquímico',
  '/dashboard/exam/nino': 'Examen Niño',
};

export function getTitleFromPathname(pathname: string): string {
  if (exactTitles[pathname]) return exactTitles[pathname];

  if (/^\/dashboard\/results\/[^/]+$/.test(pathname)) {
    return 'Detalle de Resultado';
  }

  if (/^\/dashboard\/exam\/[^/]+\/[^/]+\/edit$/.test(pathname)) {
    return 'Editar Registro';
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replaceAll('-', ' ');
  }

  return 'Laboratorio';
}
