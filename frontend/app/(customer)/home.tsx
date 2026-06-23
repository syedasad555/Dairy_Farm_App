import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services';
import { useCartStore } from '@/stores';
import { Card, Badge, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';
import { PRODUCT_CATEGORIES } from '@/shared/constants';
import type { Product, ProductCategory } from '@/shared/types';
import { cacheProducts } from '@/lib/queryClient';

export default function CustomerHomeScreen() {
  const [category, setCategory] = useState<ProductCategory | 'All'>('All');
  const addItem = useCartStore((s) => s.addItem);

  const { data: products, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const data = await productService.getAll();
      await cacheProducts(data);
      return data;
    },
  });

  const filtered =
    category === 'All' ? products : products?.filter((p) => p.category === category);

  if (isLoading && !products) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-primary">MVR Farms</Text>
        <Text className="text-muted">Fresh. Natural. Farm Direct.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4 max-h-12"
        contentContainerClassName="gap-2"
      >
        {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full ${category === cat ? 'bg-primary' : 'bg-white border border-gray-200'}`}
          >
            <Text className={category === cat ? 'text-white font-semibold' : 'text-gray-700'}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="px-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2D5016']} />}
      >
        {!filtered?.length ? (
          <EmptyState title="No products" message="Check back soon for fresh farm products." />
        ) : (
          filtered.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addItem} />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: ReturnType<typeof useCartStore.getState>['addItem'];
}) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  return (
    <Card className="mb-4">
      <View className="flex-row gap-4">
        {product.image ? (
          <Image source={{ uri: product.image }} className="w-20 h-20 rounded-xl bg-gray-100" />
        ) : (
          <View className="w-20 h-20 rounded-xl bg-primary/10 items-center justify-center">
            <Text className="text-3xl">🥛</Text>
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">{product.name}</Text>
            <Badge label={product.category} color="primary" />
          </View>
          <Text className="text-muted text-sm mt-1" numberOfLines={2}>
            {product.description}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
        {product.variants.map((v) => (
          <TouchableOpacity
            key={v.name}
            onPress={() => setSelectedVariant(v)}
            className={`mr-2 px-3 py-1.5 rounded-lg border ${
              selectedVariant?.name === v.name ? 'border-primary bg-primary/10' : 'border-gray-200'
            }`}
          >
            <Text className="text-sm font-medium">{v.name}</Text>
            <Text className="text-primary font-bold">{formatCurrency(v.price)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedVariant && (
        <TouchableOpacity
          onPress={() =>
            onAdd({
              productId: product.id,
              productName: product.name,
              variantName: selectedVariant.name,
              price: selectedVariant.price,
              quantity: 1,
              image: product.image,
            })
          }
          className="mt-3 bg-primary py-2.5 rounded-xl items-center"
        >
          <Text className="text-white font-semibold">Add to Cart</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}
