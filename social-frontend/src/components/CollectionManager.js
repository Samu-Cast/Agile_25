import React, { useState, useEffect } from 'react';
import '../styles/components/CollectionManager.css';

const CollectionManager = ({ roasterId, currentUser, products, onClose, onSave, initialData = null }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [selectedProducts, setSelectedProducts] = useState(initialData?.products || []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const collectionData = {
            name,
            description,
            products: selectedProducts,
            uid: currentUser.uid
        };
        onSave(collectionData);
    };

    const toggleProduct = (productId) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    return (
        <div className="collection-manager-overlay">
            <div className="collection-manager-modal">
                <h2>{initialData ? 'Modifica Collezione' : 'Nuova Collezione'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome Collezione</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Es. Caffè Estivi"
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrizione</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrivi la tua collezione..."
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Seleziona Prodotti</label>
                        <div className="products-selection-list">
                            {products.length === 0 ? (
                                <p className="no-products">Nessun prodotto disponibile. Aggiungi prima dei prodotti.</p>
                            ) : (
                                products.map(product => (
                                    <div
                                        key={product.id}
                                        className={`product-select-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                                        onClick={() => toggleProduct(product.id)}
                                    >
                                        <div className="checkbox-indicator">
                                            {selectedProducts.includes(product.id) && '✓'}
                                        </div>
                                        {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
                                        <div className="product-info">
                                            <span className="product-name">{product.name}</span>
                                            <span className="product-price">€{product.price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
                        <button type="submit" className="btn-primary">Salva</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CollectionManager;
