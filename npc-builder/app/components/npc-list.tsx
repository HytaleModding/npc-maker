import React from "react";
import NpcCard from "./npc-card";
import { Npc } from "../types/npc";

interface NpcListProps {
  npcs: Npc[];
  onEdit: (npc: Npc) => void;
  onDelete: (npcId: string) => void;
}

const NpcList: React.FC<NpcListProps> = ({ npcs, onEdit, onDelete }) => {
  return (
    <div className="flex flex-col gap-4">
      {npcs.map((npc) => (
        <NpcCard key={npc.id} npc={npc} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default NpcList;