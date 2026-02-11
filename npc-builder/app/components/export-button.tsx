import React from 'react';

interface ExportButtonProps {
  data: any; // Replace 'any' with the appropriate type for your NPC data
}

const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {
  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'npc-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex h-12 w-full items-center justify-center rounded-full bg-blue-500 px-5 text-white transition-colors hover:bg-blue-600"
    >
      Export NPC Data
    </button>
  );
};

export default ExportButton;