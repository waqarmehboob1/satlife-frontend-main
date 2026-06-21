import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { resolveStatusName } from '@/lib/entity-status';
import type { Status } from '@/lib/models';
import Link from 'next/link';
import { ConfirmDialog } from './confirm-dialog';

interface EntityCardsProps {
  title: string;
  description: string;
  entities: Array<{
    id: number;
    name: string;
    status_id?: number;
    status_name?: string;
    status?: { status_name: string };
    description?: string;
  }>;
  statuses?: Status[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  detailPath: (id: number) => string;
  addButtonLabel?: string;
  emptyMessage?: string;
}

export function EntityCards({
  title,
  description,
  entities,
  onAdd,
  onDelete,
  detailPath,
  addButtonLabel = 'Add New',
  emptyMessage = 'No entities found',
  statuses = [],
}: EntityCardsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {addButtonLabel}
        </Button>
      </CardHeader>
      <CardContent>
        {entities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity) => {
              const statusLabel = resolveStatusName(entity, statuses);
              return (
              <Card key={entity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{entity.name}</h3>
                        {entity.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {entity.description}
                          </p>
                        )}
                      </div>
                      {statusLabel !== 'Unknown' && (
                        <StatusBadge status={statusLabel} />
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={detailPath(entity.id)} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                      {/* <ConfirmDialog
                        title={`Delete ${entity.name}`}
                        description="This action cannot be undone."
                        onConfirm={() => onDelete(entity.id)}
                      >
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </ConfirmDialog> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
