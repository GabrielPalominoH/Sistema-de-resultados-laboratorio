export function showPersistSuccessToast(toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => void) {
  toast({
    title: 'Exito',
    description: 'Registro guardado exitosamente.',
  });
}
