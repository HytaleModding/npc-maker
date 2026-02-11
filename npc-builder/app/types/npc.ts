export interface NPC {
  id: string;
  name: string;
  type: string;
  abilities: string[];
  behaviors: string[];
  description?: string;
  health: number;
  attack: number;
  defense: number;
  speed: number;
}