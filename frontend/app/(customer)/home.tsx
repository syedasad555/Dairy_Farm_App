import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  Image, TextInput, FlatList, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { productService } from '@/services';
import { useCartStore, useAuthStore, useThemeStore } from '@/stores';
import { Card, Badge, LoadingScreen, EmptyState, StatCard } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';
import { PRODUCT_CATEGORIES } from '@/shared/constants';
import type { Product, ProductCategory, CartItem } from '@/shared/types';
import { cacheProducts } from '@/lib/queryClient';

const CATEGORY_ICONS: Record<string, string> = {
  All: '🛒',
  Dairy: '🥛',
  Meat: '🥩',
  Poultry: '🐔',
  Grocery: '🥬',
};

export default function CustomerHomeScreen() {
  const [category, setCategory] = useState<ProductCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const dark = useThemeStore((s) => s.dark);
  const profile = useAuthStore((s) => s.profile);
  const addItem = useCartStore((s) => s.addItem);
  const cartTotal = useCartStore((s) => s.totalItems)();

  const { data: products, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const data = await productService.getAll();
      await cacheProducts(data);
      return data;
    },
  });

  const filtered = (products ?? [])
    .filter((p) => p.active)
    .filter((p) => category === 'All' || p.category === category)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const popularProducts = (products ?? [])
    .filter((p) => p.active && p.category === 'Dairy')
    .slice(0, 6);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good morning';
    if (h < 17) return '☀️ Good afternoon';
    return '🌙 Good evening';
  };

  if (isLoading && !products) return <LoadingScreen message="Loading fresh products..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0F1A0A' : '#F5F9F2' }}>
      {/* ─── Header ────────────────────────────────────────────────── */}
      <LinearGradient colors={['#1E5C0A', '#2D7A1A']} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting()}, {profile?.name?.split(' ')[0] ?? 'there'}!</Text>
          <Text style={styles.headerTitle}>MVR Farms 🌿</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(customer)/cart' as never)} style={styles.cartBtn}>
          <Ionicons name="cart" size={26} color="#fff" />
          {cartTotal > 0 && (
            <View style={styles.cartBadge}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{cartTotal}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* ─── Search Bar ────────────────────────────────────────────── */}
      <View style={[styles.searchWrap, { backgroundColor: dark ? '#1A2614' : '#FFFFFF' }]}>
        <Ionicons name="search" size={18} color="#8FA882" style={{ marginRight: 8 }} />
        <TextInput
          style={{ flex: 1, fontSize: 15, color: dark ? '#E8F5E0' : '#1A2614' }}
          placeholder="Search products..."
          placeholderTextColor="#8FA882"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#8FA882" />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Category Pills ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      >
        {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            style={[
              styles.categoryPill,
              {
                backgroundColor: category === cat ? '#1E5C0A' : (dark ? '#243018' : '#FFFFFF'),
                borderColor: category === cat ? '#1E5C0A' : (dark ? '#2D3D22' : '#E8F0E2'),
              },
            ]}
          >
            <Text style={{ fontSize: 14, marginRight: 4 }}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: category === cat ? '#fff' : (dark ? '#8FA882' : '#5A6B52'),
            }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── Product List ──────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <ProductCard product={item} onAdd={addItem} dark={dark} compact />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1E5C0A']} tintColor="#1E5C0A" />}
        ListHeaderComponent={
          !search && category === 'All' && popularProducts.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: dark ? '#E8F5E0' : '#1A2614', marginBottom: 12 }}>
                ⭐ Popular Picks
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                {popularProducts.map((p) => (
                  <PopularCard key={`pop-${p.id}`} product={p} onAdd={addItem} dark={dark} />
                ))}
              </ScrollView>
              <Text style={{ fontSize: 18, fontWeight: '800', color: dark ? '#E8F5E0' : '#1A2614', marginTop: 16, marginBottom: 4 }}>
                All Products
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState title="No products found" message={search ? 'Try a different search term' : 'Check back soon for fresh products!'} icon="🥛" />}
        showsVerticalScrollIndicator={false}
      />

      {/* ─── Quick Actions ─────────────────────────────────────────── */}
      <View style={[styles.quickActions, { backgroundColor: dark ? '#1A2614' : '#FFFFFF', borderTopColor: dark ? '#2D3D22' : '#E8F0E2' }]}>
        {[
          { icon: '📋', label: 'Subscriptions', route: '/(customer)/subscriptions' },
          { icon: '💰', label: 'Bills', route: '/(customer)/billing' },
          { icon: '📞', label: 'Support', route: '/(customer)/complaints' },
        ].map((item) => (
          <TouchableOpacity key={item.label} onPress={() => router.push(item.route as never)} style={styles.quickBtn}>
            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            <Text style={{ fontSize: 11, color: dark ? '#8FA882' : '#5A6B52', marginTop: 2, fontWeight: '600' }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Popular Card (horizontal) ─────────────────────────────────────────────
function PopularCard({ product, onAdd, dark }: { product: Product; onAdd: (item: CartItem) => void; dark: boolean }) {
  const variant = product.variants[0];
  if (!variant) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onAdd({
        productId: product.id,
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        quantity: 1,
        image: product.image,
      })}
      style={[styles.popularCard, { backgroundColor: dark ? '#243018' : '#FFFFFF', borderColor: dark ? '#2D3D22' : '#E8F0E2' }]}
    >
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.popularImg} />
      ) : (
        <View style={[styles.popularImg, { backgroundColor: '#F0FBE8', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 28 }}>🥛</Text>
        </View>
      )}
      <Text style={{ fontWeight: '700', color: dark ? '#E8F5E0' : '#1A2614', fontSize: 13, marginTop: 8 }} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={{ color: '#1E5C0A', fontWeight: '800', fontSize: 14, marginTop: 4 }}>{formatCurrency(variant.price)}</Text>
      <View style={styles.popularAddBtn}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+ Add</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, dark, compact }: { product: Product; onAdd: (item: CartItem) => void; dark: boolean; compact?: boolean }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!selectedVariant) return;
    onAdd({
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity: 1,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <View style={[styles.productCard, { backgroundColor: dark ? '#243018' : '#FFFFFF', borderColor: dark ? '#2D3D22' : '#E8F0E2' }]}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Image */}
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.productImg} />
        ) : (
          <View style={[styles.productImg, { backgroundColor: dark ? '#1A2614' : '#F0FBE8', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 32 }}>{CATEGORY_ICONS[product.category] ?? '🥛'}</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? '#E8F5E0' : '#1A2614', flex: 1 }}>{product.name}</Text>
            <View style={{ backgroundColor: '#F0FBE8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#1E5C0A' }}>{product.category}</Text>
            </View>
          </View>
          <Text style={{ color: dark ? '#8FA882' : '#5A6B52', fontSize: 13, marginTop: 4, lineHeight: 18 }} numberOfLines={2}>
            {product.description}
          </Text>
        </View>
      </View>

      {/* Variants */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {product.variants.map((v) => (
          <TouchableOpacity
            key={v.name}
            onPress={() => setSelectedVariant(v)}
            style={[
              styles.variantChip,
              {
                backgroundColor: selectedVariant?.name === v.name ? '#F0FBE8' : 'transparent',
                borderColor: selectedVariant?.name === v.name ? '#1E5C0A' : (dark ? '#2D3D22' : '#D1E5C8'),
              },
            ]}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: selectedVariant?.name === v.name ? '#1E5C0A' : (dark ? '#8FA882' : '#5A6B52') }}>
              {v.name}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E5C0A', marginTop: 2 }}>{formatCurrency(v.price)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Button */}
      {selectedVariant && (
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addBtn, { backgroundColor: added ? '#16A34A' : '#1E5C0A' }]}
          activeOpacity={0.85}
        >
          <Ionicons name={added ? 'checkmark' : 'add'} size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {added ? 'Added!' : `Add to Cart — ${formatCurrency(selectedVariant.price)}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  cartBtn: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#DC2626', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#D1E5C8',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  productCard: {
    borderRadius: 16, padding: 14, borderWidth: 1,
    shadowColor: '#1E5C0A', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productImg: { width: 80, height: 80, borderRadius: 12 },
  variantChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1.5, marginRight: 8, alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingVertical: 12, borderRadius: 12,
  },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 10, borderTopWidth: 1,
  },
  quickBtn: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 16 },
  popularCard: {
    width: 140,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#1E5C0A',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  popularImg: { width: '100%', height: 90, borderRadius: 12 },
  popularAddBtn: {
    marginTop: 8,
    backgroundColor: '#1E5C0A',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
});
