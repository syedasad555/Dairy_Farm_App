import MapView, { Marker } from 'react-native-maps';
import { View } from 'react-native';

interface OrderMapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export function OrderMap({ latitude, longitude, title }: OrderMapProps) {
  const lat = latitude || 17.385;
  const lon = longitude || 78.486;

  return (
    <View className="h-48 rounded-xl overflow-hidden">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: lat, longitude: lon }} title={title} />
      </MapView>
    </View>
  );
}
