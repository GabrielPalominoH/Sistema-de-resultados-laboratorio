export function showPersistSuccessToast(toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => void) {
  toast({
    title: 'Éxito',
    description: 'Registro guardado exitosamente.',
  });
}
