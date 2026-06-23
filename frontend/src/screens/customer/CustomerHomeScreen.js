import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import { spacing, borderRadius, shadows } from '../../constants/theme';

const CustomerHomeScreen = ({ navigation }) => {
  const { user, API_URL } = useAuth();
  const { cartCount, addToCart } = useCart();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [products, setProducts] = useState([]);
  const categories = [
    { id: 1, name: t('categoryDairy', 'Dairy'), icon: '🥛', value: 'dairy' },
    { id: 2, name: t('categoryMeat', 'Meat'), icon: '🥩', value: 'meat' },
    { id: 3, name: t('categoryPoultry', 'Poultry'), icon: '🥚', value: 'poultry' },
    { id: 4, name: t('categoryGrocery', 'Grocery'), icon: '🍚', value: 'grocery' }
  ];
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/products`;
      const params = [];
      if (selectedCategory) params.push(`category=${selectedCategory}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await axios.get(url);
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { backgroundColor: selectedCategory === item.value ? colors.primary : colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.value ? null : item.value)}
    >
      <Text style={[styles.categoryIcon, { color: colors.text }]}>{item.icon}</Text>
      <Text style={[styles.categoryName, { color: selectedCategory === item.value ? colors.textLight : colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => {
    const inStock = item.variants?.some(v => v.stock > 0);
    const variant = item.variants?.[0];

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
      >
        <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300' }} style={styles.productImage} />
        {!inStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{t('outOfStock')}</Text>
          </View>
        )}
        {item.isBestSeller && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⭐</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.productCategory, { color: colors.textSecondary }]}>{item.subCategory}</Text>
          {variant && (
            <Text style={[styles.productPrice, { color: colors.primary }]}>₹{variant.price} / {variant.size}</Text>
          )}
        </View>
        <View style={[styles.productFooter, { borderTopColor: colors.border }]}> 
          {variant && (
            <Text style={[styles.footerPrice, { color: colors.primary }]}>₹{variant.price}</Text>
          )}
          <TouchableOpacity
            style={[styles.addToCartBtn, { backgroundColor: colors.primary }]}
            onPress={() => addToCart({ productId: item._id, variant: variant?.size || '', quantity: 1, name: item.name, price: variant?.price })}
          >
            <Text style={[styles.addToCartText, { color: colors.textLight }]}>{t('addToCart')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const popularProducts = products.filter(p => p.isPopular);
  const bestSellers = products.filter(p => p.isBestSeller);
  const freshArrivals = products.filter(p => p.isFreshArrival);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.primary }]}> 
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.textLight }]}>{t('greeting', { name: user?.fullName?.split(' ')[0] || '' })}</Text>
            <Text style={[styles.tagline, { color: colors.textLight }]}>{t('freshAtDoorstep')}</Text>
          </View>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primaryLight }]} onPress={() => navigation.navigate('Notifications')}>
            <Text style={[styles.iconText, { color: colors.textLight }]}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('searchProducts')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={fetchProducts}
          />
          <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('categories')}</Text>
          <FlatList data={categories} renderItem={renderCategory} keyExtractor={item => item.id.toString()} horizontal showsHorizontalScrollIndicator={false} />
        </View>

        {popularProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('popularProducts')}</Text>
            <FlatList data={popularProducts} renderItem={renderProduct} keyExtractor={item => `pop-${item._id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} />
          </View>
        )}

        {bestSellers.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('bestSellers')}</Text>
            <FlatList data={bestSellers} renderItem={renderProduct} keyExtractor={item => `best-${item._id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} />
          </View>
        )}

        {freshArrivals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('freshArrivals')}</Text>
            <FlatList data={freshArrivals} renderItem={renderProduct} keyExtractor={item => `fresh-${item._id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory ? categories.find(c => c.value === selectedCategory)?.name : t('allProducts')}
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} />
          ) : products.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noProducts')}</Text>
          ) : (
            <View style={styles.productsGrid}>
              {products.map(item => (
                <View key={item._id} style={styles.gridItem}>
                  {renderProduct({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIconActive, { color: colors.primary }]}>🏠</Text>
          <Text style={[styles.navLabelActive, { color: colors.primary }]}>{t('home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Cart')}>
          <Text style={[styles.navIcon, { color: colors.textSecondary }]}>🛒</Text>
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>{t('cart')}</Text>
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('OrderTracking')}>
          <Text style={[styles.navIcon, { color: colors.textSecondary }]}>📦</Text>
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>{t('orders')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={[styles.navIcon, { color: colors.textSecondary }]}>👤</Text>
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>{t('profile')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: 16, borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  greeting: { fontSize: 24, fontWeight: '700' },
  tagline: { fontSize: 14 },
  iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22 },
  searchBar: { flexDirection: 'row', borderRadius: borderRadius.md, paddingHorizontal: spacing.md, alignItems: 'center' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  searchIcon: { fontSize: 18 },
  content: { flex: 1, padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  categoryItem: { padding: 14, borderRadius: borderRadius.md, marginRight: 10, alignItems: 'center', minWidth: 76, ...shadows.card },
  categoryItemSelected: { },
  categoryIcon: { fontSize: 26, marginBottom: 4 },
  categoryName: { fontSize: 12, fontWeight: '600' },
  categoryNameSelected: { color: '#fff' },
  horizontalList: { paddingVertical: 4 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: spacing.sm },
  productCard: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.card },
  productImage: { width: '100%', height: 140, resizeMode: 'cover' },
  stockBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  stockBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  badge: { position: 'absolute', top: 8, right: 8 },
  badgeText: { fontSize: 16 },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: '600' },
  productCategory: { fontSize: 12, marginTop: 2 },
  productPrice: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderTopWidth: 1 },
  footerPrice: { fontSize: 14, fontWeight: '700' },
  addToCartBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addToCartText: { fontWeight: '700' },
  emptyText: { textAlign: 'center', padding: 30 },
  bottomNav: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, ...shadows.elevated },
  navItem: { flex: 1, alignItems: 'center', position: 'relative' },
  navIcon: { fontSize: 22, marginBottom: 2 },
  navIconActive: { fontSize: 22, marginBottom: 2 },
  navLabel: { fontSize: 11 },
  navLabelActive: { fontSize: 11, fontWeight: '700' },
  cartBadge: { position: 'absolute', top: -4, right: 20, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

export default CustomerHomeScreen;
