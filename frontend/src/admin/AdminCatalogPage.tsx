import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogService.js';
import { ProductCategory, ProductVariant } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Alert } from '../components/Alert.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Package,
  Search,
  Check,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const AdminCatalogPage: React.FC = () => {
  usePageMeta('Catalog & Material Variants', 'Manage hierarchical material catalog, subtypes, indicative rates, and dynamic specification schemas.');

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Editing
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New / Edit Variant Form Data
  const [variantForm, setVariantForm] = useState<{
    category_id: string;
    name: string;
    slug: string;
    short_description: string;
    detailed_description: string;
    unit: string;
    min_quantity: number;
    indicative_price: string;
    is_active: number;
    display_order: number;
    specifications_schema: string;
  }>({
    category_id: '',
    name: '',
    slug: '',
    short_description: '',
    detailed_description: '',
    unit: 'Brass',
    min_quantity: 1,
    indicative_price: '',
    is_active: 1,
    display_order: 1,
    specifications_schema: '[]',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsData, varsData] = await Promise.all([
        catalogService.getAdminCategories(),
        catalogService.getAdminVariants(),
      ]);
      setCategories(catsData);
      setVariants(varsData);
      if (catsData.length > 0 && !variantForm.category_id) {
        setVariantForm((prev) => ({ ...prev, category_id: catsData[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCategoryActive = async (cat: ProductCategory) => {
    try {
      const newStatus = cat.is_active === 1 ? 0 : 1;
      await catalogService.updateCategory(cat.id, { is_active: newStatus });
      setSuccessMsg(`Category '${cat.name}' ${newStatus === 1 ? 'activated' : 'deactivated'}.`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category status');
    }
  };

  const handleToggleVariantActive = async (v: ProductVariant) => {
    try {
      const newStatus = v.is_active === 1 ? 0 : 1;
      await catalogService.updateVariant(v.id, { is_active: newStatus });
      setSuccessMsg(`Variant '${v.name}' ${newStatus === 1 ? 'activated' : 'deactivated'}.`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update variant status');
    }
  };

  const handleOpenEdit = (v: ProductVariant) => {
    setEditingVariant(v);
    setIsCreatingVariant(false);
    setVariantForm({
      category_id: v.category_id,
      name: v.name,
      slug: v.slug,
      short_description: v.short_description,
      detailed_description: v.detailed_description || '',
      unit: v.unit,
      min_quantity: v.min_quantity || 1,
      indicative_price: v.indicative_price != null ? String(v.indicative_price) : '',
      is_active: v.is_active,
      display_order: v.display_order,
      specifications_schema:
        typeof v.specifications_schema === 'string'
          ? v.specifications_schema
          : JSON.stringify(v.specifications_schema || [], null, 2),
    });
  };

  const handleOpenCreate = () => {
    setEditingVariant(null);
    setIsCreatingVariant(true);
    setVariantForm({
      category_id: categories[0]?.id || '',
      name: '',
      slug: '',
      short_description: '',
      detailed_description: '',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: '',
      is_active: 1,
      display_order: variants.length + 1,
      specifications_schema: JSON.stringify(
        [
          {
            key: 'grade',
            label: 'Grade / Quality',
            type: 'select',
            required: true,
            options: ['Standard Grade', 'Premium Grade'],
            default_value: 'Standard Grade',
          },
        ],
        null,
        2
      ),
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Validate schema JSON
      let parsedSchema = [];
      try {
        parsedSchema = JSON.parse(variantForm.specifications_schema);
        if (!Array.isArray(parsedSchema)) {
          throw new Error('Specification schema must be a JSON array of field objects.');
        }
      } catch (err) {
        throw new Error('Invalid JSON in Specifications Schema. Please format as a valid JSON array.');
      }

      const payload = {
        category_id: variantForm.category_id,
        name: variantForm.name.trim(),
        slug: variantForm.slug.trim().toLowerCase(),
        short_description: variantForm.short_description.trim(),
        detailed_description: variantForm.detailed_description.trim() || undefined,
        unit: variantForm.unit.trim(),
        min_quantity: Number(variantForm.min_quantity),
        indicative_price: variantForm.indicative_price ? Number(variantForm.indicative_price) : null,
        is_active: variantForm.is_active,
        display_order: Number(variantForm.display_order),
        specifications_schema: JSON.stringify(parsedSchema),
      };

      if (editingVariant) {
        await catalogService.updateVariant(editingVariant.id, payload);
        setSuccessMsg(`Variant '${payload.name}' updated successfully.`);
      } else {
        await catalogService.createVariant(payload);
        setSuccessMsg(`New variant '${payload.name}' created successfully.`);
      }

      setEditingVariant(null);
      setIsCreatingVariant(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVariants = variants.filter((v) => {
    const matchesCat = selectedCategoryFilter === 'ALL' || v.category_id === selectedCategoryFilter;
    const matchesQuery =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.category_name && v.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  if (loading && categories.length === 0) {
    return <LoadingSpinner message="Loading catalog management..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Catalog & Material Variants
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage hierarchical categories, material subtypes, minimum quantities, indicative rates, and dynamic civil specification schemas.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          size="sm"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Variant</span>
        </Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}
      {successMsg && <Alert type="success" title="Success" message={successMsg} />}

      {/* Categories Overview Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Active Material Categories (4 Core MVP)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const count = variants.filter((v) => v.category_id === cat.id).length;
            const isActive = cat.is_active === 1;
            return (
              <div
                key={cat.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isActive ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-100/60 border-slate-300 opacity-60'
                }`}
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{cat.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {count} {count === 1 ? 'variant' : 'variants'} configured
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleCategoryActive(cat)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                  title="Toggle Category Visibility"
                >
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600">Category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Categories ({variants.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search variant name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Variants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Subtype / Variant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Standard Unit</th>
                <th className="py-3 px-4">Min Quantity</th>
                <th className="py-3 px-4">Indicative Rate</th>
                <th className="py-3 px-4">Spec Schema</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No material variants match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  let specsCount = 0;
                  try {
                    const parsed =
                      typeof v.specifications_schema === 'string'
                        ? JSON.parse(v.specifications_schema)
                        : v.specifications_schema;
                    specsCount = Array.isArray(parsed) ? parsed.length : 0;
                  } catch {}

                  const isActive = v.is_active === 1;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{v.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {v.category_name || categories.find((c) => c.id === v.category_id)?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{v.unit}</td>
                      <td className="py-3 px-4">
                        {v.min_quantity} {v.unit}
                      </td>
                      <td className="py-3 px-4">
                        {v.indicative_price != null ? (
                          <span className="font-semibold text-slate-900">
                            ₹{v.indicative_price.toLocaleString('en-IN')}/{v.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Sliders className="h-3 w-3" />
                          {specsCount} {specsCount === 1 ? 'field' : 'fields'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleVariantActive(v)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-semibold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Variant Modal */}
      {(isCreatingVariant || editingVariant) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingVariant ? `Edit Variant: ${editingVariant.name}` : 'Add New Material Variant'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure subtype details, indicative baseline rate, and dynamic customer specifications schema.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingVariant(null);
                  setIsCreatingVariant(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={variantForm.category_id}
                    onChange={(e) => setVariantForm({ ...variantForm, category_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variant Name */}
                <div>
                  <Input
                    label="Variant Name"
                    required
                    placeholder="e.g., River Sand (Washed)"
                    value={variantForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                      setVariantForm({
                        ...variantForm,
                        name,
                        slug: editingVariant ? variantForm.slug : slug,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Slug */}
                <div>
                  <Input
                    label="URL Slug"
                    required
                    placeholder="e.g., river-sand-washed"
                    value={variantForm.slug}
                    onChange={(e) => setVariantForm({ ...variantForm, slug: e.target.value })}
                    helperText="Unique identifier in URL path"
                  />
                </div>

                {/* Standard Unit */}
                <div>
                  <Input
                    label="Commercial Unit"
                    required
                    placeholder="e.g., Brass, Pieces, Tons"
                    value={variantForm.unit}
                    onChange={(e) => setVariantForm({ ...variantForm, unit: e.target.value })}
                    helperText="Standard billing unit for this material"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Minimum Quantity */}
                <div>
                  <Input
                    label="Minimum Order Quantity"
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={variantForm.min_quantity}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, min_quantity: parseFloat(e.target.value) || 1 })
                    }
                    helperText={`Minimum delivery volume in ${variantForm.unit}`}
                  />
                </div>

                {/* Indicative Rate */}
                <div>
                  <Input
                    label="Indicative Rate (₹ per unit, Ex-Quarry)"
                    type="number"
                    placeholder="e.g., 4200"
                    value={variantForm.indicative_price}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, indicative_price: e.target.value })
                    }
                    helperText="Purely indicative for customers; not auto-charged."
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief summary of suitability, civil applications, and source in Nagpur region"
                  value={variantForm.short_description}
                  onChange={(e) => setVariantForm({ ...variantForm, short_description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Specifications Schema JSON Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Specifications Schema (JSON Definition)
                  </label>
                  <span className="text-[10px] text-slate-400">Array of field objects</span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={variantForm.specifications_schema}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, specifications_schema: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-900 text-emerald-400 font-mono text-[11px] border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="mt-1 text-[10px] text-slate-500 leading-normal">
                  Each item in array must have <code>key</code>, <code>label</code>, <code>type</code> ('select'|'text'|'number'), <code>required</code> (boolean), and optional <code>options</code> array.
                </p>
              </div>

              {/* Active Toggle & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <Input
                    label="Display Order"
                    type="number"
                    value={variantForm.display_order}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, display_order: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={variantForm.is_active === 1}
                      onChange={(e) =>
                        setVariantForm({ ...variantForm, is_active: e.target.checked ? 1 : 0 })
                      }
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <span>Variant Active & Orderable</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingVariant(null);
                    setIsCreatingVariant(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {editingVariant ? 'Save Changes' : 'Create Variant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
