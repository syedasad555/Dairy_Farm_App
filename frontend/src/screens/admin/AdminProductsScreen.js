import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AdminProductsScreen = ({ navigation }) => {
  const { user, API_URL } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', category: 'dairy', subCategory: '',
    variantSize: '1 Liter', price: '', stock: '50', imageUrl: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/products`;
      if (selectedCategory !== 'all') {
        url += `?category=${selectedCategory}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_URL}/products/${productId}`,
                {
                  headers: {
                    Authorization: `Bearer ${user.token}`
                  }
                }
              );

              if (response.data.success) {
                setProducts(products.filter(p => p._id !== productId));
                Alert.alert('Success', 'Product deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    try {
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        subCategory: newProduct.subCategory || newProduct.name,
        variants: [{
          size: newProduct.variantSize,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 0,
          unit: 'pieces'
        }],
        images: [newProduct.imageUrl || 'https://via.placeholder.com/150'],
        farmInfo: {
          farmName: 'Farm Fresh Dairy & Organic Store',
          farmAddress: 'Village Road, Guntur District, Andhra Pradesh',
          contactNumber: '9876543210',
          supportNumber: '9876543211'
        }
      };
      const response = await axios.post(`${API_URL}/products`, productData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data.success) {
        setShowAddModal(false);
        setNewProduct({ name: '', description: '', category: 'dairy', subCategory: '', variantSize: '1 Liter', price: '', stock: '50', imageUrl: '' });
        fetchProducts();
        Alert.alert('Success', 'Product added successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    }
  };

  const categories = ['all', 'dairy', 'meat', 'poultry', 'grocery'];

  const renderProduct = (product) => (
    <View key={product._id} style={styles.productCard}>
      <View style={styles.productHeader}>
        <View>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productCategory}>
            {product.category} • {product.subCategory}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: product.isActive ? '#4CAF50' : '#f44336' }
        ]}>
          <Text style={styles.statusText}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.variantsSection}>
        {product.variants.map((variant, index) => (
          <View key={index} style={styles.variantRow}>
            <Text style={styles.variantSize}>{variant.size}</Text>
            <Text style={styles.variantPrice}>₹{variant.price}</Text>
            <Text style={[
              styles.variantStock,
              variant.stock === 0 && styles.outOfStock
            ]}>
              Stock: {variant.stock}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.productFooter}>
        <View style={styles.badges}>
          {product.isPopular && (
            <View style={styles.popularBadge}>
              <Text style={styles.badgeText}>Popular</Text>
            </View>
          )}
          {product.isBestSeller && (
            <View style={styles.bestSellerBadge}>
              <Text style={styles.badgeText}>Best Seller</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => Alert.alert('Edit', 'Edit product functionality coming soon')}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(product._id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Product Management</Text>
        <Text style={styles.headerSubtitle}>{products.length} products</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Add products to get started</Text>
          </View>
        ) : (
          products.map(renderProduct)
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add New Product</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <ScrollView>
              <TextInput style={styles.modalInput} placeholder="Product Name" value={newProduct.name} onChangeText={t => setNewProduct({...newProduct, name: t})} />
              <TextInput style={styles.modalInput} placeholder="Description" value={newProduct.description} onChangeText={t => setNewProduct({...newProduct, description: t})} multiline />
              <TextInput style={styles.modalInput} placeholder="Category (dairy/meat/poultry/grocery)" value={newProduct.category} onChangeText={t => setNewProduct({...newProduct, category: t})} />
              <TextInput style={styles.modalInput} placeholder="Sub Category" value={newProduct.subCategory} onChangeText={t => setNewProduct({...newProduct, subCategory: t})} />
              <TextInput style={styles.modalInput} placeholder="Variant Size (e.g. 1 Liter)" value={newProduct.variantSize} onChangeText={t => setNewProduct({...newProduct, variantSize: t})} />
              <TextInput style={styles.modalInput} placeholder="Price" keyboardType="numeric" value={newProduct.price} onChangeText={t => setNewProduct({...newProduct, price: t})} />
              <TextInput style={styles.modalInput} placeholder="Stock" keyboardType="numeric" value={newProduct.stock} onChangeText={t => setNewProduct({...newProduct, stock: t})} />
              <TextInput style={styles.modalInput} placeholder="Image URL" value={newProduct.imageUrl} onChangeText={t => setNewProduct({...newProduct, imageUrl: t})} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e8f5e9',
    marginTop: 5,
  },
  categoryFilter: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  variantsSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  variantSize: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  variantStock: {
    fontSize: 14,
    color: '#666',
  },
  outOfStock: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  badges: {
    flexDirection: 'row',
    gap: 5,
  },
  popularBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bestSellerBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelBtnText: { fontSize: 16, color: '#666', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#4CAF50', alignItems: 'center' },
  saveBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
});

export default AdminProductsScreen;
