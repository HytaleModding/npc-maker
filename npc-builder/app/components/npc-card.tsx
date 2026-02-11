import React from "react";
import { NPC } from "../types/npc";

interface NPCCardProps {
  npc: NPC;
  onEdit: () => void;
  onDelete: () => void;
}

const NPCCard: React.FC<NPCCardProps> = ({ npc, onEdit, onDelete }) => {
  return (
    <div className="border rounded-lg p-4 shadow-md bg-white dark:bg-gray-800">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{npc.name}</h2>
      <p className="text-gray-700 dark:text-gray-300">Type: {npc.type}</p>
      <p className="text-gray-700 dark:text-gray-300">Abilities: {npc.abilities.join(", ")}</p>
      <p className="text-gray-700 dark:text-gray-300">Behaviors: {npc.behaviors.join(", ")}</p>
      <div className="mt-4 flex justify-between">
        <button onClick={onEdit} className="text-blue-500 hover:underline">Edit</button>
        <button onClick={onDelete} className="text-red-500 hover:underline">Delete</button>
      </div>
    </div>
  );
};

export default NPCCard;