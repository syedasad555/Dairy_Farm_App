import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { productService } from '@/services';
import { productRepository } from '@/repositories/product.repository';
import { Card, Button, LoadingScreen, EmptyState, Badge } from '@/shared/components/ui';
import { FormInput, FormSelect } from '@/shared/components/FormInput';
import { formatCurrency } from '@/shared/utils/format';
import { PRODUCT_CATEGORIES } from '@/shared/constants';
import type { Product, ProductCategory } from '@/shared/types';

export default function AdminProductsScreen() {
  const [showForm, setShowForm] = useState(false);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productRepository.getAll(false),
  });

  const disable = async (id: string) => {
    await productService.disable(id);
    refetch();
  };

  const remove = (id: string) => {
    Alert.alert('Delete Product', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await productService.delete(id); refetch(); } },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-primary">Products</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Text className="text-primary font-semibold">{showForm ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && <ProductForm onSuccess={() => { setShowForm(false); refetch(); }} />}

        {!products?.length ? (
          <EmptyState title="No products" message="Add your first product." />
        ) : (
          products.map((p) => (
            <Card key={p.id} className="mb-3">
              <View className="flex-row justify-between">
                <Text className="font-bold text-lg">{p.name}</Text>
                <Badge label={p.active ? 'Active' : 'Disabled'} color={p.active ? 'success' : 'error'} />
              </View>
              <Badge label={p.category} color="primary" />
              <Text className="text-muted text-sm mt-1">{p.description}</Text>
              <Text className="text-primary mt-1">
                {p.variants.map((v) => `${v.name}: ${formatCurrency(v.price)}`).join(' | ')}
              </Text>
              <View className="flex-row gap-2 mt-3">
                {p.active && <Button title="Disable" variant="outline" size="sm" className="flex-1" onPress={() => disable(p.id)} />}
                <Button title="Delete" variant="danger" size="sm" className="flex-1" onPress={() => remove(p.id)} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      category: 'Dairy' as ProductCategory,
      description: '',
      image: '',
      stock: '100',
      variantName: '500ml',
      variantPrice: '',
      variantQty: '500ml',
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    await productService.create({
      name: data.name,
      category: data.category as ProductCategory,
      description: data.description,
      image: data.image,
      stock: parseInt(data.stock, 10),
      active: true,
      variants: [{ name: data.variantName, price: parseFloat(data.variantPrice), quantity: data.variantQty }],
    });
    onSuccess();
  };

  return (
    <Card className="mb-4">
      <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
        <FormInput label="Product Name" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="category" render={({ field: { onChange, value } }) => (
        <FormSelect label="Category" value={value} onChange={onChange} options={PRODUCT_CATEGORIES.map((c) => ({ label: c, value: c }))} />
      )} />
      <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
        <FormInput label="Description" value={value} onChangeText={onChange} multiline />
      )} />
      <Controller control={control} name="image" render={({ field: { onChange, value } }) => (
        <FormInput label="Image URL" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="variantName" render={({ field: { onChange, value } }) => (
        <FormInput label="Variant Name" value={value} onChangeText={onChange} placeholder="500ml" />
      )} />
      <Controller control={control} name="variantPrice" render={({ field: { onChange, value } }) => (
        <FormInput label="Variant Price" value={value} onChangeText={onChange} keyboardType="numeric" />
      )} />
      <Button title="Create Product" onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
