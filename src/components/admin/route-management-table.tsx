
'use client';

import type { Route } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RouteManagementTableProps {
  routes: Route[];
  onToggleRouteStatus: (routeId: string) => void;
  onDeleteRoute: (routeId: string) => void;
}

export function RouteManagementTable({ routes, onToggleRouteStatus, onDeleteRoute }: RouteManagementTableProps) {
  if (!routes || routes.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No hay rutas administrables para mostrar. Agregue una nueva ruta.</p>;
  }

  return (
    <Table>
      <TableCaption>Administre el estado de las rutas de buses. Los cambios se reflejarán para los usuarios.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID Ruta</TableHead>
          <TableHead>Nombre de Ruta</TableHead>
          <TableHead className="hidden md:table-cell">Descripción</TableHead>
          <TableHead className="text-center">Estado Actual</TableHead>
          <TableHead className="text-center w-[180px]">Cambiar Estado</TableHead>
          <TableHead className="text-right w-[100px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {routes.map((route) => (
          <TableRow key={route.id} className={route.status === 'blocked' ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'}>
            <TableCell className="font-medium">{route.id}</TableCell>
            <TableCell>{route.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{route.pathDescription}</TableCell>
            <TableCell className="text-center">
              <Badge variant={route.status === 'blocked' ? 'destructive' : 'default'} className="flex items-center gap-1 justify-center text-xs px-2 py-0.5">
                {route.status === 'blocked' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                {route.status === 'blocked' ? 'Bloqueada' : 'Abierta'}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {route.status === 'open' ? 'Bloquear' : 'Abrir'}
                </span>
                <Switch
                  id={`status-${route.id}`}
                  checked={route.status === 'blocked'}
                  onCheckedChange={() => onToggleRouteStatus(route.id)}
                  aria-label={`Cambiar estado de ${route.name}`}
                  className="data-[state=checked]:bg-destructive data-[state=unchecked]:bg-primary/70"
                />
              </div>
            </TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar ruta {route.name}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro de eliminar esta ruta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La ruta "{route.name}" (ID: {route.id}) será eliminada permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteRoute(route.id)} className="bg-destructive hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
