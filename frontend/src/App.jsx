import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop.jsx';
import { RequireAdmin, RequireAuth } from './components/common/Guards.jsx';
import { PageLoader } from './components/ui/States.jsx';
import CustomerLayout from './layouts/CustomerLayout.jsx';

import Home from './pages/customer/Home.jsx';
import Shop from './pages/customer/Shop.jsx';
import ProductDetails from './pages/customer/ProductDetails.jsx';
import Cart from './pages/customer/Cart.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import OrderConfirmation from './pages/customer/OrderConfirmation.jsx';
import Orders, { OrderDetail } from './pages/customer/Orders.jsx';
import Dashboard from './pages/customer/Dashboard.jsx';
import PetProfile from './pages/customer/PetProfile.jsx';
import PawAIChat from './pages/customer/PawAIChat.jsx';
import Wishlist from './pages/customer/Wishlist.jsx';
import { Login, Register } from './pages/customer/Auth.jsx';
import InfoPage from './pages/customer/InfoPage.jsx';
import TrackOrder from './pages/customer/TrackOrder.jsx';
import Profile from './pages/customer/Profile.jsx';
import NotFound from './pages/customer/NotFound.jsx';

// The admin panel is a separate design system, so it is loaded only when needed.
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'));
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/Categories.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews.jsx'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons.jsx'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory.jsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics.jsx'));
const AdminAI = lazy(() => import('./pages/admin/AIManagement.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'));

function CategoryRedirect() {
  const { slug } = useParams();
  const animals = ['dogs', 'cats', 'birds', 'rabbits', 'fish', 'small-pets'];
  return <Navigate replace to={animals.includes(slug) ? `/shop?animal=${slug}` : `/shop?category=${slug}`} />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="category/:slug" element={<CategoryRedirect />} />
            <Route path="product/:slug" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="pawai" element={<PawAIChat />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="track-order" element={<TrackOrder />} />
            <Route path="about" element={<InfoPage page="about" />} />
            <Route path="contact" element={<InfoPage page="contact" />} />
            <Route path="shipping-policy" element={<InfoPage page="shipping" />} />
            <Route path="return-policy" element={<InfoPage page="returns" />} />
            <Route path="faqs" element={<InfoPage page="faqs" />} />
            <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="orders" element={<RequireAuth><Orders /></RequireAuth>} />
            <Route path="orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
            <Route path="pets/new" element={<RequireAuth><PetProfile /></RequireAuth>} />
            <Route path="pets/:id" element={<RequireAuth><PetProfile /></RequireAuth>} />
            <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="ai" element={<AdminAI />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
