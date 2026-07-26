import { useQuery } from '@tanstack/react-query';
import { getVessels } from '../services/vessels.service';

export function useVessels() {
  return useQuery({
    queryKey: ['vessels'],
    queryFn: getVessels,
  });
}
