import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const { API_URL } = useAuth();
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products/${productId}`);
      if (response.data.success) {
        setProduct(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !product.variants[selectedVariant]) return;
    const variant = product.variants[selectedVariant];
    if (variant.stock === 0) return;

    addToCart({
      productId: product._id,
      name: product.name,
      variant: variant.size,
      quantity,
      price: variant.price,
      image: product.images?.[0] || 'https://via.placeholder.com/100'
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigation.navigate('Cart');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const currentVariant = product.variants[selectedVariant];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400' }}
            style={styles.productImage}
          />
          {product.isBestSeller && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⭐ Best Seller</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.category}>{product.category} • {product.subCategory}</Text>

          <Text style={styles.sectionTitle}>Select Size</Text>
          <View style={styles.variantsContainer}>
            {product.variants.map((variant, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.variantButton,
                  selectedVariant === index && styles.variantButtonSelected,
                  variant.stock === 0 && styles.variantDisabled
                ]}
                onPress={() => setSelectedVariant(index)}
                disabled={variant.stock === 0}
              >
                <Text style={[styles.variantText, selectedVariant === index && styles.variantTextSelected]}>
                  {variant.size}
                </Text>
                <Text style={[styles.variantPrice, selectedVariant === index && styles.variantPriceSelected]}>
                  ₹{variant.price}
                </Text>
                {variant.stock === 0 && (
                  <Text style={styles.outOfStock}>{t('outOfStock')}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.quantityRow}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(quantity + 1)}>
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {currentVariant && (
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Total Price</Text>
              <Text style={styles.priceValue}>₹{currentVariant.price * quantity}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.farmCard}>
            <Text style={styles.farmTitle}>🌾 Farm Information</Text>
            <Text style={styles.farmLabel}>Farm Name</Text>
            <Text style={styles.farmValue}>{product.farmInfo.farmName}</Text>
            <Text style={styles.farmLabel}>Address</Text>
            <Text style={styles.farmValue}>{product.farmInfo.farmAddress}</Text>
            <Text style={styles.farmLabel}>Contact</Text>
            <Text style={styles.farmValue}>{product.farmInfo.contactNumber}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addToCartButton]}
          onPress={handleAddToCart}
          disabled={addedToCart || currentVariant?.stock === 0}
        >
          <Text style={styles.addToCartText}>
            {addedToCart ? '✓ Added' : t('addToCart')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.buyNowButton]}
          onPress={handleBuyNow}
          disabled={currentVariant?.stock === 0}
        >
          <Text style={styles.buyNowText}>{t('buyNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  content: { flex: 1 },
  imageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 280, resizeMode: 'cover' },
  badge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoContainer: { padding: spacing.lg },
  productName: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 6 },
  category: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.md, textTransform: 'capitalize' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md },
  variantsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  variantButton: {
    backgroundColor: colors.surface, padding: 14, borderRadius: borderRadius.md,
    minWidth: 100, alignItems: 'center', borderWidth: 2, borderColor: colors.border, ...shadows.card,
  },
  variantButtonSelected: { backgroundColor: '#E8F5E9', borderColor: colors.primary },
  variantDisabled: { opacity: 0.5 },
  variantText: { fontSize: 15, fontWeight: '600', color: colors.text },
  variantTextSelected: { color: colors.primary },
  variantPrice: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 4 },
  variantPriceSelected: { color: colors.primary },
  outOfStock: { fontSize: 11, color: colors.error, marginTop: 4 },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityButton: {
    width: 40, height: 40, backgroundColor: colors.primary, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  quantityButtonText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  quantityValue: { fontSize: 20, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#E8F5E9', padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md,
  },
  priceLabel: { fontSize: 16, color: colors.textSecondary },
  priceValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
  farmCard: {
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.md,
    marginTop: spacing.md, marginBottom: 100, ...shadows.card,
  },
  farmTitle: { fontSize: 17, fontWeight: '600', marginBottom: spacing.sm },
  farmLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 8, fontWeight: '600' },
  farmValue: { fontSize: 15, color: colors.text },
  bottomActions: {
    flexDirection: 'row', padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, gap: 10,
  },
  actionButton: { flex: 1, padding: 16, borderRadius: borderRadius.md, alignItems: 'center' },
  addToCartButton: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  buyNowButton: { backgroundColor: colors.primary },
  addToCartText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  buyNowText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default ProductDetailsScreen;
