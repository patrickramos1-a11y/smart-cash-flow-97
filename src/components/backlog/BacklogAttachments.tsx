import { useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, FileText, Image, File, Trash2, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BacklogAttachment,
  useUploadBacklogAttachment,
  useDeleteBacklogAttachment
} from '@/hooks/useBacklog';

interface BacklogAttachmentsProps {
  itemId: string;
  attachments: BacklogAttachment[];
}

const getFileIcon = (type: string | null) => {
  if (!type) return <File className="h-8 w-8" />;
  if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
  if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
  return <File className="h-8 w-8 text-gray-500" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function BacklogAttachments({ itemId, attachments }: BacklogAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadBacklogAttachment();
  const deleteAttachment = useDeleteBacklogAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await uploadAttachment.mutateAsync({ itemId, file });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (confirm('Tem certeza que deseja remover este anexo?')) {
      await deleteAttachment.mutateAsync({ id: attachmentId, itemId });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex justify-end">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadAttachment.isPending ? 'Enviando...' : 'Adicionar Anexo'}
        </Button>
      </div>

      {/* Attachments Grid */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Preview/Icon */}
                  <div className="flex-shrink-0">
                    {attachment.file_type?.startsWith('image/') ? (
                      <img
                        src={attachment.file_path}
                        alt={attachment.file_name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        {getFileIcon(attachment.file_type)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={attachment.file_name}>
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(attachment.file_size)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(attachment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={attachment.file_path} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={attachment.file_path} download={attachment.file_name}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deleteAttachment.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum anexo</p>
            <p className="text-sm">Clique no botão acima para adicionar arquivos</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
