import {useState, useEffect, useMemo, useCallback} from 'react'
import {ProductCard, Cart, Favorites, Profile, BottomNavigation, ProductGrid, AdminProductCard, StoreAddresses, PromoBanner, AdminPromoBannerCard} from './components'
import type {Product} from './components'

// Интерфейс для товара в корзине
export interface CartItemData {
    product: Product
    quantity: number
    size: string
}
import {fetchGoods, fetchMyGoods, addFavorite, removeFavorite, fetchUserInfo, createGoodCard, addGoodImages, updateGoodCard, deleteGood, blockGood, activateGood, fetchAllGoods, fetchPromoBanners, fetchAllPromoBanners, createPromoBanner, deletePromoBanner, blockPromoBanner, activatePromoBanner, updatePromoBannerLink} from './api/client'
import type {GoodDTO, ImageDTO, UserInfo, PromoBannerDTO} from './api/client'
import {useTelegramWebApp} from './hooks/useTelegramWebApp'

function App() {
    const {webApp} = useTelegramWebApp()

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [activeCategory, setActiveCategory] = useState('Все')
    const [activeTab, setActiveTab] = useState('home')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isAdminCardOpen, setIsAdminCardOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [adminReturnProduct, setAdminReturnProduct] = useState<Product | null>(null)
    const [cartItems, setCartItems] = useState<CartItemData[]>([])
    const [cartReturnTo, setCartReturnTo] = useState<{tab: string; product: Product | null} | null>(null)
    const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])
    const [isStoreAddressesOpen, setIsStoreAddressesOpen] = useState(false)
    const [selectedPickupAddress, setSelectedPickupAddress] = useState('')
    const [banners, setBanners] = useState<PromoBannerDTO[]>([])
    const [editingBanner, setEditingBanner] = useState<PromoBannerDTO | null>(null)

    // Добавление товара в корзину
    const handleAddToCart = useCallback((product: Product, size: string) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(
                item => item.product.id === product.id && item.size === size
            )

            if (existingItem) {
                // Если товар с таким размером уже есть - увеличиваем количество
                return prevItems.map(item =>
                    item.product.id === product.id && item.size === size
                        ? {...item, quantity: item.quantity + 1}
                        : item
                )
            } else {
                // Если товара нет - добавляем с количеством 1
                return [...prevItems, {product, quantity: 1, size}]
            }
        })
    }, [])

    // Увеличение количества товара
    const handleIncreaseQuantity = useCallback((productId: number, size: string) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.product.id === productId && item.size === size
                    ? {...item, quantity: item.quantity + 1}
                    : item
            )
        )
    }, [])

    // Уменьшение количества товара
    const handleDecreaseQuantity = useCallback((productId: number, size: string) => {
        setCartItems(prevItems => {
            const item = prevItems.find(i => i.product.id === productId && i.size === size)
            if (item && item.quantity <= 1) {
                return prevItems // Не уменьшаем ниже 1
            }
            return prevItems.map(i =>
                i.product.id === productId && i.size === size
                    ? {...i, quantity: i.quantity - 1}
                    : i
            )
        })
    }, [])

    // Удаление товара из корзины
    const handleRemoveFromCart = useCallback((productId: number, size: string) => {
        setCartItems(prevItems =>
            prevItems.filter(item => !(item.product.id === productId && item.size === size))
        )
    }, [])

    const openCart = useCallback(() => {
        if (activeTab === 'cart') return
        setCartReturnTo({tab: activeTab, product: selectedProduct})
        setActiveTab('cart')
        // карточку товара закрываем, но при "назад" из корзины восстановим её из cartReturnTo
        setSelectedProduct(null)
    }, [activeTab, selectedProduct])

    const handleTabChange = useCallback((tab: string) => {
        if (tab === 'cart') {
            openCart()
            return
        }
        setCartReturnTo(null)
        setSelectedProduct(null)
        setActiveTab(tab)
    }, [openCart])

    const isAdminMode = userInfo?.mode === 'ADMIN'

    const handleAddNewCard = () => {
        setAdminReturnProduct(null)
        setEditingProduct(null)
        setIsAdminCardOpen(true)
    }

    // Функция загрузки товаров
    const loadProducts = useCallback(async () => {
        try {
            // Для админа загружаем все товары (включая заблокированные)
            const goods = webApp?.initData
                ? (isAdminMode
                    ? await fetchAllGoods(webApp.initData)
                    : await fetchMyGoods(webApp.initData))
                : await fetchGoods()
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
                    favorite: Boolean(good.favorite),
                }
            })
            setProducts(mappedProducts)
        } catch (error) {
            console.error('Failed to fetch goods:', error)
        }
    }, [isAdminMode, webApp])

    const handleToggleFavorite = useCallback(async (product: Product) => {
        if (!webApp?.initData) {
            console.warn('No Telegram initData, cannot toggle favorite')
            return
        }

        const nextFavorite = !product.favorite

        // optimistic UI update
        setProducts(prev =>
            prev.map(p => p.id === product.id ? {...p, favorite: nextFavorite} : p)
        )

        try {
            if (nextFavorite) {
                await addFavorite(product.id, webApp.initData)
            } else {
                await removeFavorite(product.id, webApp.initData)
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error)
            // rollback
            setProducts(prev =>
                prev.map(p => p.id === product.id ? {...p, favorite: product.favorite} : p)
            )
        }
    }, [webApp])

    // Сохранение товара из админ-панели
    const handleSaveAdminCard = async (data: {
        id?: number;
        name: string;
        category: string;
        price: number;
        non_discount_price?: number;
        description: string;
        imageFiles: File[];
    }) => {
        if (!webApp?.initData) {
            alert('Ошибка авторизации')
            return
        }

        try {
            let goodId: number

            if (data.id) {
                // Обновляем существующий товар
                const updatedGood = await updateGoodCard(
                    data.id,
                    {
                        name: data.name,
                        category: data.category,
                        price: data.price,
                        non_discount_price: data.non_discount_price,
                        description: data.description,
                    },
                    webApp.initData
                )
                goodId = updatedGood.id
            } else {
                // Создаём новый товар
                const createdGood = await createGoodCard(
                    {
                        name: data.name,
                        category: data.category,
                        price: data.price,
                        non_discount_price: data.non_discount_price,
                        description: data.description,
                    },
                    webApp.initData
                )
                goodId = createdGood.id
            }

            // Если есть новые изображения, загружаем их
            if (data.imageFiles.length > 0) {
                await addGoodImages(goodId, data.imageFiles, webApp.initData)
            }

            setIsAdminCardOpen(false)
            setEditingProduct(null)
            setAdminReturnProduct(null)
            alert(data.id ? 'Товар успешно обновлён!' : 'Товар успешно добавлен!')

            // Обновляем список товаров
            await loadProducts()
        } catch (error) {
            console.error('Failed to save good card:', error)
            alert('Ошибка при сохранении товара')
        }
    }

    // Редактирование товара
    const handleEditProduct = (product: Product) => {
        setAdminReturnProduct(product)
        setEditingProduct(product)
        setSelectedProduct(null)
        setIsAdminCardOpen(true)
    }

    // Удаление товара
    const handleDeleteProduct = async () => {
        if (!editingProduct || !webApp?.initData) return

        if (!confirm('Вы уверены, что хотите удалить этот товар?')) return

        try {
            await deleteGood(editingProduct.id, webApp.initData)
            setIsAdminCardOpen(false)
            setEditingProduct(null)
            setAdminReturnProduct(null)
            alert('Товар успешно удалён!')
            await loadProducts()
        } catch (error) {
            console.error('Failed to delete good:', error)
            alert('Ошибка при удалении товара')
        }
    }

    // Блокировка/Активация товара
    const handleToggleBlockProduct = async () => {
        if (!editingProduct || !webApp?.initData) return

        try {
            if (editingProduct.status === 'BLOCKED') {
                await activateGood(editingProduct.id, webApp.initData)
                alert('Товар активирован!')
            } else {
                await blockGood(editingProduct.id, webApp.initData)
                alert('Товар заблокирован!')
            }
            setIsAdminCardOpen(false)
            setEditingProduct(null)
            setAdminReturnProduct(null)
            await loadProducts()
        } catch (error) {
            console.error('Failed to toggle block status:', error)
            alert('Ошибка при изменении статуса товара')
        }
    }

    // Загрузка информации о пользователе
    useEffect(() => {
        if (!webApp?.initData) return

        fetchUserInfo(webApp.initData)
            .then(setUserInfo)
            .catch((error) => {
                console.error('Failed to fetch user info:', error)
            })
    }, [webApp])

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
        loadProducts()
    }, [loadProducts])

    // Загрузка баннеров
    const loadBanners = useCallback(async () => {
        try {
            const data = isAdminMode && webApp?.initData
                ? await fetchAllPromoBanners(webApp.initData)
                : await fetchPromoBanners()
            setBanners(data)
        } catch (error) {
            console.error('Failed to fetch banners:', error)
        }
    }, [isAdminMode, webApp])

    useEffect(() => {
        loadBanners()
    }, [loadBanners])

    // Баннер: добавление нового
    const handleAddBanner = async () => {
        if (!webApp?.initData) return
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/jpeg,image/png,image/webp'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            try {
                await createPromoBanner(file, webApp.initData)
                await loadBanners()
            } catch (error) {
                console.error('Failed to create banner:', error)
                alert('Ошибка при загрузке баннера')
            }
        }
        input.click()
    }

    // Баннер: удаление
    const handleDeleteBanner = async () => {
        if (!editingBanner || !webApp?.initData) return
        if (!confirm('Удалить этот баннер?')) return
        try {
            await deletePromoBanner(editingBanner.id, webApp.initData)
            setEditingBanner(null)
            await loadBanners()
        } catch (error) {
            console.error('Failed to delete banner:', error)
            alert('Ошибка при удалении баннера')
        }
    }

    // Баннер: блокировка/активация
    const handleToggleBlockBanner = async () => {
        if (!editingBanner || !webApp?.initData) return
        try {
            if (editingBanner.status === 'BLOCKED') {
                await activatePromoBanner(editingBanner.id, webApp.initData)
            } else {
                await blockPromoBanner(editingBanner.id, webApp.initData)
            }
            setEditingBanner(null)
            await loadBanners()
        } catch (error) {
            console.error('Failed to toggle banner status:', error)
            alert('Ошибка при изменении статуса баннера')
        }
    }

    // Баннер: сохранение ссылки
    const handleSaveBannerLink = async (link: number | null) => {
        if (!editingBanner || !webApp?.initData) return
        try {
            await updatePromoBannerLink(editingBanner.id, link, webApp.initData)
            setEditingBanner(null)
            await loadBanners()
        } catch (error) {
            console.error('Failed to update banner link:', error)
            alert('Ошибка при сохранении ссылки')
        }
    }

    // Баннер: клик по баннеру с ссылкой на товар
    const handleBannerClick = (banner: PromoBannerDTO) => {
        if (banner.link) {
            const product = products.find(p => p.id === banner.link)
            if (product) setSelectedProduct(product)
        }
    }

    // Управление Telegram BackButton для навигации назад
    useEffect(() => {
        if (!webApp) return

        const shouldShowBackButton =
            selectedProduct !== null ||
            isAdminCardOpen ||
            activeTab === 'cart' ||
            activeTab === 'favorites' ||
            activeTab === 'profile'

        if (shouldShowBackButton) {
            const handleBack = () => {
                if (isAdminCardOpen) {
                    setIsAdminCardOpen(false)
                    setEditingProduct(null)
                    if (adminReturnProduct) {
                        setSelectedProduct(adminReturnProduct)
                    }
                    setAdminReturnProduct(null)
                } else if (activeTab === 'cart') {
                    const returnTab = cartReturnTo?.tab && cartReturnTo.tab !== 'cart'
                        ? cartReturnTo.tab
                        : 'home'

                    setActiveTab(returnTab)
                    setSelectedProduct(cartReturnTo?.product ?? null)
                    setCartReturnTo(null)
                } else if (selectedProduct) {
                    setSelectedProduct(null)
                } else if (activeTab === 'favorites' || activeTab === 'profile') {
                    setActiveTab('home')
                    setCartReturnTo(null)
                }
            }

            webApp.BackButton.onClick(handleBack)
            webApp.BackButton.show()

            return () => {
                webApp.BackButton.offClick(handleBack)
            }
        } else {
            webApp.BackButton.hide()
        }
    }, [webApp, activeTab, selectedProduct, isAdminCardOpen, adminReturnProduct, cartReturnTo])

    // Показываем корзину
    if (activeTab === 'cart') {
        return (
            <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
                <Cart
                    cartItems={cartItems}
                    onIncreaseQuantity={handleIncreaseQuantity}
                    onDecreaseQuantity={handleDecreaseQuantity}
                    onRemoveItem={handleRemoveFromCart}
                    onCheckout={() => console.log('Оформление заказа')}
                    selectedPickupAddress={selectedPickupAddress}
                    onOpenStoreAddresses={() => setIsStoreAddressesOpen(true)}
                />
                <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount}/>
                <StoreAddresses
                    isOpen={isStoreAddressesOpen}
                    onClose={() => setIsStoreAddressesOpen(false)}
                    onSelectAddress={(address) => {
                        setSelectedPickupAddress(address)
                        setIsStoreAddressesOpen(false)
                    }}
                    userMode={userInfo?.mode}
                    initData={webApp?.initData}
                    fromCart={true}
                />
            </div>
        )
    }

    // Показываем избранное
    if (activeTab === 'favorites') {
        const favoriteItems = products
            .filter(p => p.favorite)
            .map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image,
                size: 'L',
                isSoldOut: p.status === 'BLOCKED',
            }))

        return (
            <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
                <Favorites
                    items={favoriteItems}
                    onAddToCart={(item) => console.log('Добавлено в корзину:', item.name)}
                    onNotify={(item) => console.log('Оповещение для:', item.name)}
                    onRemove={(item) => {
                        if (!webApp?.initData) return

                        // optimistic remove
                        setProducts(prev => prev.map(p => p.id === item.id ? {...p, favorite: false} : p))
                        removeFavorite(item.id, webApp.initData).catch((error) => {
                            console.error('Failed to remove favorite:', error)
                            // rollback
                            setProducts(prev => prev.map(p => p.id === item.id ? {...p, favorite: true} : p))
                        })
                    }}
                />
                <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount}/>
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
                <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount}/>
            </div>
        )
    }

    // Показываем карточку товара, если товар выбран
    if (selectedProduct) {
        return (
            <div className="flex flex-col h-screen bg-white max-w-[402px] mx-auto overflow-hidden">
                <ProductCard
                    product={selectedProduct}
                    onBack={() => setSelectedProduct(null)}
                    onAddToCart={(size: string) => {
                        handleAddToCart(selectedProduct, size)
                    }}
                    isInCart={(size: string) => cartItems.some(item => item.product.id === selectedProduct.id && item.size === size)}
                    onGoToCart={openCart}
                    onSaveForLater={() => {
                        console.log('Отложено:', selectedProduct.name)
                    }}
                    isAdmin={isAdminMode}
                    onEdit={() => handleEditProduct(selectedProduct)}
                />
                <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount}/>
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
                <div className="mb-4">
                    <PromoBanner
                        banners={banners}
                        isAdminMode={isAdminMode}
                        onAddNew={handleAddBanner}
                        onEdit={setEditingBanner}
                        onBannerClick={handleBannerClick}
                    />
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
                    onFavorite={handleToggleFavorite}
                    isAdminMode={isAdminMode}
                    onAddNewCard={handleAddNewCard}
                />
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount}/>

            {/* Admin Banner Card Modal */}
            {editingBanner && (
                <AdminPromoBannerCard
                    banner={editingBanner}
                    onClose={() => setEditingBanner(null)}
                    onDelete={handleDeleteBanner}
                    onBlock={handleToggleBlockBanner}
                    onSave={handleSaveBannerLink}
                />
            )}

            {/* Admin Product Card Modal */}
            {isAdminCardOpen && (
                <AdminProductCard
                    onClose={() => {
                        setIsAdminCardOpen(false)
                        setEditingProduct(null)
                        if (adminReturnProduct) {
                            setSelectedProduct(adminReturnProduct)
                        }
                        setAdminReturnProduct(null)
                    }}
                    onSave={handleSaveAdminCard}
                    editingProduct={editingProduct || undefined}
                    onDelete={handleDeleteProduct}
                    onToggleBlock={handleToggleBlockProduct}
                />
            )}
        </div>
    )
}

export default App
