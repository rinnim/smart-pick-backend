// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');

// GET all products
router.get('/find/all', productController.getAllProducts);

// GET products by filters (category, subcategory, brand)
router.get('/find', productController.getProductsByFilters);

// GET a product by ID
router.get('/find/:id', productController.getProductById);

// POST a new product
router.post('/create', productController.createProduct);

router.post('/new', productController.createOrUpdateProduct);

// PUT update a product by ID
router.put('/update/:id', productController.updateProduct);

// DELETE a product by ID
router.delete('/delete/:id', productController.deleteProduct);

// GET all categories
router.get('/categories', productController.getCategoriesAndSubcategories);

// GET all brands
router.get('/brands', productController.getBrands);

// GET popular products
router.get('/popular', productController.getPopularProducts);

// GET similar products
router.get('/similar', productController.getSimilarProducts);

// GET similar products by shop
router.get('/similar/different-shop', productController.getSimilarProductsByShop);

// GET similar products in shop
router.get('/similar/same-shop', productController.getSimilarProductsInShop);

module.exports = router;
