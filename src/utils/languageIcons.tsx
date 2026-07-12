/**
 * Premium Language Icon Helper
 * Returns colored SVG icon components for each file type.
 */
import React from 'react';

interface IconProps {
  className?: string;
  title?: string;
}

// SVG-based file type icons
const HtmlIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <path d="M4 3l1.5 17L12 22l6.5-2L20 3H4z" fill="#E44D26" opacity="0.85"/>
    <path d="M12 20.5l5.3-1.5 1.3-14.5H12v16z" fill="#F16529" opacity="0.85"/>
    <path d="M12 12.5H9.5l-.2-2.5H12v-2.5H7L7.5 14H12v-1.5zm0 4.5l-2.8-.8-.2-2H6.5l.4 4L12 19.5v-2.5z" fill="white"/>
    <path d="M12 12.5v1.5h2.3l-.2 2L12 16.8v2.7l3.4-1 .5-5.5H12zm.5-5H12v2.5h2.7l-.2 2H12v2.5h2.6l-.5-5H12.5z" fill="white" opacity="0.7"/>
  </svg>
);

const CssIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <path d="M4 3l1.5 17L12 22l6.5-2L20 3H4z" fill="#264DE4" opacity="0.85"/>
    <path d="M12 20.5l5.3-1.5 1.3-14.5H12v16z" fill="#2965F1" opacity="0.85"/>
    <path d="M8.5 8H12V5.5H6l.5 5H12v-2H8.5zm-1.5 4L7.3 16l4.7 1.3v-2.5L8.5 14l-.2-2H7z" fill="white"/>
    <path d="M12 8v2h3L14.8 14l-2.8.7V17l5-1.5.8-7.5H12z" fill="white" opacity="0.7"/>
  </svg>
);

const JsIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#F7DF1E" opacity="0.9"/>
    <path d="M6 17.5c.4.7 1 1.2 2 1.2 1.2 0 2-.6 2-2.5V12H8v4.2c0 .9-.4 1.2-.9 1.2-.5 0-.8-.3-1.1-.7L6 17.5zm5.5.3c.5.9 1.3 1.4 2.5 1.4 1.4 0 2.3-.7 2.3-1.8 0-1-.6-1.6-2-2.1l-.6-.3c-.7-.3-1-.5-1-.9 0-.4.3-.6.8-.6.5 0 .8.2 1.1.7l1.3-.8c-.5-.9-1.3-1.3-2.4-1.3-1.3 0-2.2.7-2.2 1.8 0 1 .6 1.6 1.8 2.1l.6.3c.8.3 1.1.5 1.1 1s-.4.7-1 .7c-.7 0-1.1-.4-1.4-1l-1.4.8z" fill="#000" opacity="0.85"/>
  </svg>
);

const TsIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#3178C6" opacity="0.9"/>
    <path d="M13.5 12h-3V10.5H17V12h-3V19h-2V12h-1.5z" fill="white" opacity="0.9"/>
    <path d="M18 15.5c0 1 .8 1.6 2 2v-1.2c-.5-.2-.8-.5-.8-.8 0-.7.9-1 1.8-1.5V12.5c-1.7.5-3 1.3-3 3z" fill="white" opacity="0.6"/>
    <path d="M17 10.5v-1H14V8h5v1.5h-2V12h-2v-1.5H17z" fill="white" opacity="0.9"/>
  </svg>
);

const JsxIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#F7DF1E" opacity="0.9"/>
    <text x="3" y="17" fontSize="11" fontWeight="bold" fill="#333" fontFamily="monospace">JSX</text>
  </svg>
);

const TsxIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#3178C6" opacity="0.9"/>
    <text x="2" y="17" fontSize="10" fontWeight="bold" fill="white" fontFamily="monospace">TSX</text>
  </svg>
);

const PyIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <path d="M12 2C8.5 2 8 3.5 8 5v2h4v1H6C4.3 8 3 9.3 3 11v3c0 1.7 1.3 3 3 3h1.5v-2C7.5 13.3 8.8 12 10.5 12H14c1.7 0 3-1.3 3-3V6c0-1.7-1.3-3-3-3h-2zm-1 2.5a1 1 0 11-2 0 1 1 0 012 0z" fill="#3776AB" opacity="0.9"/>
    <path d="M12 22c3.5 0 4-1.5 4-3v-2h-4v-1h6c1.7 0 3-1.3 3-3v-3c0-1.7-1.3-3-3-3h-1.5v2c0 1.7-1.3 3-3 3h-3.5c-1.7 0-3 1.3-3 3v3c0 1.7 1.3 3 3 3h2zm1-2.5a1 1 0 110 2 1 1 0 010-2z" fill="#FFD43B" opacity="0.9"/>
  </svg>
);

const CIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#5C6BC0" opacity="0.9"/>
    <path d="M16.5 14.5c-.5 1.5-2 2.5-3.5 2.5-2.5 0-4.5-2-4.5-5s2-5 4.5-5c1.5 0 3 1 3.5 2.5H14c-.3-.7-1-1-1.5-1-1.3 0-2.5 1.3-2.5 3.5s1.2 3.5 2.5 3.5c.6 0 1.2-.4 1.5-1h2.5z" fill="white"/>
  </svg>
);

const CppIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#00599C" opacity="0.9"/>
    <path d="M13 14c-.4 1.2-1.5 2-3 2-2 0-3.5-1.8-3.5-4s1.5-4 3.5-4c1.5 0 2.6.8 3 2H11c-.3-.5-.7-.8-1-.8-1 0-2 1.1-2 2.8s1 2.8 2 2.8c.4 0 .8-.3 1-.8h2zm2-2v-1h1v-1h1v1h1v1h-1v1h-1v-1h-1zm4 0v-1h1v-1h1v1h1v1h-1v1h-1v-1h-1z" fill="white"/>
  </svg>
);

const MdIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#4A5568" opacity="0.85"/>
    <path d="M4 8h2l2 4 2-4h2v8H10v-4.5L8 15 6 11.5V16H4V8zm10 0h2l2 3 2-3h1v4l-1 1h-1v-1l1-1v-2.5l-2 3-2-3V12l1 1v1h-1l-1-1V8z" fill="white" opacity="0.85"/>
  </svg>
);

const JsonIcon = ({ className, title }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect width="24" height="24" rx="3" fill="#292929" opacity="0.9"/>
    <text x="2" y="17" fontSize="9" fontWeight="bold" fill="#F0C674" fontFamily="monospace">JSON</text>
  </svg>
);

const ImageIcon = ({ className, title }: IconProps) => (
  <svg className={`${className} text-purple-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FileIcon = ({ className, title }: IconProps) => (
  <svg className={`${className} text-editor-text-dim`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg" aria-label={title}>
    <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FolderClosedIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-yellow-400`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" opacity="0.85"/>
  </svg>
);

const FolderOpenIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-yellow-300`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" opacity="0.7"/>
    <path d="M2 11h20v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8z" opacity="0.9"/>
  </svg>
);

// Special folder icons for common directories
const getSpecialFolderIcon = (name: string, isOpen: boolean, className?: string) => {
  const lname = name.toLowerCase();
  const size = className || 'w-4 h-4';
  if (lname === 'src' || lname === 'source') return isOpen ? <FolderOpenIcon className={size} /> : <FolderClosedIcon className={size} />;
  if (lname === 'components') return <svg className={`${size} text-cyan-400`} viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="8" width="7" height="7" rx="1" opacity="0.8"/><rect x="14" y="8" width="7" height="7" rx="1" opacity="0.8"/><rect x="8" y="3" width="8" height="4" rx="1" opacity="0.6"/><path d="M12 12v6M8 18h8" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>;
  if (lname === 'public') return <svg className={`${size} text-green-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>;
  if (lname === 'assets' || lname === 'images' || lname === 'img') return <svg className={`${size} text-purple-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21"/></svg>;
  if (lname === 'api' || lname === 'routes') return <svg className={`${size} text-orange-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
  if (lname === 'styles' || lname === 'css' || lname === 'scss') return <svg className={`${size} text-blue-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h8"/></svg>;
  if (lname === 'node_modules') return <svg className={`${size} text-red-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
  return isOpen ? <FolderOpenIcon className={size} /> : <FolderClosedIcon className={size} />;
};

/**
 * Returns a JSX icon for a file based on its name/extension.
 * For folders, pass isFolder=true and isOpen to get the right icon.
 */
export const getFileLanguageIcon = (
  fileName: string,
  className = 'w-4 h-4',
  options?: { isFolder?: boolean; isOpen?: boolean }
) => {
  if (options?.isFolder) {
    return getSpecialFolderIcon(fileName, options.isOpen ?? false, className);
  }

  const ext = fileName.split('.').pop()?.toLowerCase();
  const baseName = fileName.toLowerCase();

  // Special file names
  if (baseName === 'package.json' || baseName === 'package-lock.json') return <JsonIcon className={className} title="package.json" />;
  if (baseName === '.env' || baseName.startsWith('.env.')) return <FileIcon className={className} title=".env" />;
  if (baseName === 'readme.md' || baseName === 'readme') return <MdIcon className={className} title="README" />;

  switch (ext) {
    case 'html': case 'htm':    return <HtmlIcon className={className} title="HTML" />;
    case 'css': case 'scss': case 'sass': case 'less': return <CssIcon className={className} title="CSS" />;
    case 'jsx':                 return <JsxIcon className={className} title="JSX" />;
    case 'js': case 'mjs': case 'cjs': return <JsIcon className={className} title="JavaScript" />;
    case 'tsx':                 return <TsxIcon className={className} title="TSX" />;
    case 'ts':                  return <TsIcon className={className} title="TypeScript" />;
    case 'py': case 'pyw':      return <PyIcon className={className} title="Python" />;
    case 'c': case 'h':         return <CIcon className={className} title="C" />;
    case 'cpp': case 'cc': case 'cxx': case 'hpp': return <CppIcon className={className} title="C++" />;
    case 'md': case 'mdx':      return <MdIcon className={className} title="Markdown" />;
    case 'json':                return <JsonIcon className={className} title="JSON" />;
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': case 'avif':
      return <ImageIcon className={className} title="Image" />;
    default:
      return <FileIcon className={className} title={ext ?? 'file'} />;
  }
};

export { FolderClosedIcon, FolderOpenIcon };
