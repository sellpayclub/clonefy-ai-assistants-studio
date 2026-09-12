export type SalesMediaUploadType = 'text' | 'audio' | 'image' | 'video' | 'document';

type MediaRule = {
  maxBytes: number;
  formats: string;
  extensions: string[];
  accept: string;
  hint: string;
};

const MB = 1024 * 1024;

export const salesMediaRules: Record<Exclude<SalesMediaUploadType, 'text'>, MediaRule> = {
  audio: {
    maxBytes: 16 * MB,
    formats: 'MP3, M4A, AAC, AMR, OGG ou WebM gravado no navegador',
    extensions: ['mp3', 'm4a', 'aac', 'amr', 'ogg', 'webm'],
    accept: '.mp3,.m4a,.aac,.amr,.ogg,.webm,audio/*',
    hint: 'MP3 pode ser enviado diretamente. Áudios gravados pelo navegador são tratados pela Evolution como mensagem de voz.',
  },
  image: {
    maxBytes: 5 * MB,
    formats: 'JPG, JPEG ou PNG',
    extensions: ['jpg', 'jpeg', 'png'],
    accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
    hint: 'Use imagens RGB/RGBA. Não há largura máxima fixa; o limite principal é 5 MB.',
  },
  video: {
    maxBytes: 16 * MB,
    formats: 'MP4 ou 3GP',
    extensions: ['mp4', '3gp'],
    accept: '.mp4,.3gp,video/mp4,video/3gpp',
    hint: 'Para maior compatibilidade, use vídeo H.264 com áudio AAC.',
  },
  document: {
    maxBytes: 100 * MB,
    formats: 'PDF, TXT, DOC, DOCX, XLS, XLSX, PPT ou PPTX',
    extensions: ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    accept: '.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
    hint: 'O documento é enviado com o nome original do arquivo.',
  },
};

export const formatFileSize = (bytes: number) => {
  if (bytes >= MB) return `${(bytes / MB).toFixed(bytes % MB === 0 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
};

export const validateSalesFile = (file: File, mediaType: SalesMediaUploadType) => {
  if (mediaType === 'text') return null;
  const rule = salesMediaRules[mediaType];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (!rule.extensions.includes(extension)) {
    return `Formato não aceito. Use ${rule.formats}.`;
  }
  if (file.size <= 0) return 'O arquivo está vazio.';
  if (file.size > rule.maxBytes) {
    return `Arquivo muito grande: ${formatFileSize(file.size)}. O limite para este tipo é ${formatFileSize(rule.maxBytes)}.`;
  }
  return null;
};
