/**
 * Base repository interface providing common CRUD operations
 */
export interface IRepository<T> {
  /**
   * Find an entity by its ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Create a new entity
   */
  create(entity: T): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: string, entity: Partial<T>): Promise<T | null>;

  /**
   * Delete an entity by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if an entity exists
   */
  exists(id: string): Promise<boolean>;
}