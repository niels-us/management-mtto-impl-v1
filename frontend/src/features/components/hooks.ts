import { useQuery } from '@tanstack/react-query';
import { getVesselComponents } from './api';

export function useComponents(vesselId: string | undefined) {
  return useQuery({
    queryKey: ['components', vesselId],
    queryFn: () => getVesselComponents(vesselId!),
    enabled: !!vesselId,
  });
}
