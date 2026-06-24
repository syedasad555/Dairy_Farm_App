import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { productService } from '@/services';
import { productRepository } from '@/repositories/product.repository';
import { useThemeStore } from '@/stores';
import { Card, Button, LoadingScreen, EmptyState, Badge, ScreenHeader } from '@/shared/components/ui';
import { FormInput, FormSelect } from '@/shared/components/FormInput';
import { formatCurrency } from '@/shared/utils/format';
import { PRODUCT_CATEGORIES } from '@/shared/constants';
import type { Product, ProductCategory } from '@/shared/types';

export default function AdminProductsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const [showForm, setShowForm] = useState(false);

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Products"
        subtitle={`${products?.length ?? 0} items`}
        onBack={() => router.back()}
        rightLabel={showForm ? 'Close' : '+ Add'}
        rightAction={() => setShowForm(!showForm)}
        gradient
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {showForm && <ProductForm onSuccess={() => { setShowForm(false); refetch(); }} dark={dark} border={border} text={text} muted={muted} cardBg={cardBg} />}

        {!products?.length ? (
          <EmptyState title="No products" message="Add your first product." />
        ) : (
          products.map((p) => (
            <View key={p.id} style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {p.image ? (
                  <Image source={{ uri: p.image }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: '#F0FBE8', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>🥛</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '800', color: text, fontSize: 15, flex: 1 }}>{p.name}</Text>
                    <Badge label={p.active ? 'Active' : 'Disabled'} color={p.active ? 'success' : 'error'} />
                  </View>
                  <Badge label={p.category} color="primary" />
                  <Text style={{ color: muted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>{p.description}</Text>
                  <Text style={{ color: '#1E5C0A', marginTop: 4, fontSize: 13 }}>
                    {p.variants.map((v) => `${v.name}: ${formatCurrency(v.price)}`).join(' | ')}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                {p.active && <Button title="Disable" variant="outline" size="sm" onPress={() => disable(p.id)} style={{ flex: 1 }} />}
                <Button title="Delete" variant="danger" size="sm" onPress={() => remove(p.id)} style={{ flex: 1 }} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductForm({ onSuccess, dark, border, text, muted, cardBg }: {
  onSuccess: () => void; dark: boolean; border: string; text: string; muted: string; cardBg: string;
}) {
  const { control, handleSubmit } = useForm({
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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload product images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const onSubmit = async (data: Record<string, string>) => {
    setUploading(true);
    try {
      const tempId = `prod_${Date.now()}`;
      let imageUrl = data.image;
      const images: string[] = [];

      if (imageUri) {
        imageUrl = await productService.uploadImage(imageUri, tempId);
        images.push(imageUrl);
      } else if (imageUrl) {
        images.push(imageUrl);
      }

      await productService.create({
        name: data.name,
        category: data.category as ProductCategory,
        description: data.description,
        image: imageUrl,
        images,
        stock: parseInt(data.stock, 10),
        active: true,
        variants: [{ name: data.variantName, price: parseFloat(data.variantPrice), quantity: data.variantQty }],
      });
      onSuccess();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, marginBottom: 16 }]}>
      <Text style={{ fontWeight: '800', color: text, marginBottom: 12 }}>➕ New Product</Text>
      <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { borderColor: border }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: 120, borderRadius: 10 }} />
        ) : (
          <Text style={{ color: muted, textAlign: 'center' }}>📷 Tap to upload image</Text>
        )}
      </TouchableOpacity>
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
        <FormInput label="Or paste Image URL" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="variantName" render={({ field: { onChange, value } }) => (
        <FormInput label="Variant Name" value={value} onChangeText={onChange} placeholder="500ml" />
      )} />
      <Controller control={control} name="variantPrice" render={({ field: { onChange, value } }) => (
        <FormInput label="Variant Price" value={value} onChangeText={onChange} keyboardType="numeric" />
      )} />
      <Button title={uploading ? 'Uploading...' : 'Create Product'} onPress={handleSubmit(onSubmit)} loading={uploading} gradient />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  imagePicker: { borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed', padding: 16, marginBottom: 12, minHeight: 80, justifyContent: 'center' },
});
