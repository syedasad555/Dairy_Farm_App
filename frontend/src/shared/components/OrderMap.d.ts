import type { FC } from 'react';

export interface OrderMapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export const OrderMap: FC<OrderMapProps>;
