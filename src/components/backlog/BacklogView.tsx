import { useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  useBacklogItems, 
  BacklogFilters as FiltersType,
  BacklogItem 
} from '@/hooks/useBacklog';
import { BacklogIndicators } from './BacklogIndicators';
import { BacklogFilters } from './BacklogFilters';
import { BacklogList } from './BacklogList';
import { BacklogKanban } from './BacklogKanban';
import { BacklogItemModal } from './BacklogItemModal';
import { BacklogItemDetail } from './BacklogItemDetail';
import { BacklogSettings } from './BacklogSettings';

export function BacklogView() {
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState<FiltersType>({});
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);

  const { data: items, isLoading } = useBacklogItems(filters);

  const handleItemClick = (item: BacklogItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleEditClick = (item: BacklogItem) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const handleDetailEdit = () => {
    if (selectedItem) {
      setEditingItem(selectedItem);
      setDetailModalOpen(false);
      setItemModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Backlog de Produto</h1>
            <p className="text-sm text-muted-foreground">Planejamento e controle de melhorias</p>
          </div>
        </div>
        <Button onClick={handleNewItem}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Indicators */}
      <BacklogIndicators />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <BacklogFilters filters={filters} onFiltersChange={setFilters} />
          <BacklogList
            items={items || []}
            isLoading={isLoading}
            onItemClick={handleItemClick}
            onEditClick={handleEditClick}
          />
        </TabsContent>

        <TabsContent value="kanban">
          <BacklogKanban onItemClick={handleItemClick} />
        </TabsContent>

        <TabsContent value="settings">
          <BacklogSettings />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BacklogItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        item={editingItem}
      />

      <BacklogItemDetail
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        itemId={selectedItem?.id || null}
        onEditClick={handleDetailEdit}
      />
    </div>
  );
}
