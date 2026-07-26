import { useQuery } from '@tanstack/react-query';
import { getVesselComponents } from '../services/components.service';

export function useComponents(vesselId: string | undefined) {
  return useQuery({
    queryKey: ['components', vesselId],
    queryFn: () => getVesselComponents(vesselId!),
    enabled: !!vesselId,
  });
}
