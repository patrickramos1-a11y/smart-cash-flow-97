import { useState } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BacklogProject,
  BacklogModule,
  useBacklogProjects,
  useBacklogModules,
  useCreateBacklogProject,
  useUpdateBacklogProject,
  useCreateBacklogModule
} from '@/hooks/useBacklog';

export function BacklogSettings() {
  const { data: projects, isLoading: loadingProjects } = useBacklogProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: modules } = useBacklogModules(selectedProjectId || undefined);

  const createProject = useCreateBacklogProject();
  const updateProject = useUpdateBacklogProject();
  const createModule = useCreateBacklogModule();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<BacklogProject | null>(null);

  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [moduleForm, setModuleForm] = useState({ name: '' });

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;

    if (editingProject) {
      await updateProject.mutateAsync({
        id: editingProject.id,
        name: projectForm.name,
        description: projectForm.description || null
      });
    } else {
      await createProject.mutateAsync({
        name: projectForm.name,
        description: projectForm.description || undefined
      });
    }

    setProjectDialogOpen(false);
    setProjectForm({ name: '', description: '' });
    setEditingProject(null);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.name || !selectedProjectId) return;

    await createModule.mutateAsync({
      project_id: selectedProjectId,
      name: moduleForm.name
    });

    setModuleDialogOpen(false);
    setModuleForm({ name: '' });
  };

  const openEditProject = (project: BacklogProject) => {
    setEditingProject(project);
    setProjectForm({ name: project.name, description: project.description || '' });
    setProjectDialogOpen(true);
  };

  const openNewProject = () => {
    setEditingProject(null);
    setProjectForm({ name: '', description: '' });
    setProjectDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Projetos
          </CardTitle>
          <Button size="sm" onClick={openNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </CardHeader>
        <CardContent>
          {loadingProjects ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedProjectId === project.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge variant={project.active ? 'default' : 'secondary'}>
                          {project.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditProject(project);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum projeto cadastrado</p>
              <p className="text-sm">Crie o primeiro projeto para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Módulos
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setModuleDialogOpen(true)}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
        </CardHeader>
        <CardContent>
          {!selectedProjectId ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um projeto</p>
              <p className="text-sm">Escolha um projeto para ver seus módulos</p>
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="space-y-2">
              {modules.map(module => (
                <div
                  key={module.id}
                  className="p-3 rounded-lg border flex items-center justify-between"
                >
                  <span className="font-medium">{module.name}</span>
                  <Badge variant={module.active ? 'default' : 'secondary'}>
                    {module.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum módulo</p>
              <p className="text-sm">Adicione módulos para este projeto</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProjectSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome *</Label>
              <Input
                id="project-name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="Nome do projeto"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Descrição</Label>
              <Textarea
                id="project-description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Descrição do projeto"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProject.isPending || updateProject.isPending}>
                {editingProject ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Módulo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleModuleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="module-name">Nome *</Label>
              <Input
                id="module-name"
                value={moduleForm.name}
                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                placeholder="Nome do módulo"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModuleDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createModule.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
