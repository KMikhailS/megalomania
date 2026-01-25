import {useState, useEffect, useMemo} from 'react'
import {ProductCard, Cart, Favorites, Profile, BottomNavigation, ProductGrid} from './components'
import type {Product} from './components'
import {fetchGoods} from './api/client'
import type {GoodDTO, ImageDTO} from './api/client'

function App() {
    const [products, setProducts] = useState<Product[]>([])
    const [activeCategory, setActiveCategory] = useState('Все')
    const [activeTab, setActiveTab] = useState('home')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Уникальные категории из загруженных товаров
    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(
            products.map(p => p.category).filter((c): c is string => Boolean(c))
        )]
        return ['Все', ...uniqueCategories]
    }, [products])

    // Фильтрация товаров по категории
    const filteredProducts = useMemo(() => {
        if (activeCategory === 'Все') return products
        return products.filter(p => p.category === activeCategory)
    }, [products, activeCategory])

    // Загрузка товаров с бэкенда
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const goods = await fetchGoods()
                const mappedProducts: Product[] = goods.map((good: GoodDTO) => {
                    const sortedImages = (good.images || [])
                        .sort((a: ImageDTO, b: ImageDTO) => a.display_order - b.display_order)
                        .map((img: ImageDTO) => img.image_url)

                    return {
                        id: good.id,
                        image: sortedImages[0] || '/images/menu.svg',
                        images: sortedImages,
                        name: good.name,
                        price: `${good.price.toLocaleString('ru-RU')} ₽`,
                        non_discount_price: good.non_discount_price
                            ? `${good.non_discount_price.toLocaleString('ru-RU')} ₽`
                            : undefined,
                        description: good.description,
                        category: good.category,
                        status: good.status,
                    }
                })
                setProducts(mappedProducts)
            } catch (error) {
                console.error('Failed to fetch goods:', error)
            }
        }
        loadProducts()
    }, [])

    // Показываем корзину
    if (activeTab === 'cart') {
        return (
            <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
                <Cart
                    onCheckout={() => console.log('Оформление заказа')}
                />
                <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab}/>
            </div>
        )
    }

    // Показываем избранное
    if (activeTab === 'favorites') {
        return (
            <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
                <Favorites
                    onAddToCart={(item) => console.log('Добавлено в корзину:', item.name)}
                    onNotify={(item) => console.log('Оповещение для:', item.name)}
                    onRemove={(item) => console.log('Удалено из избранного:', item.name)}
                />
                <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab}/>
            </div>
        )
    }

    // Показываем профиль
    if (activeTab === 'profile') {
        return (
            <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
                <Profile
                    onLogout={() => console.log('Выход из аккаунта')}
                />
                <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab}/>
            </div>
        )
    }

    // Показываем карточку товара, если товар выбран
    if (selectedProduct) {
        return (
            <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
                <ProductCard
                    name={selectedProduct.name}
                    price={selectedProduct.price}
                    onBack={() => setSelectedProduct(null)}
                    onAddToCart={() => {
                        console.log('Добавлено в корзину:', selectedProduct.name)
                    }}
                    onSaveForLater={() => {
                        console.log('Отложено:', selectedProduct.name)
                    }}
                />
                <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab}/>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-4 bg-white">
                <div className="w-8"/>
                <h1 className="text-xl font-semibold tracking-wide">MEGALOMANIA</h1>
                <button className="p-2 rounded-lg bg-gray-100">
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                        <line x1="0" y1="1" x2="20" y2="1" stroke="#898989" strokeWidth="2"/>
                        <line x1="0" y1="7" x2="20" y2="7" stroke="#898989" strokeWidth="2"/>
                        <line x1="0" y1="13" x2="20" y2="13" stroke="#898989" strokeWidth="2"/>
                    </svg>
                </button>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto pb-20">
                {/* Search */}
                <div className="px-4 mb-4">
                    <div className="flex items-center gap-3 px-4 py-3 border border-gray-400 rounded-lg">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="6.5" cy="6.5" r="5.5" stroke="#5E5E5E" strokeWidth="2"/>
                            <line x1="10.5" y1="10.5" x2="15" y2="15" stroke="#5E5E5E" strokeWidth="2"/>
                        </svg>
                        <span className="text-gray-500 text-base">Поиск</span>
                    </div>
                </div>

                {/* Banner */}
                <div className="relative mb-4">
                    <img
                        src="/images/menu.svg"
                        alt="Новая коллекция"
                        className="w-full h-[180px] object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button className="absolute left-2 text-gray-300">
                            <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
                                <path d="M11 1L2 10.5L11 20" stroke="#C7C7C7" strokeWidth="2"/>
                            </svg>
                        </button>
                        <h2 className="text-green-500 font-extrabold text-lg tracking-wider">
                            Н О В А Я К О Л Л Е К Ц И Я
                        </h2>
                        <button className="absolute right-2 text-gray-300">
                            <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
                                <path d="M1 1L10 10.5L1 20" stroke="#C7C7C7" strokeWidth="2"/>
                            </svg>
                        </button>
                    </div>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-white border border-white"/>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 border border-white"/>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 border border-white"/>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 px-4 mb-6 overflow-x-auto">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-xs tracking-wide whitespace-nowrap shadow ${
                                activeCategory === category
                                    ? 'bg-black text-white'
                                    : 'bg-gray-300 text-black'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <ProductGrid
                    products={filteredProducts}
                    onProductClick={setSelectedProduct}
                    onFavorite={(product) => console.log('Добавлено в избранное:', product.name)}
                />
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab}/>
        </div>
    )
}

export default App
