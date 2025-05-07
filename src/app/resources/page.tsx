'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Resource, ResourceAllocation, ResourceStatus, ResourceType } from '@/types/resource';
import type { Project } from '@/types/project';
import { mockResources, mockResourceAllocations, mockProjects } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Briefcase, Users, Server, Building, CalendarDays, Percent, UserPlus, Edit3, PlusCircle, Trash2, Search, Filter, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { FormControl as ShadCNFormControl } from '@/components/ui/form';


const resourceStatusColors: Record<ResourceStatus, string> = {
  'Available': 'bg-green-500 text-white',
  'Partially Allocated': 'bg-yellow-500 text-black',
  'Fully Allocated': 'bg-orange-500 text-white',
  'Maintenance': 'bg-red-500 text-white',
};

const resourceTypeIcons: Record<ResourceType, React.ElementType> = {
  'Personnel': Users,
  'Equipment': Server,
  'Facility': Building,
};

// Form Schemas
const resourceFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters."),
  type: z.enum(['Personnel', 'Equipment', 'Facility']),
  status: z.enum(['Available', 'Partially Allocated', 'Fully Allocated', 'Maintenance']),
  skills: z.string().optional(), // Comma-separated
  location: z.string().optional(),
  capacity: z.coerce.number().optional(),
  notes: z.string().optional(),
});
type ResourceFormValues = z.infer<typeof resourceFormSchema>;

const allocationFormSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "Project is required."),
  resourceId: z.string().min(1, "Resource is required."),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid start date.' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid end date.' }),
  effortPercentage: z.coerce.number().min(0).max(100).optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});
type AllocationFormValues = z.infer<typeof allocationFormSchema>;


export default function ResourceManagementPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>(mockResourceAllocations);
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const [searchTerm, setSearchTerm] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | 'all'>('all');
  const [resourceStatusFilter, setResourceStatusFilter] = useState<ResourceStatus | 'all'>('all');

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<ResourceAllocation | null>(null);

  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
  });
  const allocationForm = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
  });

  useEffect(() => {
    if (editingResource) {
      resourceForm.reset({
        ...editingResource,
        skills: editingResource.skills?.join(', '),
      });
    } else {
      resourceForm.reset({ name: '', type: 'Personnel', status: 'Available', skills: '', location: '', capacity: undefined, notes: '' });
    }
  }, [editingResource, resourceForm]);

  useEffect(() => {
    if (editingAllocation) {
      allocationForm.reset({
        ...editingAllocation,
        startDate: format(parseISO(editingAllocation.startDate), 'yyyy-MM-dd'),
        endDate: format(parseISO(editingAllocation.endDate), 'yyyy-MM-dd'),
      });
    } else {
       // Pre-fill resourceId if opening from a specific resource's allocation list
      const selectedResourceId = editingResource?.id || (resources.length > 0 ? resources[0].id : '');
      allocationForm.reset({
        projectId: projects.length > 0 ? projects[0].id : '',
        resourceId: selectedResourceId,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        effortPercentage: undefined,
        role: '',
        notes: '',
      });
    }
  }, [editingAllocation, allocationForm, projects, editingResource, resources]);


  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (res.skills && res.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (res.location && res.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = resourceTypeFilter === 'all' || res.type === resourceTypeFilter;
      const matchesStatus = resourceStatusFilter === 'all' || res.status === resourceStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, searchTerm, resourceTypeFilter, resourceStatusFilter]);

  const handleSaveResource: SubmitHandler<ResourceFormValues> = (data) => {
    const resourceData: Resource = {
      ...data,
      id: data.id || `res-${Date.now()}`,
      skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      lastUpdated: new Date().toISOString(),
    };

    if (data.id) {
      setResources(prev => prev.map(r => r.id === data.id ? resourceData : r));
      toast({ title: "Resource Updated", description: `${resourceData.name} has been updated.` });
    } else {
      setResources(prev => [...prev, resourceData]);
      toast({ title: "Resource Added", description: `${resourceData.name} has been added.` });
    }
    setIsResourceModalOpen(false);
  };

  const handleDeleteResource = (resourceId: string) => {
    // Also delete associated allocations
    setAllocations(prev => prev.filter(alloc => alloc.resourceId !== resourceId));
    setResources(prev => prev.filter(r => r.id !== resourceId));
    toast({ title: "Resource Deleted", description: `Resource and its allocations have been deleted.` });
  };

  const handleSaveAllocation: SubmitHandler<AllocationFormValues> = (data) => {
    const allocationData: ResourceAllocation = {
      ...data,
      id: data.id || `alloc-${Date.now()}`,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };

    if (data.id) {
      setAllocations(prev => prev.map(a => a.id === data.id ? allocationData : a));
      toast({ title: "Allocation Updated", description: `Allocation for project ${projects.find(p=>p.id === data.projectId)?.name} has been updated.` });
    } else {
      setAllocations(prev => [...prev, allocationData]);
      toast({ title: "Allocation Added", description: `Resource allocated to project ${projects.find(p=>p.id === data.projectId)?.name}.` });
    }
    setIsAllocationModalOpen(false);
  };

  const handleDeleteAllocation = (allocationId: string) => {
    setAllocations(prev => prev.filter(a => a.id !== allocationId));
    toast({ title: "Allocation Deleted", description: "Resource allocation has been removed." });
  };
  
  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';
  const getResourceName = (resourceId: string) => resources.find(r => r.id === resourceId)?.name || 'N/A';

  const formatDateRange = (startDate: string, endDate: string) => {
    return `${format(parseISO(startDate), 'MMM d, yyyy')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`;
  };


  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Briefcase className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Resource Management</h1>
        </div>
        <Button onClick={() => { setEditingResource(null); setIsResourceModalOpen(true); }}>
          <UserPlus className="mr-2 h-4 w-4" /> Add New Resource
        </Button>
      </div>

      <Card className="mb-8 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <InputWithIcon
            icon={<Search className="h-4 w-4 text-muted-foreground" />}
            placeholder="Search by name, skill, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10"
          />
          <Select value={resourceTypeFilter} onValueChange={(value) => setResourceTypeFilter(value as ResourceType | 'all')}>
            <ShadCNFormControl>
                <SelectTrigger className="h-10">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
            </ShadCNFormControl>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(resourceTypeIcons).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceStatusFilter} onValueChange={(value) => setResourceStatusFilter(value as ResourceStatus | 'all')}>
            <ShadCNFormControl>
                <SelectTrigger className="h-10">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
            </ShadCNFormControl>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
               {Object.keys(resourceStatusColors).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-2 mb-6">
          <TabsTrigger value="resources" className="text-sm py-2.5">
            <Users className="mr-2 h-4 w-4" /> Resources
          </TabsTrigger>
          <TabsTrigger value="allocations" className="text-sm py-2.5">
            <CalendarDays className="mr-2 h-4 w-4" /> Allocations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Resource List</CardTitle>
              <CardDescription>Overview of all available and allocated resources.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No resources found matching your criteria.</p>
                            </TableCell>
                        </TableRow>
                    )}
                    {filteredResources.map(resource => {
                      const TypeIcon = resourceTypeIcons[resource.type];
                      return (
                        <TableRow key={resource.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium py-3">{resource.name}</TableCell>
                          <TableCell className="py-3">
                            <Badge variant="outline" className="text-xs">
                              <TypeIcon className="mr-1.5 h-3.5 w-3.5" />
                              {resource.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge className={cn('text-xs', resourceStatusColors[resource.status])}>
                              {resource.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {resource.type === 'Personnel' && resource.skills && `Skills: ${resource.skills.join(', ')}`}
                            {(resource.type === 'Equipment' || resource.type === 'Facility') && resource.location && `Location: ${resource.location}`}
                            {(resource.type === 'Equipment' || resource.type === 'Facility') && resource.capacity && ` | Capacity: ${resource.capacity}`}
                          </TableCell>
                          <TableCell className="py-3">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingResource(resource); setIsResourceModalOpen(true); }}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteResource(resource.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="ml-2 h-8 text-xs" onClick={() => { setEditingResource(resource); setEditingAllocation(null); setIsAllocationModalOpen(true); }}>
                              <PlusCircle className="mr-1 h-3.5 w-3.5" /> Allocate
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Resource Allocations</CardTitle>
              <CardDescription>Timeline of resource assignments to projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Effort/Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No resource allocations found.</p>
                                <p className="text-xs text-muted-foreground">Try allocating a resource from the 'Resources' tab.</p>
                            </TableCell>
                        </TableRow>
                    )}
                    {allocations.sort((a,b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()).map(alloc => (
                      <TableRow key={alloc.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium py-3">{getResourceName(alloc.resourceId)}</TableCell>
                        <TableCell className="py-3">{getProjectName(alloc.projectId)}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{formatDateRange(alloc.startDate, alloc.endDate)}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {alloc.effortPercentage && <span>{alloc.effortPercentage}% Effort</span>}
                          {alloc.effortPercentage && alloc.role && ' | '}
                          {alloc.role && <span>Role: {alloc.role}</span>}
                          {!alloc.effortPercentage && !alloc.role && (resources.find(r=>r.id === alloc.resourceId)?.type !== 'Personnel') && <span className="italic">N/A (Equipment/Facility)</span>}
                        </TableCell>
                        <TableCell className="py-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAllocation(alloc); setIsAllocationModalOpen(true); }}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteAllocation(alloc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resource Modal */}
      <Dialog open={isResourceModalOpen} onOpenChange={setIsResourceModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {editingResource ? 'Update the details of this resource.' : 'Enter details for the new resource.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={resourceForm.handleSubmit(handleSaveResource)} className="space-y-4 py-2">
             <Controller
                name="name"
                control={resourceForm.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label htmlFor="resourceName">Name</Label>
                    <Input id="resourceName" placeholder="Resource name (e.g., John Doe, Server X)" {...field} />
                    {resourceForm.formState.errors.name && <p className="text-xs text-destructive">{resourceForm.formState.errors.name.message}</p>}
                  </div>
                )}
              />
             <Controller
                name="type"
                control={resourceForm.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label htmlFor="resourceType">Type</Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <ShadCNFormControl>
                        <SelectTrigger id="resourceType"><SelectValue placeholder="Select type" /></SelectTrigger>
                      </ShadCNFormControl>
                      <SelectContent>
                          {(['Personnel', 'Equipment', 'Facility'] as ResourceType[]).map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {resourceForm.formState.errors.type && <p className="text-xs text-destructive">{resourceForm.formState.errors.type.message}</p>}
                  </div>
                )}
              />
               <Controller
                name="status"
                control={resourceForm.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label htmlFor="resourceStatus">Status</Label>
                     <Select onValueChange={field.onChange} value={field.value}>
                       <ShadCNFormControl>
                          <SelectTrigger id="resourceStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
                       </ShadCNFormControl>
                        <SelectContent>
                            {(['Available', 'Partially Allocated', 'Fully Allocated', 'Maintenance'] as ResourceStatus[]).map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {resourceForm.formState.errors.status && <p className="text-xs text-destructive">{resourceForm.formState.errors.status.message}</p>}
                  </div>
                )}
              />
              {resourceForm.watch('type') === 'Personnel' && (
                <Controller
                    name="skills"
                    control={resourceForm.control}
                    render={({ field }) => (
                    <div className="space-y-1">
                        <Label htmlFor="resourceSkills">Skills (comma-separated)</Label>
                        <Input id="resourceSkills" placeholder="e.g., React, Python, Project Management" {...field} />
                    </div>
                    )}
                />
              )}
              {(resourceForm.watch('type') === 'Equipment' || resourceForm.watch('type') === 'Facility') && (
                <>
                <Controller
                    name="location"
                    control={resourceForm.control}
                    render={({ field }) => (
                    <div className="space-y-1">
                        <Label htmlFor="resourceLocation">Location</Label>
                        <Input id="resourceLocation" placeholder="e.g., Data Center A, Building 2" {...field} />
                    </div>
                    )}
                />
                <Controller
                    name="capacity"
                    control={resourceForm.control}
                    render={({ field }) => (
                    <div className="space-y-1">
                        <Label htmlFor="resourceCapacity">Capacity (Optional)</Label>
                        <Input id="resourceCapacity" type="number" placeholder="e.g., 10 units, 20 seats" {...field} />
                    </div>
                    )}
                />
                </>
              )}
              <Controller
                name="notes"
                control={resourceForm.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label htmlFor="resourceNotes">Notes (Optional)</Label>
                    <Textarea id="resourceNotes" placeholder="Any additional notes..." {...field} rows={3} />
                  </div>
                )}
              />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsResourceModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={resourceForm.formState.isSubmitting}>
                {resourceForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Allocation Modal */}
      <Dialog open={isAllocationModalOpen} onOpenChange={setIsAllocationModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAllocation ? 'Edit Allocation' : 'New Allocation'}</DialogTitle>
            <DialogDescription>
              {editingAllocation ? 'Update details for this resource allocation.' : `Allocate ${getResourceName(editingResource?.id || allocationForm.getValues('resourceId')) || 'resource'} to a project.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={allocationForm.handleSubmit(handleSaveAllocation)} className="space-y-4 py-2">
            <Controller
                name="resourceId"
                control={allocationForm.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label htmlFor="allocationResource">Resource</Label>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!editingResource}>
                      <ShadCNFormControl>
                        <SelectTrigger id="allocationResource"><SelectValue placeholder="Select resource" /></SelectTrigger>
                      </ShadCNFormControl>
                      <SelectContent>
                            {resources.map(res => (
                                <SelectItem key={res.id} value={res.id}>{res.name} ({res.type})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {allocationForm.formState.errors.resourceId && <p className="text-xs text-destructive">{allocationForm.formState.errors.resourceId.message}</p>}
                  </div>
                )}
              />
             <Controller
                name="projectId"
                control={allocationForm.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label htmlFor="allocationProject">Project</Label>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <ShadCNFormControl>
                            <SelectTrigger id="allocationProject"><SelectValue placeholder="Select project" /></SelectTrigger>
                        </ShadCNFormControl>
                        <SelectContent>
                            {projects.map(proj => (
                                <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {allocationForm.formState.errors.projectId && <p className="text-xs text-destructive">{allocationForm.formState.errors.projectId.message}</p>}
                  </div>
                )}
              />
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="startDate"
                    control={allocationForm.control}
                    render={({ field }) => (
                    <div className="space-y-1">
                        <Label htmlFor="allocationStartDate">Start Date</Label>
                        <Input id="allocationStartDate" type="date" {...field} />
                        {allocationForm.formState.errors.startDate && <p className="text-xs text-destructive">{allocationForm.formState.errors.startDate.message}</p>}
                    </div>
                    )}
                />
                 <Controller
                    name="endDate"
                    control={allocationForm.control}
                    render={({ field }) => (
                    <div className="space-y-1">
                        <Label htmlFor="allocationEndDate">End Date</Label>
                        <Input id="allocationEndDate" type="date" {...field} />
                        {allocationForm.formState.errors.endDate && <p className="text-xs text-destructive">{allocationForm.formState.errors.endDate.message}</p>}
                    </div>
                    )}
                />
            </div>
            {resources.find(r => r.id === allocationForm.watch('resourceId'))?.type === 'Personnel' && (
                 <>
                 <Controller
                    name="effortPercentage"
                    control={allocationForm.control}
                    render={({ field }) => (
                    <div className="space-y-1">
                        <Label htmlFor="allocationEffort">Effort (%) (Optional)</Label>
                        <Input id="allocationEffort" type="number" placeholder="0-100" {...field} />
                        {allocationForm.formState.errors.effortPercentage && <p className="text-xs text-destructive">{allocationForm.formState.errors.effortPercentage.message}</p>}
                    </div>
                    )}
                />
                 <Controller
                    name="role"
                    control={allocationForm.control}
                    render={({ field }) => (
                    <div className="space-y-1">
                        <Label htmlFor="allocationRole">Role (Optional)</Label>
                        <Input id="allocationRole" placeholder="e.g., Developer, QA Lead" {...field} />
                    </div>
                    )}
                />
                </>
            )}
             <Controller
                name="notes"
                control={allocationForm.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label htmlFor="allocationNotes">Notes (Optional)</Label>
                    <Textarea id="allocationNotes" placeholder="Allocation specific notes..." {...field} rows={3} />
                  </div>
                )}
              />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAllocationModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={allocationForm.formState.isSubmitting}>
                {allocationForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Allocation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Helper for Input with icon
const InputWithIcon = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <Input ref={ref} className={cn("pl-10", className)} {...props} />
      </div>
    );
  }
);
InputWithIcon.displayName = "InputWithIcon";

