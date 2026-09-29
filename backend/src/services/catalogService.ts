import { CategoryRepository } from '../repositories/categoryRepository.js';
import { VariantRepository } from '../repositories/variantRepository.js';
import { ProductCategory, ProductVariant, SpecificationFieldSchema } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class CatalogService {
  private categoryRepo: CategoryRepository;
  private variantRepo: VariantRepository;

  constructor(categoryRepo?: CategoryRepository, variantRepo?: VariantRepository) {
    this.categoryRepo = categoryRepo ?? new CategoryRepository();
    this.variantRepo = variantRepo ?? new VariantRepository();
  }

  // ---------------------------------------------------------------------------
  // Public Customer Methods
  // ---------------------------------------------------------------------------
  async getCategories(includeVariants = false): Promise<ProductCategory[]> {
    const categories = (await this.categoryRepo.findAllActive()) as ProductCategory[];
    if (includeVariants) {
      const results: ProductCategory[] = [];
      for (const cat of categories) {
        const variants = (await this.variantRepo.findByCategory(cat.id, true)) as ProductVariant[];
        results.push({
          ...cat,
          variants: variants.map((v) => this.attachParsedSpecs(v)),
        });
      }
      return results;
    }
    return categories;
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategory> {
    const category = (await this.categoryRepo.findBySlug(slug)) as ProductCategory | null;
    if (!category || !category.is_active) {
      throw new NotFoundError(`Material category '${slug}' not found or inactive`);
    }

    const variants = ((await this.variantRepo.findByCategory(category.id, true)) as ProductVariant[]).map((v) =>
      this.attachParsedSpecs(v)
    );
    return {
      ...category,
      variants,
    };
  }

  async getVariantsForCategory(categorySlugOrId: string, activeOnly = true): Promise<ProductVariant[]> {
    const category =
      ((await this.categoryRepo.findBySlug(categorySlugOrId)) as ProductCategory | null) ||
      ((await this.categoryRepo.findById(categorySlugOrId)) as ProductCategory | null);
    if (!category || (activeOnly && !category.is_active)) {
      throw new NotFoundError(`Material category '${categorySlugOrId}' not found or inactive`);
    }

    const variants = (await this.variantRepo.findByCategory(category.id, activeOnly)) as ProductVariant[];
    return variants.map((v) => this.attachParsedSpecs(v));
  }

  async getVariantBySlug(categorySlugOrId: string, variantSlugOrId: string): Promise<ProductVariant> {
    const category =
      ((await this.categoryRepo.findBySlug(categorySlugOrId)) as ProductCategory | null) ||
      ((await this.categoryRepo.findById(categorySlugOrId)) as ProductCategory | null);
    if (!category || !category.is_active) {
      throw new NotFoundError(`Material category '${categorySlugOrId}' not found or inactive`);
    }

    const variant = (await this.variantRepo.findBySlug(variantSlugOrId, category.slug)) as ProductVariant | null;
    if (!variant || !variant.is_active) {
      throw new NotFoundError(`Variant '${variantSlugOrId}' not found or inactive in category '${category.name}'`);
    }

    return this.attachParsedSpecs(variant);
  }

  async getVariantById(variantId: string): Promise<ProductVariant> {
    const variant = (await this.variantRepo.findById(variantId)) as ProductVariant | null;
    if (!variant) {
      throw new NotFoundError(`Variant with id '${variantId}' not found`);
    }
    return this.attachParsedSpecs(variant);
  }

  // ---------------------------------------------------------------------------
  // Validation Helpers for Quote Request Flow
  // ---------------------------------------------------------------------------
  validateSpecifications(
    variant: ProductVariant,
    inputSpecs?: Record<string, any> | null
  ): Record<string, string> {
    let schema: SpecificationFieldSchema[] = [];
    try {
      schema = typeof variant.specifications_schema === 'string'
        ? JSON.parse(variant.specifications_schema)
        : variant.specifications_schema || [];
    } catch {
      schema = [];
    }

    const validated: Record<string, string> = {};
    const specs = inputSpecs || {};

    for (const field of schema) {
      const val = specs[field.key];

      if (field.required) {
        if (val === undefined || val === null || String(val).trim() === '') {
          throw new ValidationError(
            `Specification '${field.label}' is required for ${variant.name}.`
          );
        }
      }

      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const strVal = String(val).trim();
        // If options are configured, ensure selected option is valid
        if (field.type === 'select' && field.options && field.options.length > 0) {
          const match = field.options.find(
            (opt) => opt.toLowerCase() === strVal.toLowerCase()
          );
          if (!match) {
            throw new ValidationError(
              `Invalid option '${strVal}' for '${field.label}'. Allowed options: ${field.options.join(', ')}.`
            );
          }
          validated[field.key] = match;
        } else {
          validated[field.key] = strVal;
        }
      }
    }

    return validated;
  }

  validateQuantityAndUnit(
    variant: ProductVariant,
    quantity: number,
    unit: string
  ): void {
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero.');
    }

    if (quantity < variant.min_quantity) {
      throw new ValidationError(
        `Minimum order quantity for ${variant.name} is ${variant.min_quantity} ${variant.unit}.`
      );
    }

    if (unit && unit.toLowerCase() !== variant.unit.toLowerCase()) {
      throw new ValidationError(
        `Unit '${unit}' is not compatible with ${variant.name}. Standard billing unit is '${variant.unit}'.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Admin Management Methods
  // ---------------------------------------------------------------------------
  async getAllCategoriesAdmin(): Promise<ProductCategory[]> {
    const categories = (await this.categoryRepo.findAllAdmin()) as ProductCategory[];
    const results: ProductCategory[] = [];
    for (const cat of categories) {
      const variants = (await this.variantRepo.findByCategory(cat.id, false)) as ProductVariant[];
      results.push({
        ...cat,
        variants: variants.map((v) => this.attachParsedSpecs(v)),
      });
    }
    return results;
  }

  async getAllVariantsAdmin(): Promise<ProductVariant[]> {
    const variants = (await this.variantRepo.findAllAdmin()) as ProductVariant[];
    return variants.map((v) => this.attachParsedSpecs(v));
  }

  async createCategory(payload: {
    name: string;
    slug: string;
    description: string;
    image_url?: string | null;
    display_order?: number;
    is_active?: number;
  }): Promise<ProductCategory> {
    const existing = await this.categoryRepo.findBySlug(payload.slug);
    if (existing) {
      throw new ValidationError(`Category with slug '${payload.slug}' already exists.`);
    }

    const now = new Date().toISOString();
    const id = `cat_${payload.slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}`;
    const category: ProductCategory = {
      id,
      name: payload.name,
      slug: payload.slug.toLowerCase().trim(),
      description: payload.description,
      image_url: payload.image_url ?? null,
      is_active: payload.is_active ?? 1,
      display_order: payload.display_order ?? 0,
      created_at: now,
      updated_at: now,
    };

    await this.categoryRepo.create(category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<ProductCategory>): Promise<ProductCategory> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Category with id '${id}' not found`);
    }

    await this.categoryRepo.update(id, updates);
    return (await this.categoryRepo.findById(id))!;
  }

  async createVariant(payload: {
    category_id: string;
    name: string;
    slug: string;
    short_description: string;
    detailed_description?: string | null;
    image_url?: string | null;
    unit: string;
    min_quantity?: number;
    indicative_price?: number | null;
    specifications_schema?: string | SpecificationFieldSchema[];
    display_order?: number;
    is_active?: number;
  }): Promise<ProductVariant> {
    const category = await this.categoryRepo.findById(payload.category_id);
    if (!category) {
      throw new NotFoundError(`Category with id '${payload.category_id}' not found`);
    }

    const existing = await this.variantRepo.findBySlug(payload.slug, category.slug);
    if (existing) {
      throw new ValidationError(`Variant with slug '${payload.slug}' already exists in this category.`);
    }

    const now = new Date().toISOString();
    const id = `var_${payload.slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}`;
    const schemaStr = typeof payload.specifications_schema === 'string'
      ? payload.specifications_schema
      : JSON.stringify(payload.specifications_schema || []);

    const variant: ProductVariant = {
      id,
      category_id: payload.category_id,
      name: payload.name,
      slug: payload.slug.toLowerCase().trim(),
      short_description: payload.short_description,
      detailed_description: payload.detailed_description ?? null,
      image_url: payload.image_url ?? null,
      unit: payload.unit,
      min_quantity: payload.min_quantity ?? 1,
      indicative_price: payload.indicative_price ?? null,
      specifications_schema: schemaStr,
      is_active: payload.is_active ?? 1,
      display_order: payload.display_order ?? 0,
      created_at: now,
      updated_at: now,
    };

    await this.variantRepo.create(variant);
    const created = await this.variantRepo.findById(id);
    return this.attachParsedSpecs(created!);
  }

  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
    const existing = await this.variantRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Variant with id '${id}' not found`);
    }

    if (updates.specifications_schema && typeof updates.specifications_schema !== 'string') {
      updates.specifications_schema = JSON.stringify(updates.specifications_schema);
    }

    await this.variantRepo.update(id, updates);
    const updated = await this.variantRepo.findById(id);
    return this.attachParsedSpecs(updated!);
  }

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------
  private attachParsedSpecs(variant: ProductVariant): ProductVariant {
    try {
      const parsed = typeof variant.specifications_schema === 'string'
        ? JSON.parse(variant.specifications_schema)
        : variant.specifications_schema || [];
      return {
        ...variant,
        parsed_specifications: parsed,
      };
    } catch {
      return {
        ...variant,
        parsed_specifications: [],
      };
    }
  }
}
