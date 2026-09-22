export const formatPrice = (n) => `Rs. ${Number(n || 0).toLocaleString('en-US')}`;

export const formatDate = (value, withTime = false) => {
  if (!value) return '-';
  const d = new Date(value);
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

export const ANIMAL_ICON = { dogs: 'dog', cats: 'cat', birds: 'bird', rabbits: 'rabbit', fish: 'fish', 'small-pets': 'hamster' };
export const ANIMAL_LABEL = { dogs: 'Dogs', cats: 'Cats', birds: 'Birds', rabbits: 'Rabbits', fish: 'Fish', 'small-pets': 'Small Pets' };
export const ANIMAL_SINGULAR = { dogs: 'Dog', cats: 'Cat', birds: 'Bird', rabbits: 'Rabbit', fish: 'Fish', 'small-pets': 'Small pet' };
export const CATEGORY_LABEL = { food: 'Food', treats: 'Treats', grooming: 'Grooming', accessories: 'Accessories', toys: 'Toys' };

export const imageOf = (product, index = 0) => (product && product.images && product.images[index]) || '/assets/images/placeholder.svg';

export const orderStatusTone = { Processing: 'amber', Shipped: 'blue', Delivered: 'green', Cancelled: 'red' };

export const stockLabel = (status) => ({ in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' }[status] || 'In Stock');
export const stockTone = (status) => ({ in_stock: 'green', low_stock: 'amber', out_of_stock: 'red' }[status] || 'green');

export const toSlugLabel = (slug = '') => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
