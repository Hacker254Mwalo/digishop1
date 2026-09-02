"use client";

import { FormEvent, useMemo, useState } from "react";
import { BatteryCharging, CheckCircle2, Cpu, HardDrive, Laptop, Minus, PackageCheck, Plus, ShoppingBag, Smartphone, X } from "lucide-react";
import { formatKes, getWhatsAppUrl, products, type Product } from "@/lib/site";

type CartLine = Product & { quantity: number };
const categories = ["All", "Phone screens", "Charging ports", "Batteries", "Laptop spares"];

function ProductIcon({ category, name }: { category: string; name: string }) {
  if (category === "Phone screens") return <Smartphone size={35} strokeWidth={1.5} />;
  if (category === "Charging ports") return <Cpu size={35} strokeWidth={1.5} />;
  if (category === "Batteries") return <BatteryCharging size={35} strokeWidth={1.5} />;
  if (name.toLowerCase().includes("ssd")) return <HardDrive size={35} strokeWidth={1.5} />;
  if (category === "Laptop spares") return <Laptop size={35} strokeWidth={1.5} />;
  return <PackageCheck size={35} strokeWidth={1.5} />;
}

export default function ShopPage() {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", location: "" });
  const visibleProducts = useMemo(() => category === "All" ? products : products.filter((product) => product.category === category), [category]);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(product: Product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setDrawerOpen(true);
  }

  function adjust(productId: string, amount: number) {
    setCart((current) => current.map((item) => item.id === productId ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer.name.trim() || !customer.phone.trim() || !customer.location.trim()) return;
    const lines = cart.map((item) => `• ${item.name} × ${item.quantity} — ${formatKes(item.price * item.quantity)}`).join("\n");
    const message = `Hello Digital Electronics, I would like to place a spares order.\n\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nDelivery / collection location: ${customer.location}\n\nOrder:\n${lines}\n\nEstimated total: ${formatKes(total)}\n\nPlease confirm compatibility, availability and fulfillment.`;
    window.localStorage.setItem("de-last-order", JSON.stringify({ ...customer, cart, total, createdAt: new Date().toISOString() }));
    setSubmitted(true);
    window.setTimeout(() => { window.location.href = getWhatsAppUrl(message); }, 650);
  }

  return (
    <>
      <section className="page-hero page-hero-blueprint"><div className="container page-hero-inner"><div className="page-hero-copy"><div className="eyebrow">Parts library / phone + laptop</div><h1>Keep the device moving.</h1><p>Browse common phone screens, charging parts, batteries and laptop spares. Build an order, then confirm model compatibility and fulfillment with the team.</p></div><div className="page-hero-meta"><div className="meta-card"><ShoppingBag size={20} color="#155eef" /><strong>Selection before checkout</strong><span>There is no blind payment step. We confirm the right part, current availability and delivery or collection details directly.</span></div></div></div></section>
      <section className="section shop-section"><div className="container"><div className="catalog-intro"><div><div className="eyebrow">The catalog</div><h2>Parts with a clear next step.</h2></div><p>Use the catalog as a starting point. If you are not certain about a model, add the closest match and ask the team to verify it before fulfillment.</p></div><div className="shop-toolbar"><div className="category-tabs" aria-label="Product categories">{categories.map((item) => <button key={item} type="button" className={`category-tab ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div><button className="button button-dark cart-button" type="button" onClick={() => setDrawerOpen(true)}><ShoppingBag size={15} /> Order list{totalItems > 0 && <span className="cart-count">{totalItems}</span>}</button></div><div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.id}><div className={`product-visual tone-${product.tone}`}><span className="product-tag">{product.tag}</span><ProductIcon category={product.category} name={product.name} /></div><div className="product-body"><div className="product-category">{product.category}</div><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><span className="price">{formatKes(product.price)}</span><button className="button button-primary button-small" type="button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to order list`}><Plus size={13} /> Add</button></div></div></article>)}</div></div></section>
      <div className={`drawer-backdrop ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside className={`cart-drawer ${drawerOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Spares order list" aria-hidden={!drawerOpen}><div className="drawer-header"><h2>Order list <span style={{ color: "#8290a5", fontSize: ".8rem", fontWeight: 500 }}>({totalItems})</span></h2><button className="icon-button" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close order list"><X size={18} /></button></div>{submitted ? <div className="drawer-body"><div className="success-card"><CheckCircle2 size={21} color="#159d69" /><h3>Order brief prepared</h3><p style={{ fontSize: ".78rem", color: "#477563" }}>Your WhatsApp message is opening with the selected parts. The team will confirm compatibility and fulfillment.</p></div></div> : <>{cart.length === 0 ? <div className="drawer-body"><div className="empty-cart"><ShoppingBag size={36} /><h3>Your order list is empty</h3><p>Add a part from the catalog to create a fulfillment brief.</p></div></div> : <><div className="drawer-body"><div className="cart-list">{cart.map((item) => <div className="cart-item" key={item.id}><div><strong>{item.name}</strong><small>{formatKes(item.price)} each</small></div><div className="cart-item-right"><span className="price">{formatKes(item.price * item.quantity)}</span><div className="quantity-control"><button type="button" onClick={() => adjust(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus size={12} /></button><span>{item.quantity}</span><button type="button" onClick={() => adjust(item.id, 1)} aria-label={`Add one ${item.name}`}><Plus size={12} /></button></div></div></div>)}</div>{checkoutOpen && <form className="checkout-form" onSubmit={submitOrder} style={{ marginTop: 28 }}><div className="eyebrow">Fulfillment details</div><div className="field"><label htmlFor="order-name">Your name</label><input id="order-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Your name" autoComplete="name" required /></div><div className="field"><label htmlFor="order-phone">Phone number</label><input id="order-phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="07xx xxx xxx" inputMode="tel" autoComplete="tel" required /></div><div className="field"><label htmlFor="order-location">Delivery or collection</label><input id="order-location" value={customer.location} onChange={(e) => setCustomer({ ...customer, location: e.target.value })} placeholder="e.g. Siaya town / collect at shop" required /></div><button className="button button-primary" type="submit">Send order brief <ShoppingBag size={15} /></button></form>}</div><div className="drawer-footer"><div className="total-line"><span>Estimated total</span><strong>{formatKes(total)}</strong></div>{!checkoutOpen && <button className="button button-primary" type="button" onClick={() => setCheckoutOpen(true)}>Continue to fulfillment <Plus size={15} /></button>}</div></>}</>}</aside>
    </>
  );
}
