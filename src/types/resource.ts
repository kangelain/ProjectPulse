
export type ResourceType = 'Personnel' | 'Equipment' | 'Facility';

export type ResourceStatus = 'Available' | 'Partially Allocated' | 'Fully Allocated' | 'Maintenance';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  skills?: string[]; // For Personnel
  location?: string; // For Equipment or Facility
  capacity?: number; // e.g., seats for Facility, units for Equipment
  notes?: string;
  lastUpdated: string; // ISO string
}

export interface ResourceAllocation {
  id: string;
  projectId: string;
  resourceId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  effortPercentage?: number; // For Personnel (0-100)
  role?: string; // Role of personnel in the project
  notes?: string;
}
