import { Link } from 'react-router-dom';
import { useVessels } from '../hooks/useVessels';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Ship, ArrowRight } from 'lucide-react';

export default function VesselListPage() {
  const { data: vessels, isLoading } = useVessels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vessels</h1>
        <p className="text-sm text-muted-foreground">All registered vessels</p>
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
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vessels?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <Ship className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No vessels found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vessels?.map((vessel) => (
            <Card key={vessel.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{vessel.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {vessel.registrationNumber}
                    </p>
                  </div>
                  <Ship className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Created: {new Date(vessel.createdAt).toLocaleDateString()}
                </p>
                <Link to={`/vessels/${vessel.id}/components`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Components
                    <ArrowRight className="ml-1 h-3 w-3" />
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
