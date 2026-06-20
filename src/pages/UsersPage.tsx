import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, createUser, toggleUserState, deleteUser } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import type { UserProfile } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Shield, User as UserIcon, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRole } from '@/hooks/use-role';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('user');

  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { isAdmin } = useRole();

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      const filtered = currentUser ? data.filter((u) => u.id !== currentUser.id) : data;
      setUsers(filtered);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
    else setLoading(false);
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
      toast({
        title: 'Rol actualizado',
        description: `El rol del usuario ha sido actualizado a ${newRole === 'admin' ? 'Administrador' : 'Usuario'}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      await createUser(newUsername, newPassword, newFullName, newRole);

      toast({
        title: 'Usuario creado',
        description: `El usuario ${newUsername} ha sido creado exitosamente.`,
      });

      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('user');
      setIsCreateDialogOpen(false);

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el usuario',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    const confirmed = window.confirm(`¿Deseas eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast({
        title: 'Usuario eliminado',
        description: `${user.username} fue eliminado correctamente.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleUserState = async (user: UserProfile) => {
    const willDisable = !user.disabled;
    setTogglingId(user.id);
    try {
      await toggleUserState(user.id, willDisable);
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, disabled: willDisable } : u
      ));
      toast({
        title: willDisable ? 'Usuario deshabilitado' : 'Usuario habilitado',
        description: willDisable
          ? `${user.username} no podrá iniciar sesión.`
          : `${user.username} puede iniciar sesión nuevamente.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `No se pudo ${willDisable ? 'deshabilitar' : 'habilitar'} el usuario`,
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
            <p className="text-muted-foreground">
              Administra los roles de los usuarios del sistema
            </p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo usuario. Podrá iniciar sesión inmediatamente con la contraseña asignada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="jperez"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creatingUser}>
                  {creatingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Usuario'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Total: {users.length} usuario{users.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.fullName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.disabled ? 'destructive' : 'outline'}>
                      {user.disabled ? 'Deshabilitado' : 'Activo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <><Shield className="mr-1 h-3 w-3" /> Administrador</>
                      ) : (
                        <><UserIcon className="mr-1 h-3 w-3" /> Usuario</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={updatingId === user.id || deletingId === user.id || togglingId === user.id}
                      >
                        <SelectTrigger className="w-[160px]">
                          {updatingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuario</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={user.disabled ? 'outline' : 'secondary'}
                        size="icon"
                        onClick={() => handleToggleUserState(user)}
                        disabled={togglingId === user.id || deletingId === user.id || updatingId === user.id}
                        aria-label={user.disabled ? `Habilitar usuario ${user.username}` : `Deshabilitar usuario ${user.username}`}
                      >
                        {togglingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.disabled ? (
                          <Power className="h-4 w-4" />
                        ) : (
                          <PowerOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deletingId === user.id || updatingId === user.id || togglingId === user.id}
                        aria-label={`Eliminar usuario ${user.username}`}
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
