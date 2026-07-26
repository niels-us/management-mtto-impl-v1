import { useParams, Link } from 'react-router-dom';
import { useComponents } from '../hooks/useComponents';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowLeft, Cpu, Plus } from 'lucide-react';

export default function ComponentListPage() {
  const { id: vesselId } = useParams<{ id: string }>();
  const { data: components, isLoading } = useComponents(vesselId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/vessels"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Vessels
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Components</h1>
          <p className="text-sm text-muted-foreground">
            Components for this vessel
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : components?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <Cpu className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No components registered for this vessel</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {components?.map((component) => (
            <Card key={component.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    {component.serialNumber && (
                      <p className="text-sm text-muted-foreground">
                        S/N: {component.serialNumber}
                      </p>
                    )}
                  </div>
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {component.installedAt && (
                  <p className="text-xs text-muted-foreground">
                    Installed: {new Date(component.installedAt).toLocaleDateString()}
                  </p>
                )}
                <Link to={`/components/${component.id}/maintenance/new`}>
                  <Button size="sm" className="w-full">
                    <Plus className="mr-1 h-3 w-3" />
                    Create Maintenance
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
