import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import PetIcon, { PetTrio } from '../../components/ui/PetIcon.jsx';
import useTitle from '../../hooks/useTitle.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice } from '../../utils/format.js';

const FAQS = [
  ['How do I choose the right food for my pet?', 'Pick a formula made for your pet\'s species, age and size. Ask PawAI for a recommendation - it uses your pet\'s profile and our live product catalogue - or check the ingredients and feeding guide on each product page.'],
  ['Can I pay when the order arrives?', 'Yes. Cash on Delivery is available on every order. You can also choose online payment (card, JazzCash or Easypaisa) and you will receive payment details right after checkout.'],
  ['How long does delivery take?', 'Most orders are dispatched within 24 hours and arrive in 2-4 working days depending on your city. You can follow every order from Track Order.'],
  ['Why is a price not shown on some products?', 'Occasionally we choose not to publish a price online - for example for special-order items. Use "Contact us for price" on the product page and we will get back to you quickly.'],
  ['Can I change or cancel my order?', 'While an order is still Processing you can cancel it from My Orders. Once it has shipped, please contact us and we will do our best to help.'],
  ['Are the reviews real?', 'Reviews are written by customers. A "Verified purchase" tag means the reviewer ordered the product from PawNest.'],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {FAQS.map(([q, a], i) => (
        <div key={q} className={`faq-item ${open === i ? 'is-open' : ''}`}>
          <h3><button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon name="chevron-down" size={18} /></button></h3>
          {open === i && <p>{a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function InfoPage({ page }) {
  const { settings } = useSettings();
  const shippingLine = settings.freeShippingThreshold > 0
    ? `Delivery costs ${formatPrice(settings.shippingFee)} per order, and is free on orders of ${formatPrice(settings.freeShippingThreshold)} or more.`
    : `Delivery costs ${formatPrice(settings.shippingFee)} per order.`;

  const pages = {
    about: {
      title: 'About PawNest',
      intro: 'Better Care. Happier Pets.',
      body: (
        <>
          <p>PawNest is a pet shop built by pet parents. We bring together trusted food brands, gentle grooming and thoughtful accessories for dogs, cats, birds, rabbits, fish and small pets - all in one place.</p>
          <p>Every product is chosen for quality, and every rating and review on the site comes from real customers. Not sure what to buy? PawAI, our shopping assistant, can help you compare products in English, Urdu or Roman Urdu.</p>
          <div className="info-cards">
            <div><Icon name="gift" size={22} /><h3>Premium products</h3><p>Trusted brands like Royal Canin, Whiskas, Pedigree and more.</p></div>
            <div><Icon name="truck" size={22} /><h3>Fast delivery</h3><p>Quick dispatch and easy order tracking.</p></div>
            <div><Icon name="heart" size={22} /><h3>Made for pets</h3><p>Tips and advice tailored to each pet.</p></div>
          </div>
        </>
      ),
    },
    contact: {
      title: 'Contact us',
      intro: 'We\'re here to help with orders, products and pet-care questions.',
      body: (
        <div className="info-cards">
          {settings.contactEmail && <a className="info-card" href={`mailto:${settings.contactEmail}`}><Icon name="mail" size={22} /><h3>Email</h3><p>{settings.contactEmail}</p></a>}
          {settings.contactPhone && <a className="info-card" href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}><Icon name="phone" size={22} /><h3>Phone</h3><p>{settings.contactPhone}</p></a>}
          {settings.whatsapp && <a className="info-card" href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"><Icon name="message" size={22} /><h3>WhatsApp</h3><p>{settings.whatsapp}</p></a>}
          {settings.address && <div className="info-card"><Icon name="pin" size={22} /><h3>Address</h3><p>{settings.address}</p></div>}
          <Link className="info-card" to="/pawai"><Icon name="cpu" size={22} /><h3>Ask PawAI</h3><p>Instant answers, any time.</p></Link>
        </div>
      ),
    },
    shipping: {
      title: 'Shipping Policy',
      intro: 'Simple, tracked delivery across Pakistan.',
      body: (
        <ul className="policy">
          <li><strong>Dispatch.</strong> Orders are packed and dispatched within 24 hours (business days).</li>
          <li><strong>Delivery time.</strong> Usually 2-4 working days, depending on your city.</li>
          <li><strong>Cost.</strong> {shippingLine}</li>
          <li><strong>Tracking.</strong> Follow your order any time from <Link to="/track-order">Track Order</Link> using your order number and email.</li>
          <li><strong>Payment.</strong> Cash on Delivery and online payment (card / JazzCash / Easypaisa) are supported.</li>
        </ul>
      ),
    },
    returns: {
      title: 'Return Policy',
      intro: 'If something isn\'t right, we\'ll make it right.',
      body: (
        <ul className="policy">
          <li><strong>Damaged or wrong item.</strong> Contact us within 48 hours of delivery with your order number and a photo. We will replace it or refund you.</li>
          <li><strong>Unopened items.</strong> Unopened, unused products can be returned within 7 days of delivery.</li>
          <li><strong>Opened food.</strong> For hygiene reasons opened food and treats can&apos;t be returned, but tell us if your pet had a problem with it.</li>
          <li><strong>Refunds.</strong> Approved refunds go back to your original payment method, or as store credit if you prefer.</li>
        </ul>
      ),
    },
    faqs: { title: 'Frequently asked questions', intro: 'Quick answers to common questions.', body: <Faq /> },
  };
  const info = pages[page];
  useTitle(info.title);

  return (
    <div className="info container">
      <header className="info-head">
        <PetTrio size={30} />
        <h1>{info.title}</h1>
        <p>{info.intro}</p>
      </header>
      <div className="info-body">{info.body}</div>
      <div className="info-foot"><PetIcon name="paw" size={22} color="#f6a9cb" /> Need more help? <Link to="/contact">Contact us</Link></div>
    </div>
  );
}
