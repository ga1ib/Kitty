import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type FieldValues, type Path, type UseFormRegister } from 'react-hook-form'
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Heart, Menu, PawPrint, Search, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles, Star, X, Moon, Sun } from 'lucide-react'
import { categories, imageUrl, products, type Product } from './data'
import { getCategories, getProducts } from './api/catalog'
import { getCurrentUser, login, logout, register, type AccountRole, type AccountUser, type RegisterInput } from './api/auth'
import { loginSchema, signupSchema, type SignupValues } from './schemas/auth'
import AdminConsole from './features/AdminConsole'
import { BuyerDashboard, SellerDashboard } from './features/WorkspaceDashboards'
import { buyerApi } from './api/workspaces'
import { sendContactMessage, subscribeToNewsletter } from './api/footer'

const dashboardPath = (role: AccountRole) => role === 'ADMIN' ? '/admin/dashboard' : role === 'SELLER' ? '/seller/dashboard' : '/account'
const loadGuestCart = (): Product[] => { try { const value: unknown = JSON.parse(localStorage.getItem('kitty-guest-cart') ?? '[]'); return Array.isArray(value) ? value as Product[] : [] } catch { return [] } }
const loadGuestWishlist = (): string[] => { try { const value: unknown = JSON.parse(localStorage.getItem('kitty-guest-wishlist') ?? '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] } catch { return [] } }
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('kitty-theme') as 'light' | 'dark' | null) ?? 'light')
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('kitty-theme', theme) }, [theme])
  const [cart, setCart] = useState<Product[]>(loadGuestCart)
  const [wish, setWish] = useState<string[]>(loadGuestWishlist)
  const wishRef = useRef(wish)
  wishRef.current = wish
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const cartMigration = useRef(false)
  const wishlistMigration = useRef(false)
  const guestWishlist = useRef<string[]>(wish)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user, isPending: authPending } = useQuery({ queryKey: ['auth', 'me'], queryFn: getCurrentUser, retry: false, refetchOnWindowFocus: false })
  const persistedCart = useQuery({ queryKey: ['workspace', 'BUYER', 'cart'], queryFn: buyerApi.cart, enabled: user?.role === 'BUYER', retry: false })
  const persistedWishlist = useQuery({ queryKey: ['workspace', 'BUYER', 'wishlist'], queryFn: buyerApi.wishlist, enabled: user?.role === 'BUYER', retry: false })
  useEffect(() => { if (user?.role === 'BUYER') localStorage.removeItem('kitty-guest-cart'); else localStorage.setItem('kitty-guest-cart', JSON.stringify(cart)) }, [cart, user?.role])
  useEffect(() => { if (user?.role === 'BUYER') localStorage.removeItem('kitty-guest-wishlist'); else localStorage.setItem('kitty-guest-wishlist', JSON.stringify(wish)) }, [wish, user?.role])
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (window.matchMedia('(max-width: 600px)').matches) setMobileSearch(true); searchInput.current?.focus() } }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [])
  useEffect(() => {
    if (user?.role !== 'BUYER' || !persistedCart.data || !cart.length || cartMigration.current) return
    let cancelled = false
    cartMigration.current = true
    void (async () => {
      let moved = 0
      try {
        for (const product of cart) { await buyerApi.addCart(product.id); moved += 1 }
        if (!cancelled) { setCart(current => current.slice(moved)); void queryClient.invalidateQueries({ queryKey: ['workspace', 'BUYER', 'cart'] }); toast.success('Your bag was added to your Kitty account') }
      } catch (error) {
        if (!cancelled) { setCart(current => current.slice(moved)); void queryClient.invalidateQueries({ queryKey: ['workspace', 'BUYER', 'cart'] }); toast.error(axiosMessage(error)) }
      } finally { cartMigration.current = false }
    })()
    return () => { cancelled = true }
  }, [user?.role, persistedCart.data, cart, queryClient])
  useEffect(() => {
    if (user?.role !== 'BUYER' || !persistedWishlist.data || wishlistMigration.current) return
    const savedIds = persistedWishlist.data.map(entry => { const p = entry.productId as Record<string, unknown>; return String(p?.slug ?? p?._id ?? '') })
    const pendingIds = [...new Set(guestWishlist.current)].filter(id => id && !savedIds.includes(id))
    if (!pendingIds.length) { const current = [...new Set(wishRef.current)].sort(); const saved = [...new Set(savedIds)].sort(); if (current.join('|') !== saved.join('|')) setWish(savedIds); return }
    let cancelled = false
    wishlistMigration.current = true
    void (async () => {
      const completed: string[] = []
      try {
        for (const id of pendingIds) { await buyerApi.addWish(id); completed.push(id) }
        if (!cancelled) { guestWishlist.current = guestWishlist.current.filter(id => !completed.includes(id)); setWish([...new Set([...savedIds, ...completed])]); void queryClient.invalidateQueries({ queryKey: ['workspace', 'BUYER', 'wishlist'] }); toast.success('Your saved finds were added to your Kitty account') }
      } catch (error) {
        if (!cancelled) { guestWishlist.current = guestWishlist.current.filter(id => !completed.includes(id)); setWish([...new Set([...savedIds, ...completed])]); void queryClient.invalidateQueries({ queryKey: ['workspace', 'BUYER', 'wishlist'] }); toast.error(axiosMessage(error)) }
      } finally { wishlistMigration.current = false }
    })()
    return () => { cancelled = true }
  }, [persistedWishlist.data, user?.role, queryClient])
  const signOut = useMutation({ mutationFn: logout, onSuccess: () => { queryClient.setQueryData(['auth', 'me'], null); setWish([]); guestWishlist.current = []; cartMigration.current = false; wishlistMigration.current = false; toast.success('Signed out'); navigate('/') } })
  const add = (p: Product) => { if (user?.role === 'BUYER') { void buyerApi.addCart(p.id).then(() => { void queryClient.invalidateQueries({ queryKey: ['workspace', 'BUYER', 'cart'] }); toast.success(`${p.name} added to your bag`) }).catch(e => toast.error(axiosMessage(e))); return } setCart((c) => [...c, p]); toast.success(`${p.name} added to your bag`) }
  const toggleWish = (p: Product) => { const removing = wish.includes(p.id); setWish((w) => removing ? w.filter((id) => id !== p.id) : [...w, p.id]); if (user?.role === 'BUYER') { void (removing ? buyerApi.deleteWish(p.id) : buyerApi.addWish(p.id)).then(() => { void queryClient.invalidateQueries({ queryKey: ['workspace', 'BUYER', 'wishlist'] }); toast.success(removing ? 'Removed from wishlist' : 'Saved to wishlist') }).catch(e => { setWish(w => removing ? [...w, p.id] : w.filter(id => id !== p.id)); toast.error(axiosMessage(e)) }); return } guestWishlist.current = removing ? guestWishlist.current.filter(id => id !== p.id) : [...new Set([...guestWishlist.current, p.id])]; toast.success(removing ? 'Removed from wishlist' : 'Saved to wishlist') }
  const submitSearch = () => navigate(`/products${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  return <div className="app-shell">
    <div className="announcement"><PawPrint size={14} fill="currentColor" /> A little treat for you — free delivery on orders over ৳2,500 <Link to="/products?deal=true">Shop now <ArrowRight size={13} /></Link></div>
    <header className="site-header">
      <button className="icon-button mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={21} /></button>
      <Link to="/" className="brand"><span className="brand-mark"><PawPrint size={21} fill="currentColor" /></span><span>KITTY<span className="brand-dot">.</span><small>Everything your pet loves</small></span></Link>
      <nav className={menu ? 'main-nav open' : 'main-nav'} onClick={() => setMenu(false)}><Link to="/products">Shop all</Link><Link to="/products?kind=cat">For cats</Link><Link to="/products?kind=dog">For dogs</Link><Link to="/products?deal=true">Deals <span className="nav-new">NEW</span></Link><Link to="/#sellers">Our sellers</Link></nav>
      <form className={`header-search ${mobileSearch ? 'mobile-visible' : ''}`} onSubmit={e => { e.preventDefault(); submitSearch(); setMobileSearch(false) }}><Search size={17} /><input ref={searchInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find something lovely..." aria-label="Search products" /><kbd>⌘ K</kbd><button type="submit" aria-label="Search products"><ArrowRight size={16} /></button></form>
      <div className="header-actions"><button className="icon-button mobile-search-toggle" aria-label="Search products" onClick={() => { setMobileSearch(v => !v); window.setTimeout(() => searchInput.current?.focus(), 0) }}><Search size={20} /></button><button className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button><button className="icon-button" aria-label="Help" onClick={() => toast('Kitty support', { description: 'For help with Kitty, email hello@kitty.example.', action: { label: 'Email support', onClick: () => { window.location.href = 'mailto:hello@kitty.example?subject=Kitty%20support' } } })}><CircleHelp size={20} /></button><button className="icon-button" aria-label="Wishlist" onClick={() => user?.role === 'BUYER' ? navigate('/account/wishlist') : toast('Sign in to keep your wishlist across devices', { action: { label: 'Sign in', onClick: () => navigate('/login') } })}><Heart size={20} />{wish.length > 0 && <i className="count-dot" />}</button><button className="icon-button cart-trigger" aria-label="Open cart" onClick={() => user?.role === 'BUYER' ? navigate('/account/cart') : setCartOpen(true)}><ShoppingBag size={20} /><span className="count-badge">{user?.role === 'BUYER' ? (persistedCart.data?.items as Record<string, unknown>[] | undefined)?.reduce((n, item) => n + Number(item.quantity ?? 0), 0) ?? 0 : cart.length}</span></button>{user ? <><button className="profile-button" onClick={() => navigate(dashboardPath(user.role))}><span className="avatar">{user.firstName.slice(0, 1).toUpperCase()}</span><span className="profile-name">{user.firstName}</span><ChevronDown size={14} /></button><button className="signout-button" onClick={() => signOut.mutate()} disabled={signOut.isPending}>Sign out</button></> : <div className="auth-links"><Link to="/login">Log in</Link><Link to="/signup" className="signup-link">Sign up</Link></div>}</div>
    </header>
    <Routes>
      <Route path="/" element={<Home add={add} wish={wish} toggleWish={toggleWish} />} />
      <Route path="/products" element={<Shop add={add} wish={wish} toggleWish={toggleWish} />} />
      <Route path="/products/:slug" element={<ProductPage add={add} wish={wish} toggleWish={toggleWish} />} />
      <Route path="/info/:topic" element={<InformationPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/account/*" element={<RoleGate user={user} loading={authPending} role="BUYER"><BuyerDashboard user={user!} /></RoleGate>} />
      <Route path="/seller/*" element={<RoleGate user={user} loading={authPending} role="SELLER"><SellerDashboard user={user!} /></RoleGate>} />
      <Route path="/admin/*" element={<RoleGate user={user} loading={authPending} role="ADMIN"><AdminConsole user={user!} /></RoleGate>} />
      <Route path="*" element={<Home add={add} wish={wish} toggleWish={toggleWish} />} />
    </Routes>
    <Footer />
    {cartOpen && <CartDrawer cart={cart} setCart={setCart} close={() => setCartOpen(false)} checkout={() => { setCartOpen(false); toast('Sign in as a buyer to finish checkout', { action: { label: 'Sign in', onClick: () => navigate('/login?next=%2Faccount%2Fcart') } }) }} />}
  </div>
}

function RoleGate({ user, loading, role, children }: { user: AccountUser | null | undefined; loading: boolean; role: AccountRole; children: React.ReactNode }) {
  const location = useLocation()
  if (loading) return <main className="auth-loading">Loading your Kitty account…</main>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role !== role) return <Navigate to={dashboardPath(user.role)} replace />
  return children
}

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup'
  const [authParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [roleChoice, setRoleChoice] = useState<'BUYER' | 'SELLER'>('BUYER')
  const loginForm = useForm<{ email: string; password: string }>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema), defaultValues: { role: 'BUYER', firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', address: '', city: '', postalCode: '', country: '', shopName: '', shopDescription: '', businessAddress: '' } })
  const mutation = useMutation({
    mutationFn: (values: { type: 'login'; data: { email: string; password: string } } | { type: 'signup'; data: SignupValues }) => {
      if (values.type === 'login') return login(values.data)
      const { confirmPassword, ...registration } = values.data
      void confirmPassword
      return register(registration as RegisterInput)
    },
    onSuccess: (account) => { queryClient.setQueryData(['auth', 'me'], account); toast.success(signup ? 'Your Kitty account is ready' : 'Welcome back'); const next = authParams.get('next'); const prefix = account.role === 'BUYER' ? '/account' : account.role === 'SELLER' ? '/seller' : '/admin'; const destination = !signup && next && (next === prefix || next.startsWith(`${prefix}/`)) ? next : dashboardPath(account.role); navigate(destination, { replace: true }) },
    onError: (error: unknown) => { const message = axiosMessage(error); toast.error(message) },
  })
  const setAccountType = (value: 'BUYER' | 'SELLER') => { setRoleChoice(value); signupForm.setValue('role', value); signupForm.clearErrors() }
  return <main className="auth-page page-wrap">
    <section className="auth-story"><span className="auth-paw">🐾</span><span className="eyebrow">A HAPPIER KIND OF PET SHOPPING</span><h1>{signup ? <>Come on in.<br /><em>There’s room for you.</em></> : <>Lovely to see<br /><em>you again.</em></>}</h1><p>{signup ? 'Join a community of pet people who believe the little things make a big difference.' : 'Your favourites, your orders, and a few good things for your very good pet.'}</p><div className="auth-promise"><span>♡</span><div><b>Made for every kind of pet person</b><small>Shop and sell with independent stores that care.</small></div></div></section>
    <section className="auth-card"><div className="auth-heading"><span className="eyebrow">{signup ? 'LET’S GET YOU SET UP' : 'WELCOME BACK'}</span><h2>{signup ? 'Create your account' : 'Log in to KITTY'}</h2><p>{signup ? 'A few details and you’re part of the family.' : 'Your happy place for all things pet.'}</p></div>{authParams.get('googleError') && <p className="google-error" role="alert">{authParams.get('googleError')}</p>}
      {signup ? <>
        <div className="account-type"><button type="button" className={roleChoice === 'BUYER' ? 'type-selected' : ''} onClick={() => setAccountType('BUYER')}><span>🧡</span><b>I’m a pet parent</b><small>Shop for your little love</small></button><button type="button" className={roleChoice === 'SELLER' ? 'type-selected' : ''} onClick={() => setAccountType('SELLER')}><span>🏡</span><b>I have a pet shop</b><small>Sell with KITTY</small></button></div>
        <form className="auth-form" onSubmit={signupForm.handleSubmit(values => mutation.mutate({ type: 'signup', data: values }))}>
          <div className="form-pair"><Field label="First name" name="firstName" register={signupForm.register} error={signupForm.formState.errors.firstName?.message} /><Field label="Last name" name="lastName" register={signupForm.register} error={signupForm.formState.errors.lastName?.message} /></div>
          <div className="form-pair"><Field label="Email address" name="email" type="email" register={signupForm.register} error={signupForm.formState.errors.email?.message} /><Field label="Phone number" name="phone" register={signupForm.register} error={signupForm.formState.errors.phone?.message} /></div>
          {roleChoice === 'BUYER' ? <><Field label="Street address" name="address" register={signupForm.register} error={signupForm.formState.errors.address?.message} /><div className="form-pair"><Field label="City" name="city" register={signupForm.register} error={signupForm.formState.errors.city?.message} /><Field label="Postal code" name="postalCode" register={signupForm.register} error={signupForm.formState.errors.postalCode?.message} /></div><Field label="Country" name="country" register={signupForm.register} error={signupForm.formState.errors.country?.message} /></> : <><Field label="Shop name" name="shopName" register={signupForm.register} error={signupForm.formState.errors.shopName?.message} /><Field label="Business address" name="businessAddress" register={signupForm.register} error={signupForm.formState.errors.businessAddress?.message} /><div className="form-pair"><Field label="City" name="city" register={signupForm.register} error={signupForm.formState.errors.city?.message} /><Field label="Postal code" name="postalCode" register={signupForm.register} error={signupForm.formState.errors.postalCode?.message} /></div></>}
          <Field label="Password · 10 characters minimum" name="password" type="password" register={signupForm.register} error={signupForm.formState.errors.password?.message} />
          <Field label="Confirm password" name="confirmPassword" type="password" register={signupForm.register} error={signupForm.formState.errors.confirmPassword?.message} />
          {roleChoice === 'SELLER' && <p className="seller-review-note">Seller shops start as pending. You can sign in while Kitty reviews your shop.</p>}
          <button className="button button-dark auth-submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creating your account…' : 'Create account'} <ArrowRight size={16} /></button>
          {roleChoice === 'BUYER' && <><GoogleButton mode="signup" /><small className="google-account-note">Google sign-up creates a buyer account. Seller shops use the shop application above.</small></>}
        </form>
      </> : <form className="auth-form login-form" onSubmit={loginForm.handleSubmit(values => mutation.mutate({ type: 'login', data: values }))}>
        <Field label="Email address" name="email" type="email" register={loginForm.register} error={loginForm.formState.errors.email?.message} /><Field label="Password" name="password" type="password" register={loginForm.register} error={loginForm.formState.errors.password?.message} />
        <div className="login-help"><span>For account help, contact Kitty support.</span></div><button className="button button-dark auth-submit" disabled={mutation.isPending}>{mutation.isPending ? 'Signing you in…' : 'Log in'} <ArrowRight size={16} /></button><GoogleButton mode="login" /><p className="admin-note">Admin accounts are provisioned by the platform owner. Sign in with your configured admin email and password.</p>
      </form>}
      <div className="auth-switch">{signup ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New to Kitty? <Link to="/signup">Create an account</Link></>}</div>
    </section>
  </main>
}

function GoogleButton({ mode }: { mode: 'login' | 'signup' }) { return <a className="google-auth-button" href={`${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:4000/api/v1`}/auth/google`}><span className="google-g">G</span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</a> }

function Field<T extends FieldValues>({ label, name, register, error, type = 'text' }: { label: string; name: Path<T>; register: UseFormRegister<T>; error?: string; type?: string }) {
  return <label className="form-field"><span>{label}</span><input type={type} autoComplete={name === 'password' ? 'new-password' : name === 'email' ? 'email' : 'on'} {...register(name)} aria-invalid={Boolean(error)} />{error && <small role="alert">{error}</small>}</label>
}

function axiosMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) return response.data.message
  }
  return 'We couldn’t connect. Check your connection and try again.'
}

function Home({ add, wish, toggleWish }: { add: (p: Product) => void; wish: string[]; toggleWish: (p: Product) => void }) {
  const { data: liveProducts } = useQuery({ queryKey: ['products', 'home'], queryFn: getProducts, retry: false })
  const { data: liveCategories } = useQuery({ queryKey: ['categories'], queryFn: getCategories, retry: false })
  const catalogProducts = liveProducts?.length ? liveProducts : products
  const categoryCards = liveCategories?.length ? liveCategories.slice(0, 5).map((c, i) => ({ name: c.name, key: c.slug, emoji: ['🥣', '🧶', '🛏️', '🦮', '🫧'][i % 5], tint: ['peach', 'lavender', 'mint', 'butter', 'blue'][i % 5] })) : categories
  return <main>
    <section className="hero page-wrap"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> A happier kind of pet shopping</div><h1>Little things.<br /><em>Big tail wags.</em></h1><p>Thoughtful finds for the furry love of your life. Handpicked from independent pet shops who care as much as you do.</p><div className="hero-buttons"><Link to="/products" className="button button-dark">Find their new favourite <ArrowRight size={17} /></Link><a className="text-link" href="#categories">Explore categories <ArrowDown size={15} /></a></div><div className="hero-proof"><div className="proof-avatars"><span>🐱</span><span>🐶</span><span>🐰</span></div><div><strong>Loved by 12,000+ pet parents</strong><small>★★★★★ <span>4.9 / 5 community rating</span></small></div></div></div><div className="hero-art"><div className="hero-blob"></div><div className="hero-tag"><Sparkles size={16} /><span>Good things<br />for good pets</span></div><img src={imageUrl('photo-1514888286974-6c03e2ca1dba', 900)} alt="Curious ginger cat enjoying a sunny day" /><div className="floating-note"><span>🐾</span><div><b>Made with love</b><small>For every kind of pet</small></div></div><div className="hero-scribble">✳</div></div><div className="hero-index">01 <span>— 03</span></div></section>
    <div className="trust-strip"><div><span>✦</span> Small shops, big hearts</div><i /><div><span>♧</span> Carefully chosen essentials</div><i /><div><span>♡</span> A little joy in every parcel</div><i /><div><span>↗</span> Delivery across Bangladesh</div></div>
    <section id="categories" className="section page-wrap"><div className="section-head"><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>What are we shopping for?</h2><p>All the little things that make their day.</p></div><Link className="under-link" to="/products">All categories <ArrowRight size={16} /></Link></div><div className="category-grid">{categoryCards.map((c, i) => <Link to={`/products?category=${encodeURIComponent(c.key)}`} className={`category-card ${c.tint}`} key={c.name}><div className="category-emoji">{c.emoji}</div><div><b>{c.name}</b><span>{[32, 18, 24, 16, 21][i]} lovely finds</span></div><ArrowUpRight size={17} className="category-arrow" /></Link>)}</div></section>
    <section className="section products-section"><div className="page-wrap"><div className="section-head"><div><span className="eyebrow">THE CROWD FAVOURITES</span><h2>A little something special</h2><p>Things pets love. Picked by the people who know them best.</p></div><Link className="under-link" to="/products">See everything <ArrowRight size={16} /></Link></div><ProductGrid items={catalogProducts.slice(0, 4)} add={add} wish={wish} toggleWish={toggleWish} /></div></section>
    <section className="feature-band page-wrap"><div className="feature-image"><img src={imageUrl('photo-1552053831-71594a27632d', 700)} alt="Happy golden retriever sitting outdoors" /><div className="image-sticker">✿<span>Very good<br />pets club</span></div></div><div className="feature-copy"><span className="eyebrow">MEET YOUR NEW FAVOURITE SHOPS</span><h2>Good pets.<br />Good people.<br /><em>Good finds.</em></h2><p>We bring the neighbourhood pet shop feeling to your doorstep. Meet the independent makers and pet people behind every little thing.</p><Link to="/#sellers" className="button button-outline">Meet our sellers <ArrowRight size={16} /></Link><div className="seller-count"><span>🐾</span> <strong>38 independent shops</strong> and counting</div></div></section>
    <section id="sellers" className="seller-spotlight page-wrap"><div><span className="eyebrow">A NOTE FROM US</span><h2>Better days, one<br />happy little tail at a time.</h2><p>Every order helps an independent shop do what they love: make pets feel right at home.</p></div><Link to="/signup" className="seller-apply">Have a pet shop?<b>Come sell with us <ArrowUpRight size={18} /></b></Link></section>
  </main>
}

function ProductGrid({ items, add, wish, toggleWish }: { items: Product[]; add: (p: Product) => void; wish: string[]; toggleWish: (p: Product) => void }) { return <div className="product-grid">{items.map((p, i) => <motion.article className="product-card" key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .045 }}><Link to={`/products/${p.id}`} className="product-image"><img src={imageUrl(p.image)} alt={p.name} />{p.badge && <span className={p.oldPrice ? 'product-badge sale' : 'product-badge'}>{p.badge}</span>}<button className={wish.includes(p.id) ? 'heart-button active' : 'heart-button'} aria-label="Save to wishlist" onClick={(e) => { e.preventDefault(); toggleWish(p) }}><Heart size={17} fill={wish.includes(p.id) ? 'currentColor' : 'none'} /></button><button className="quick-add" onClick={(e) => { e.preventDefault(); add(p) }}><ShoppingBag size={16} /> Quick add</button></Link><div className="product-info"><div className="product-brand">{p.brand}</div><Link to={`/products/${p.id}`} className="product-name">{p.name}</Link><div className="product-rating"><Star size={13} fill="currentColor" /> {p.rating} <span>({p.reviews})</span></div><div className="product-bottom"><div><strong>৳{p.price.toLocaleString()}</strong>{p.oldPrice && <del>৳{p.oldPrice.toLocaleString()}</del>}</div><button aria-label={`Add ${p.name} to bag`} className="small-add" onClick={() => add(p)}><ShoppingCart size={16} /></button></div><div className="product-seller">Sold by <span>{p.seller}</span></div></div></motion.article>)}</div> }

function Shop({ add, wish, toggleWish }: { add: (p: Product) => void; wish: string[]; toggleWish: (p: Product) => void }) {
  const [params, setParams] = useSearchParams(); const [active, setActive] = useState(params.get('category') || 'All'); const [kind, setKind] = useState(params.get('kind') || 'all'); const [sort, setSort] = useState('Featured'); const [filters, setFilters] = useState(false); const q = params.get('q')?.toLowerCase() || ''
  useEffect(() => { setActive(params.get('category') || 'All'); setKind(params.get('kind') || 'all') }, [params])
  const { data: liveProducts } = useQuery({ queryKey: ['products', 'shop'], queryFn: getProducts, retry: false })
  const { data: liveCategories } = useQuery({ queryKey: ['categories'], queryFn: getCategories, retry: false })
  const sourceProducts = liveProducts?.length ? liveProducts : products
  const categoryOptions = liveCategories?.length ? liveCategories.map(c => ({ key: c.slug, name: c.name })) : Array.from(new Set(products.map(p => p.category))).map(name => ({ key: name, name }))
  const activeName = liveCategories?.find(c => c.slug === active)?.name || active
  const shown = useMemo(() => sourceProducts.filter(p => (active === 'All' || p.category === activeName) && (kind === 'all' || p.kind === kind || p.kind === 'both') && (!q || `${p.name} ${p.brand} ${p.category} ${p.seller}`.toLowerCase().includes(q)) && (params.get('deal') !== 'true' || p.oldPrice)).sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : sort === 'Top rated' ? b.rating - a.rating : 0), [sourceProducts, active, activeName, kind, q, sort, params])
  return <main className="page-wrap shop-page"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>Shop all</span></div><div className="shop-title"><div><span className="eyebrow">A VERY GOOD CHOICE</span><h1>{q ? `Looking for “${params.get('q')}”` : active === 'All' ? 'The good stuff' : activeName}</h1><p>Good things for very good pets, from shops with very big hearts.</p></div><div className="shop-result-count">{shown.length} lovely finds</div></div><div className="shop-toolbar"><div className="category-pills">{[{ key: 'All', name: 'All' }, ...categoryOptions].map(c => <button key={c.key} className={active === c.key ? 'pill-active' : ''} onClick={() => { const next = new URLSearchParams(params); if (c.key === 'All') next.delete('category'); else next.set('category', c.key); setParams(next) }}>{c.name}</button>)}</div><div className="sort-controls"><button className="filter-button" onClick={() => setFilters(!filters)}><SlidersHorizontal size={16} /> Filters</button><label>Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option>Featured</option><option>Price: low to high</option><option>Top rated</option></select></label></div></div>{filters && <div className="filter-panel"><b>Shop for</b><button onClick={() => setKind('all')} className={kind === 'all' ? 'filter-selected' : ''}>All pets</button><button onClick={() => setKind('cat')} className={kind === 'cat' ? 'filter-selected' : ''}>Cats</button><button onClick={() => setKind('dog')} className={kind === 'dog' ? 'filter-selected' : ''}>Dogs</button><span>Under ৳2,000 <input type="checkbox" /></span><span>4★ & up <input type="checkbox" /></span></div>}<ProductGrid items={shown} add={add} wish={wish} toggleWish={toggleWish} />{shown.length === 0 && <div className="empty-state">No finds just yet. Try another search or category.</div>}<div className="pagination"><button aria-label="Previous page"><ChevronLeft size={17} /></button><button className="current-page">1</button><button>2</button><button>3</button><span>…</span><button>8</button><button aria-label="Next page"><ChevronRight size={17} /></button><small>Showing {shown.length} of 148 finds</small></div></main>
}

function ProductPage({ add, wish, toggleWish }: { add: (p: Product) => void; wish: string[]; toggleWish: (p: Product) => void }) { const { slug } = useParams(); const { data: liveProducts } = useQuery({ queryKey: ['products', 'shop'], queryFn: getProducts, retry: false }); const source = liveProducts?.length ? liveProducts : products; const p = source.find(x => x.id === slug) || products.find(x => x.id === slug) || source[0] || products[0]; const [qty, setQty] = useState(1); return <main className="page-wrap detail-page"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><Link to="/products">Shop</Link><ChevronRight size={14} /><span>{p.name}</span></div><div className="detail-layout"><div className="detail-photo"><img src={imageUrl(p.image, 1000)} alt={p.name} /><span className="product-badge">{p.badge || 'Thoughtfully picked'}</span></div><div className="detail-copy"><span className="eyebrow">{p.category.toUpperCase()} · {p.brand.toUpperCase()}</span><h1>{p.name}</h1><div className="detail-rating"><span>★★★★★</span> {p.rating} <a href="#reviews">({p.reviews} happy reviews)</a></div><div className="detail-price">৳{p.price.toLocaleString()} {p.oldPrice && <del>৳{p.oldPrice.toLocaleString()}</del>}</div><p>A little everyday goodness, thoughtfully made for your very good pet. Picked with care by people who know what happy tails are made of.</p><div className="stock-note"><i /> In stock and ready for a new home</div><div className="detail-seller"><div className="seller-avatar">🐾</div><div><small>SOLD WITH LOVE BY</small><b>{p.seller}</b></div><button>Visit shop <ArrowUpRight size={14} /></button></div><div className="purchase-row"><div className="quantity"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div><button className="button button-dark add-wide" onClick={() => { for (let i = 0; i < qty; i++)add(p) }}><ShoppingBag size={18} /> Add to bag · ৳{(p.price * qty).toLocaleString()}</button><button className={wish.includes(p.id) ? 'icon-button saved' : 'icon-button'} onClick={() => toggleWish(p)} aria-label="Wishlist"><Heart size={20} fill={wish.includes(p.id) ? 'currentColor' : 'none'} /></button></div><div className="detail-perks"><span>♧ Thoughtfully selected</span><span>↗ Delivery in 2–4 days</span><span>♡ 7-day easy returns</span></div></div></div><div className="detail-extra" id="reviews"><div><h3>A little more about it</h3><p>Made for everyday moments, with ingredients and materials selected for quality and comfort. From an independent shop that cares about the small details.</p></div><div><h3>What pet parents say</h3><p>★★★★★ &nbsp; “Our little one absolutely loves it. Arrived beautifully packed, too!”</p><small>Verified pet parent · 2 weeks ago</small></div></div><section className="section"><div className="section-head"><div><span className="eyebrow">MORE TO MAKE THEM HAPPY</span><h2>You might also love</h2></div><Link className="under-link" to="/products">See all <ArrowRight size={16} /></Link></div><ProductGrid items={source.filter(x => x.id !== p.id).slice(0, 4)} add={add} wish={wish} toggleWish={toggleWish} /></section></main> }

function CartDrawer({ cart, setCart, close, checkout }: { cart: Product[]; setCart: (c: Product[]) => void; close: () => void; checkout: () => void }) { const items = cart; const subtotal = items.reduce((n, p) => n + p.price, 0); return <div className="drawer-backdrop" onClick={close}><aside className="cart-drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><h2>Your little bag <span>({items.length})</span></h2><p>Good things for very good pets.</p></div><button className="icon-button" onClick={close} aria-label="Close"><X /></button></div>{items.length ? <><div className="drawer-items">{items.map((p, i) => <div className="drawer-item" key={`${p.id}-${i}`}><img src={imageUrl(p.image, 180)} alt={p.name} /><div><small>{p.brand}</small><b>{p.name}</b><span>৳{p.price.toLocaleString()}</span></div><button aria-label={`Remove ${p.name}`} onClick={() => setCart(cart.filter((_, j) => j !== i))}><X size={15} /></button></div>)}</div><div className="drawer-bottom"><div className="delivery-progress"><span>🚚</span> You’re <b>৳{Math.max(0, 2500 - subtotal).toLocaleString()}</b> away from free delivery<div><i style={{ width: `${Math.min(100, subtotal / 2500 * 100)}%` }} /></div></div><div className="subtotal"><span>Subtotal</span><b>৳{subtotal.toLocaleString()}</b></div><small className="tax-note">Delivery calculated at checkout</small><button className="button button-dark checkout-button" onClick={checkout}>Continue to secure checkout <ArrowRight size={17} /></button></div></> : <div className="cart-empty"><span>🧺</span><h3>Nothing in your bag just yet</h3><p>Let’s find something to make their day.</p><button className="button button-dark" onClick={close}>Find a favourite <ArrowRight size={15} /></button></div>}</aside></div> }

function Footer() {
  const newsletterForm = useRef<HTMLFormElement>(null)
  const mutation = useMutation({ mutationFn: subscribeToNewsletter, onSuccess: result => { toast.success(result.alreadySubscribed ? 'This email is already on the Kitty list' : 'You’re on the Kitty newsletter list'); newsletterForm.current?.reset() }, onError: error => toast.error(axiosMessage(error)) })
  return <footer className="footer"><div className="page-wrap"><div className="footer-main">
    <div className="footer-brand"><Link to="/" className="brand"><span className="brand-mark"><PawPrint size={20} fill="currentColor" /></span><span>KITTY<span className="brand-dot">.</span><small>Everything your pet loves</small></span></Link><p>A happier kind of pet shopping.<br />For the ones who make a house a home.</p><div className="socials" aria-label="Social platforms"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">ig</a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok">tk</a></div></div>
    <div className="footer-col"><b>Come on in</b><Link to="/products">Shop all</Link><Link to="/products?kind=cat">For cats</Link><Link to="/products?kind=dog">For dogs</Link><Link to="/#sellers">Our sellers</Link></div>
    <div className="footer-col"><b>The little things</b><Link to="/info/about">Our story</Link><Link to="/info/contact">Get in touch</Link><Link to="/info/faq">FAQs</Link><Link to="/info/shipping">Shipping & returns</Link></div>
    <div className="newsletter"><b>A little love in your inbox</b><p>New finds, happy tails, and the occasional treat. No spam, promise.</p><form ref={newsletterForm} onSubmit={event => { event.preventDefault(); const email = String(new FormData(event.currentTarget).get('email') ?? '').trim(); if (email) mutation.mutate(email) }}><input name="email" placeholder="Your email address" type="email" autoComplete="email" aria-label="Your email address" required /><button aria-label="Subscribe" disabled={mutation.isPending}><ArrowRight size={17} /></button></form><small>By signing up, you agree to our <Link to="/info/privacy">Privacy Policy</Link>.</small></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} KITTY Marketplace. Made with ♡ in Bangladesh.</span><div><Link to="/info/privacy">Privacy</Link><Link to="/info/terms">Terms</Link><span>🇧🇩 &nbsp; BDT ৳</span></div></div></div></footer>
}

function InformationPage() {
  const { topic = 'about' } = useParams()
  const titles: Record<string, string> = { about: 'A happier kind of pet shopping', contact: 'Get in touch', faq: 'Frequently asked questions', shipping: 'Shipping & returns', privacy: 'Privacy policy', terms: 'Terms & conditions' }
  const title = titles[topic] ?? 'KITTY information'
  const [pending, setPending] = useState(false)
  const content: Record<string, string[]> = { about: ['KITTY brings pet parents and independent pet shops together in one friendly marketplace. Browse thoughtfully selected food, toys, accessories, grooming essentials, and more.', 'We want it to be easy to find the little things that help pets feel at home.'], shipping: ['Delivery options and fees are shown during checkout before you place an order. Delivery estimates may vary by seller and destination.', 'If an item arrives damaged or you need help with an order, contact Kitty support with your order number. Return requests for eligible delivered orders can be made from your buyer dashboard.'], privacy: ['KITTY uses account and order information to provide marketplace services, protect accounts, and support purchases. Newsletter email addresses are stored so we can manage subscriptions.', 'Contact messages and newsletter subscriptions are stored securely by the marketplace. You can contact support to request help with your information.'], terms: ['Use KITTY respectfully and provide accurate account, delivery, and listing information. Sellers are responsible for their product descriptions, inventory, and fulfillment.', 'Orders, payments, cancellations, and returns are handled according to the options and status shown in your Kitty account. Contact support if something is unclear.'] }
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setPending(true); try { await sendContactMessage({ name: String(data.get('name')), email: String(data.get('email')), subject: String(data.get('subject')), message: String(data.get('message')) }); toast.success('Message sent. Kitty support will follow up.'); form.reset() } catch (error) { toast.error(axiosMessage(error)) } finally { setPending(false) } }
  return <main className="info-page page-wrap"><Link to="/" className="info-back">← Back to shopping</Link><article className="info-card"><span className="eyebrow">KITTY · EVERYTHING YOUR PET LOVES</span><h1>{title}</h1>
    {topic === 'faq' ? <div className="info-faq"><details><summary>How do I place an order?</summary><p>Add items to your cart, enter delivery details, then review the final price and payment method at checkout.</p></details><details><summary>Can I buy from more than one shop?</summary><p>Yes. Kitty supports a single buyer order with items from multiple approved sellers.</p></details><details><summary>How can I track an order?</summary><p>Sign in and open My orders in your buyer dashboard to see order status and delivery updates.</p></details><details><summary>How do returns work?</summary><p>Eligible delivered orders have a return request option in the order details in your buyer dashboard.</p></details><details><summary>How can I sell on KITTY?</summary><p>Create a seller account. Your shop can start publishing after it is reviewed and approved.</p></details></div>
      : topic === 'contact' ? <><p>Send a message to the Kitty support team. Include your order number when asking about an existing order.</p><form className="info-contact-form" onSubmit={submit}><label>Name<input name="name" autoComplete="name" required maxLength={120} /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><label>Subject<input name="subject" required minLength={3} maxLength={160} /></label><label>Message<textarea name="message" rows={6} required minLength={10} maxLength={4000} /></label><button className="button button-dark" disabled={pending}>{pending ? 'Sending…' : 'Send message'} <ArrowRight size={16} /></button></form></>
        : <>{(content[topic] ?? ['Find products, independent sellers, and account tools for your pet in one place.']).map(paragraph => <p key={paragraph}>{paragraph}</p>)}{topic === 'about' && <Link className="button button-dark info-cta" to="/#sellers">Meet our sellers <ArrowRight size={16} /></Link>}</>}
  </article></main>
}

export default App
