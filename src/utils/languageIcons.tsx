/**
 * Language icon helper — uses emoji/text icons (no external icon library dependency).
 * Returns a small colored span element for each language extension.
 */
export const getFileLanguageIcon = (fileName: string, className = 'w-4 h-4') => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const base = `text-xs font-bold flex-shrink-0 flex items-center justify-center ${className}`;

  switch (ext) {
    case 'html':
      return <span className={`${base} text-orange-400`} title="HTML">{'H'}</span>;
    case 'css':
      return <span className={`${base} text-blue-400`} title="CSS">{'C'}</span>;
    case 'js':
    case 'jsx':
      return <span className={`${base} text-yellow-400`} title="JavaScript">{'J'}</span>;
    case 'ts':
    case 'tsx':
      return <span className={`${base} text-blue-500`} title="TypeScript">{'T'}</span>;
    case 'py':
      return <span className={`${base} text-green-400`} title="Python">{'P'}</span>;
    case 'c':
    case 'h':
      return <span className={`${base} text-cyan-400`} title="C">{'C'}</span>;
    case 'cpp':
    case 'hpp':
    case 'cc':
      return <span className={`${base} text-blue-400`} title="C++">{'C+'}</span>;
    case 'md':
      return <span className={`${base} text-gray-400`} title="Markdown">{'M'}</span>;
    case 'json':
      return <span className={`${base} text-yellow-600`} title="JSON">{'J'}</span>;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <span className={`${base} text-purple-400`} title="Image">{'I'}</span>;
    default:
      return <span className={`${base} text-editor-text-dim`} title={ext ?? 'file'}>{'f'}</span>;
  }
};
