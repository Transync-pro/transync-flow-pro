
import { DateRange } from "react-day-picker";
import { DeleteProgress } from "./useEntityOperations";

export interface EntityRecord {
  Id: string;
  [key: string]: any;
}

export interface EntityState {
  records: EntityRecord[];
  filteredRecords: EntityRecord[];
  isLoading: boolean;
  error: string | null;
}

export interface QuickbooksEntitiesContextType {
  // Entity selection state
  selectedEntity: string | null;
  setSelectedEntity: (entity: string | null) => void;
  selectedDateRange: DateRange | undefined;
  setSelectedDateRange: (dateRange: DateRange | undefined) => void;
  
  // Entity data state
  entityState: Record<string, EntityState>;
  
  // Entity operations
  fetchEntities: (entityType?: string) => Promise<void>;
  filterEntities: (searchTerm: string, entityType?: string) => void;
  deleteEntity: (entityId: string, entityType?: string) => Promise<boolean>;
  deleteSelectedEntities: (entityIds: string[], entityType?: string) => Promise<void>;
  
  // Multi-select functionality
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[]) => void;
  toggleEntitySelection: (id: string) => void;
  selectAllEntities: (select: boolean, entityType?: string) => void;
  
  // Delete progress tracking
  deleteProgress: DeleteProgress;
  isDeleting: boolean;
  
  // Available entity options
  entityOptions: Array<{ value: string; label: string }>;
  
  // Helper functions
  getNestedValue: (obj: any, path: string) => any;
}
