import { FileText } from 'lucide-react';
import { FaJava, FaPython } from 'react-icons/fa';
import { SiC, SiCplusplus, SiTypescript, SiJavascript, SiHtml5, SiCss3, SiJson } from 'react-icons/si';

export const getFileLanguageIcon = (fileName: string, className = 'w-4 h-4') => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'java':
      return <FaJava className={`${className} text-orange-500`} />;
    case 'py':
      return <FaPython className={`${className} text-yellow-400`} />;
    case 'c':
      return <SiC className={`${className} text-blue-400`} />;
    case 'cpp':
    case 'hpp':
      return <SiCplusplus className={`${className} text-blue-500`} />;
    case 'ts':
    case 'tsx':
      return <SiTypescript className={`${className} text-blue-600`} />;
    case 'js':
    case 'jsx':
      return <SiJavascript className={`${className} text-yellow-500`} />;
    case 'html':
      return <SiHtml5 className={`${className} text-orange-500`} />;
    case 'css':
      return <SiCss3 className={`${className} text-blue-500`} />;
    case 'json':
      return <SiJson className={`${className} text-green-500`} />;
    case 'md':
      return <FileText className={`${className} text-gray-400`} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <span className={`${className} text-purple-400`}>🖼</span>;
    default:
      return <FileText className={`${className} text-editor-text-muted`} />;
  }
};
