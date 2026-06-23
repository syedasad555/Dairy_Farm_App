import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { getGoogleMapsNavigationUrl } from '@/shared/utils/geo';

interface OrderMapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export function OrderMap({ latitude, longitude, title }: OrderMapProps) {
  const lat = latitude || 17.385;
  const lon = longitude || 78.486;

  return (
    <View className="h-48 rounded-xl bg-surface border border-gray-200 items-center justify-center p-4">
      <Text className="text-muted text-center mb-2">Map view is available on the mobile app.</Text>
      {title ? <Text className="font-semibold text-gray-800 mb-3">{title}</Text> : null}
      <TouchableOpacity onPress={() => Linking.openURL(getGoogleMapsNavigationUrl(lat, lon))}>
        <Text className="text-primary font-semibold">Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}
