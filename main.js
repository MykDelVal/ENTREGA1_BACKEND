const express = require('express');
const app = express();
const productsRouter = require('./routes/products');
const cartsRouter = require('./routes/carts');
app.use(express.json());

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Escuchando en el puerto 8080
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

//products -

const express = require('express');
const Router = express.Routerouter(); 
const { getProducts, getProductById, addProduct, updateProduct, deleteProduct } = require('../utils/fileHandler');

//Ruta raíz GET para listar productos con limit
router.get('/', async (req, res) => {
    const limit = req.query.limit;
    const products = await getProducts();
    if (limit) {
        res.json(products.slice(0, limit));
    } else {
        res.json(products);
    }
});

// Ruta GET para obtener producto por ID
router.get('/:pid', async (req, res) => {
    const product = await getProductById(req.params.pid);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: "Producto no encontrado" });
    }
});

// Ruta POST para agregar un nuevo producto
router.post('/', async (req, res) => {
    const { title, description, code, price, status = true, stock, category, thumbnails } = req.body;
    if (!title || !description || !code || !price || !stock || !category) {
        return res.status(400).json({ error: "Todos los campos son obligatorios excepto thumbnails" });
    }

    const newProduct = {
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnails: thumbnails || []
    };

    const product = await addProduct(newProduct);
    res.status(201).json(product);
});

// Ruta PUT para actualizar un producto por ID
router.put('/:pid', async (req, res) => {
    const updatedProduct = req.body;
    const result = await updateProduct(req.params.pid, updatedProduct);
    if (result) {
        res.json(result);
    } else {
        res.status(404).json({ error: "Producto no encontrado" });
    }
});

// Ruta DELETE para eliminar un producto por ID
router.delete('/:pid', async (req, res) => {
    const result = await deleteProduct(req.params.pid);
    if (result) {
        res.json({ message: "Producto eliminado con éxito" });
    } else {
        res.status(404).json({ error: "Producto no encontrado" });
    }
});

module.exports = router;

//CARTS

const express = require('express');
const router = express.Router();
const { getCarts, getCartById, addCart, addProductToCart } = require('../utils/fileHandler');

// Ruta POST para crear un nuevo carrito
router.post('/', async (req, res) => {
    const cart = await addCart();
    res.status(201).json(cart);
});

// Ruta GET para obtener los productos de un carrito por ID
router.get('/:cid', async (req, res) => {
    const cart = await getCartById(req.params.cid);
    if (cart) {
        res.json(cart.products);
    } else {
        res.status(404).json({ error: "Carrito no encontrado" });
    }
});

// Ruta POST para agregar un producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const result = await addProductToCart(cid, pid);
    if (result) {
        res.json(result);
    } else {
        res.status(404).json({ error: "Carrito o producto no encontrado" });
    }
});

module.exports = router;

//utils - fileHandler.js

const fs = require('fs').promises;
const path = require('path');

// Archivos JSON para persistencia
const productsFile = path.join(__dirname, '../products.json');
const cartsFile = path.join(__dirname, '../carts.json');

// Leer archivo JSON
const readFile = async (file) => {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Escribir archivo JSON
const writeFile = async (file, data) => {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
};

// Funciones para manejar productos
const getProducts = async () => await readFile(productsFile);
const getProductById = async (id) => {
    const products = await getProducts();
    return products.find(p => p.id === id);
};
const addProduct = async (product) => {
    const products = await getProducts();
    product.id = products.length + 1;
    products.push(product);
    await writeFile(productsFile, products);
    return product;
};
const updateProduct = async (id, productData) => {
    const products = await getProducts();
    const index = products.findIndex(p => p.id == id);
    if (index !== -1) {
        products[index] = { ...products[index], ...productData, id: products[index].id };
        await writeFile(productsFile, products);
        return products[index];
    }
    return null;
};
const deleteProduct = async (id) => {
    const products = await getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    await writeFile(productsFile, filteredProducts);
    return filteredProducts.length !== products.length;
};

// Funciones para manejar carritos
const getCarts = async () => await readFile(cartsFile);
const getCartById = async (id) => {
    const carts = await getCarts();
    return carts.find(c => c.id === id);
};
const addCart = async () => {
    const carts = await getCarts();
    const newCart = { id: carts.length + 1, products: [] };
    carts.push(newCart);
    await writeFile(cartsFile, carts);
    return newCart;
};
const addProductToCart = async (cid, pid) => {
    const carts = await getCarts();
    const cart = carts.find(c => c.id == cid);
    if (!cart) return null;

    const existingProduct = cart.products.find(p => p.product == pid);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.products.push({ product: pid, quantity: 1 });
    }

    await writeFile(cartsFile, carts);
    return cart;
};

module.exports = {
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getCarts,
    getCartById,
    addCart,
    addProductToCart
};

