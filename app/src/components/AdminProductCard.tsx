import React, { useState, useRef, useEffect } from 'react';
import { fetchCategories } from '../api/client';
import type { CategoryDTO } from '../api/client';
import type { Product } from './ProductGridCard';

interface AdminProductCardProps {
  onClose: () => void;
  onSave: (data: {
    id?: number;
    name: string;
    category: string;
    price: number;
    non_discount_price?: number;
    description: string;
    imageFiles: File[];
  }) => void;
  editingProduct?: Product;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({ onClose, onSave, editingProduct }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [priceRub, setPriceRub] = useState('');
  const [nonDiscountPriceRub, setNonDiscountPriceRub] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // При редактировании заполняем форму
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category || '');
      const priceMatch = editingProduct.price.match(/[\d\s]+/);
      if (priceMatch) {
        setPriceRub(priceMatch[0].replace(/\s/g, ''));
      }
      if (editingProduct.non_discount_price) {
        const nonDiscountMatch = editingProduct.non_discount_price.match(/[\d\s]+/);
        if (nonDiscountMatch) {
          setNonDiscountPriceRub(nonDiscountMatch[0].replace(/\s/g, ''));
        }
      }
      setDescription(editingProduct.description);
      if (editingProduct.images && editingProduct.images.length > 0) {
        setPreviewUrls(editingProduct.images);
      } else if (editingProduct.image) {
        setPreviewUrls([editingProduct.image]);
      }
    }
  }, [editingProduct]);

  // Загрузка категорий
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const fetched = await fetchCategories();
        setCategories(fetched);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Размер файла ${file.name} не должен превышать 5MB`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert(`Файл ${file.name} должен быть изображением`);
        return;
      }
    }

    const urls = fileArray.map(file => URL.createObjectURL(file));
    setSelectedFiles(fileArray);
    setPreviewUrls(urls);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__create_new__') {
      setIsCreatingNewCategory(true);
      setNewCategoryInput('');
    } else {
      setCategory(value);
    }
  };

  const handleNewCategoryConfirm = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      setCategory(trimmed);
      const exists = categories.some(cat => cat.title === trimmed);
      if (!exists) {
        setCategories(prev => [...prev, { id: 0, title: trimmed, status: 'NEW' }]);
      }
    }
    setIsCreatingNewCategory(false);
    setNewCategoryInput('');
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название товара');
      return;
    }
    if (!category.trim()) {
      alert('Выберите категорию товара');
      return;
    }
    if (!priceRub.trim() || isNaN(Number(priceRub)) || Number(priceRub) <= 0) {
      alert('Введите корректную цену');
      return;
    }
    if (!description.trim()) {
      alert('Введите описание товара');
      return;
    }

    const price = Math.round(Number(priceRub));
    const nonDiscountPrice = nonDiscountPriceRub.trim() && !isNaN(Number(nonDiscountPriceRub))
      ? Math.round(Number(nonDiscountPriceRub))
      : undefined;

    onSave({
      id: editingProduct?.id,
      name: name.trim(),
      category: category,
      price: price,
      non_discount_price: nonDiscountPrice,
      description: description.trim(),
      imageFiles: selectedFiles,
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
          <button onClick={onClose} className="p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold">
            {editingProduct ? 'Редактирование' : 'Новый товар'}
          </h1>
          <div className="w-10" />
        </header>

        {/* Image Section */}
        <div
          className="relative h-[280px] bg-gray-100 flex items-center justify-center cursor-pointer border-b border-gray-200"
          onClick={handleImageClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrls.length > 0 ? (
            <img
              src={previewUrls[0]}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                className="mx-auto mb-3"
              >
                <path d="M24 10V38M10 24H38" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round"/>
                <rect x="6" y="6" width="36" height="36" rx="4" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 4"/>
              </svg>
              <p className="text-gray-500 text-sm">Добавить фото</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="px-4 py-6 flex-1">
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1">Название *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название товара"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-black"
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1">Категория *</label>
            {isCreatingNewCategory ? (
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onBlur={handleNewCategoryConfirm}
                onKeyDown={(e) => e.key === 'Enter' && handleNewCategoryConfirm()}
                placeholder="Название категории"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-black"
              />
            ) : (
              <select
                value={category}
                onChange={handleCategoryChange}
                disabled={categoriesLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-black bg-white"
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.title}>{cat.title}</option>
                ))}
                <option value="__create_new__">+ Новая категория</option>
              </select>
            )}
          </div>

          {/* Non-discount Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1">Цена до скидки (₽)</label>
            <input
              type="number"
              value={nonDiscountPriceRub}
              onChange={(e) => setNonDiscountPriceRub(e.target.value)}
              placeholder="10000"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-black"
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1">Цена (₽) *</label>
            <input
              type="number"
              value={priceRub}
              onChange={(e) => setPriceRub(e.target.value)}
              placeholder="8500"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-black"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-1">Описание *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание товара"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-black resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-4 bg-black text-white font-semibold rounded-lg"
            >
              Сохранить
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-200 text-black font-semibold rounded-lg"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductCard;
