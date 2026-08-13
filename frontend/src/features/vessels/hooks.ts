import { useQuery } from '@tanstack/react-query';
import { getVessels } from './api';

export function useVessels() {
  return useQuery({
    queryKey: ['vessels'],
    queryFn: getVessels,
  });
}
