
const test = require('node:test');
const assert = require('node:assert/strict');

function isValidProduct(product) {
    return (
        typeof product.name === 'string' &&
        product.name.trim().length > 0 &&
        Number.isFinite(product.price) &&
        product.price > 0
    );
}

test('accepte un produit valide', () => {
    const product = {
        name: 'Robe Lunora',
        price: 89
    };

    assert.equal(isValidProduct(product), true);
});

test('rejette un produit sans nom', () => {
    const product = {
        name: '',
        price: 89
    };

    assert.equal(isValidProduct(product), false);
});

test('rejette un prix négatif', () => {
    const product = {
        name: 'Robe Lunora',
        price: -10
    };

    assert.equal(isValidProduct(product), false);
});

module.exports = { isValidProduct };