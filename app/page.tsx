'use client';

import { useState, useCallback } from 'react';
import { Download, Plus, Trash2, Copy, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const HelpTooltip = ({ children }: { children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help ml-1" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>{children}</p>
    </TooltipContent>
  </Tooltip>
);

interface Parameter {
  Value: any;
  Description: string;
}

interface MotionController {
  Type: string;
  MaxWalkSpeed?: number;
  Gravity?: number;
  MaxFallSpeed?: number;
  Acceleration?: number;
}

interface Action {
  Type: string;
  [key: string]: any;
}

interface StateTransition {
  States: Array<{
    From: string[];
    To: string[];
  }>;
  Actions: Action[];
}

interface Sensor {
  Type: string;
  [key: string]: any;
}

interface Instruction {
  Sensor?: Sensor;
  Instructions?: Instruction[];
  Actions?: Action[];
  Continue?: boolean;
  ActionsBlocking?: boolean;
  Reference?: string;
  Modify?: any;
  HeadMotion?: any;
  BodyMotion?: any;
}

interface InteractionVar {
  Interactions: Array<{
    Parent?: string;
    Type?: string;
    DamageCalculator?: any;
    [key: string]: any;
  }>;
}

interface NPCData {
  $Comment?: string;
  Debug?: string;
  Type: 'Abstract' | 'Variant' | 'Simple';
  Reference?: string;
  Parameters: Record<string, Parameter>;
  Appearance?: any;
  DropList?: any;
  MaxHealth?: any;
  StartState?: string;
  DefaultPlayerAttitude?: 'Hostile' | 'Friendly' | 'Neutral' | 'Ignore';
  DefaultNPCAttitude?: 'Hostile' | 'Friendly' | 'Neutral' | 'Ignore';
  AttitudeGroup?: any;
  KnockbackScale?: number;
  MotionControllerList?: MotionController[];
  InteractionVars?: Record<string, InteractionVar>;
  StateTransitions?: StateTransition[];
  Instructions?: Instruction[];
  NameTranslationKey?: any;
  Modify?: any;
}

const defaultNPC: NPCData = {
  $Comment: "Debug: DisplayState",
  Debug: "DisplayState",
  Type: "Abstract",
  Parameters: {
    Appearance: {
      Value: "Bear_Grizzly",
      Description: "Model to be used"
    },
    DropList: {
      Value: "Empty",
      Description: "Drop Items"
    },
    MaxHealth: {
      Value: 100,
      Description: "Max health for the NPC"
    },
    EatItem: {
      Value: "Food_Beef_Raw",
      Description: "The item this NPC will find when it rummages for food"
    },
    ViewRange: {
      Value: 15,
      Description: "View range in blocks"
    },
    ViewSector: {
      Value: 180,
      Description: "View sector in degrees"
    },
    HearingRange: {
      Value: 8,
      Description: "Hearing range in blocks"
    },
    AlertedRange: {
      Value: 30,
      Description: "A range within which the player can be seen/sensed when the NPC is alerted to their presence"
    },
    AttackDistance: {
      Value: 2,
      Description: "The distance at which an NPC will execute attacks"
    },
    LeashDistance: {
      Value: 20,
      Description: "The range after which an NPC will start to want to return to their spawn point."
    },
    NameTranslationKey: {
      Value: "server.npcRoles.Template.name",
      Description: "Translation key for NPC name display"
    }
  },
  Appearance: { Compute: "Appearance" },
  DropList: { Compute: "DropList" },
  MaxHealth: { Compute: "MaxHealth" },
  StartState: "Idle",
  DefaultPlayerAttitude: "Hostile",
  DefaultNPCAttitude: "Ignore",
  KnockbackScale: 0.5,
  MotionControllerList: [
    {
      Type: "Walk",
      MaxWalkSpeed: 3,
      Gravity: 10,
      MaxFallSpeed: 8,
      Acceleration: 10
    }
  ],
  InteractionVars: {
    Melee_Damage: {
      Interactions: [
        {
          Parent: "NPC_Attack_Melee_Damage",
          DamageCalculator: {
            Type: "Absolute",
            BaseDamage: {
              Physical: 10
            },
            RandomPercentageModifier: 0.1
          }
        }
      ]
    }
  },
  StateTransitions: [
    {
      States: [
        {
          From: ["Idle"],
          To: ["Sleep"]
        }
      ],
      Actions: [
        {
          Type: "PlayAnimation",
          Slot: "Status",
          Animation: "Laydown"
        },
        {
          Type: "Timeout",
          Delay: [1, 1]
        }
      ]
    }
  ],
  Instructions: [
    {
      Sensor: {
        Type: "State",
        State: "Idle"
      },
      Instructions: [
        {
          Continue: true,
          Sensor: {
            Type: "Any",
            Once: true
          },
          Actions: [
            {
              Type: "Inventory",
              Operation: "EquipHotbar",
              Slot: 0,
              UseTarget: false
            }
          ]
        }
      ]
    }
  ],
  NameTranslationKey: { Compute: "NameTranslationKey" }
};

export default function NPCBuilder() {
  const [npc, setNPC] = useState<NPCData>(defaultNPC);
  const [activeTab, setActiveTab] = useState<'basic' | 'parameters' | 'states' | 'instructions'>('basic');
  const [parameterRenameTimeouts, setParameterRenameTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [parameterInputValues, setParameterInputValues] = useState<Record<string, string>>({});

  const updateNPC = (field: keyof NPCData, value: any) => {
    setNPC(prev => ({ ...prev, [field]: value }));
  };

  const updateParameter = (key: string, field: 'Value' | 'Description', value: any) => {
    setNPC(prev => ({
      ...prev,
      Parameters: {
        ...prev.Parameters,
        [key]: {
          ...prev.Parameters[key],
          [field]: value
        }
      }
    }));
  };

  const addParameter = () => {
    const key = `NewParameter_${Object.keys(npc.Parameters).length + 1}`;
    setNPC(prev => ({
      ...prev,
      Parameters: {
        ...prev.Parameters,
        [key]: {
          Value: "",
          Description: "New parameter description"
        }
      }
    }));
  };

  const removeParameter = (key: string) => {
    setNPC(prev => {
      const newParams = { ...prev.Parameters };
      delete newParams[key];
      return { ...prev, Parameters: newParams };
    });
  };

  const renameParameter = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey.trim()) return;
    
    setNPC(prev => {
      const newParams = { ...prev.Parameters };
      const parameterData = newParams[oldKey];
      
      if (!newParams[newKey]) {
        newParams[newKey] = parameterData;
        delete newParams[oldKey];
      }
      
      return { ...prev, Parameters: newParams };
    });
  };

  const debouncedRenameParameter = useCallback((oldKey: string, newKey: string) => {
    if (parameterRenameTimeouts[oldKey]) {
      clearTimeout(parameterRenameTimeouts[oldKey]);
    }

    const timeoutId = setTimeout(() => {
      renameParameter(oldKey, newKey);
      setParameterRenameTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[oldKey];
        return newTimeouts;
      });
    }, 500);

    setParameterRenameTimeouts(prev => ({
      ...prev,
      [oldKey]: timeoutId
    }));
  }, [parameterRenameTimeouts]);

  const addStateTransition = () => {
    const newTransition: StateTransition = {
      States: [
        {
          From: ["Idle"],
          To: ["NewState"]
        }
      ],
      Actions: [
        {
          Type: "PlayAnimation",
          Slot: "Status",
          Animation: "Default"
        }
      ]
    };
    setNPC(prev => ({
      ...prev,
      StateTransitions: [...(prev.StateTransitions || []), newTransition]
    }));
  };

  const updateStateTransition = (index: number, field: string, value: any) => {
    setNPC(prev => {
      const newTransitions = [...(prev.StateTransitions || [])];
      if (field === 'fromStates') {
        newTransitions[index] = {
          ...newTransitions[index],
          States: [{
            From: value.split(',').map((s: string) => s.trim()).filter((s: string) => s),
            To: newTransitions[index].States[0]?.To || []
          }]
        };
      } else if (field === 'toStates') {
        newTransitions[index] = {
          ...newTransitions[index],
          States: [{
            From: newTransitions[index].States[0]?.From || [],
            To: value.split(',').map((s: string) => s.trim()).filter((s: string) => s)
          }]
        };
      } else if (field === 'actions') {
        newTransitions[index] = {
          ...newTransitions[index],
          Actions: value
        };
      }
      return { ...prev, StateTransitions: newTransitions };
    });
  };

  const addActionToTransition = (transitionIndex: number) => {
    setNPC(prev => {
      const newTransitions = [...(prev.StateTransitions || [])];
      const newAction = { Type: "PlayAnimation", Slot: "Status", Animation: "Default" };
      newTransitions[transitionIndex] = {
        ...newTransitions[transitionIndex],
        Actions: [...(newTransitions[transitionIndex].Actions || []), newAction]
      };
      return { ...prev, StateTransitions: newTransitions };
    });
  };

  const removeActionFromTransition = (transitionIndex: number, actionIndex: number) => {
    setNPC(prev => {
      const newTransitions = [...(prev.StateTransitions || [])];
      newTransitions[transitionIndex] = {
        ...newTransitions[transitionIndex],
        Actions: newTransitions[transitionIndex].Actions.filter((_, i) => i !== actionIndex)
      };
      return { ...prev, StateTransitions: newTransitions };
    });
  };

  const updateTransitionAction = (transitionIndex: number, actionIndex: number, field: string, value: any) => {
    setNPC(prev => {
      const newTransitions = [...(prev.StateTransitions || [])];
      const newActions = [...newTransitions[transitionIndex].Actions];
      newActions[actionIndex] = { ...newActions[actionIndex], [field]: value };
      newTransitions[transitionIndex] = {
        ...newTransitions[transitionIndex],
        Actions: newActions
      };
      return { ...prev, StateTransitions: newTransitions };
    });
  };

  const removeStateTransition = (index: number) => {
    setNPC(prev => ({
      ...prev,
      StateTransitions: prev.StateTransitions?.filter((_, i) => i !== index) || []
    }));
  };

  const addInstruction = () => {
    const newInstruction: Instruction = {
      Sensor: {
        Type: "State",
        State: "Idle"
      },
      Instructions: []
    };
    setNPC(prev => ({
      ...prev,
      Instructions: [...(prev.Instructions || []), newInstruction]
    }));
  };

  const removeInstruction = (index: number) => {
    setNPC(prev => ({
      ...prev,
      Instructions: prev.Instructions?.filter((_, i) => i !== index) || []
    }));
  };

  const updateInstruction = (index: number, field: string, value: any) => {
    setNPC(prev => {
      const newInstructions = [...(prev.Instructions || [])];
      if (field === 'sensorType') {
        newInstructions[index] = {
          ...newInstructions[index],
          Sensor: { ...newInstructions[index].Sensor, Type: value } as Sensor
        };
      } else if (field === 'sensorState') {
        newInstructions[index] = {
          ...newInstructions[index],
          Sensor: { ...newInstructions[index].Sensor, State: value } as Sensor
        };
      } else if (field === 'sensorRange') {
        newInstructions[index] = {
          ...newInstructions[index],
          Sensor: { ...newInstructions[index].Sensor, Range: parseFloat(value) } as Sensor
        };
      } else {
        newInstructions[index] = { ...newInstructions[index], [field]: value };
      }
      return { ...prev, Instructions: newInstructions };
    });
  };

  const addActionToInstruction = (instructionIndex: number) => {
    setNPC(prev => {
      const newInstructions = [...(prev.Instructions || [])];
      const newAction = { Type: "State", State: "Idle" };
      newInstructions[instructionIndex] = {
        ...newInstructions[instructionIndex],
        Actions: [...(newInstructions[instructionIndex].Actions || []), newAction]
      };
      return { ...prev, Instructions: newInstructions };
    });
  };

  const removeActionFromInstruction = (instructionIndex: number, actionIndex: number) => {
    setNPC(prev => {
      const newInstructions = [...(prev.Instructions || [])];
      newInstructions[instructionIndex] = {
        ...newInstructions[instructionIndex],
        Actions: (newInstructions[instructionIndex].Actions || []).filter((_, i) => i !== actionIndex)
      };
      return { ...prev, Instructions: newInstructions };
    });
  };

  const updateInstructionAction = (instructionIndex: number, actionIndex: number, field: string, value: any) => {
    setNPC(prev => {
      const newInstructions = [...(prev.Instructions || [])];
      const newActions = [...(newInstructions[instructionIndex].Actions || [])];
      newActions[actionIndex] = { ...newActions[actionIndex], [field]: value };
      newInstructions[instructionIndex] = {
        ...newInstructions[instructionIndex],
        Actions: newActions
      };
      return { ...prev, Instructions: newInstructions };
    });
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(npc, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = npc.Parameters.NameTranslationKey?.Value || 'npc_template';
    link.download = `${filename.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setNPC(imported);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const copyJSONToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(npc, null, 2));
      toast.success('JSON copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy JSON to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-white">
              NPC Builder
            </h1>
            <div className="flex gap-4">
              <Button onClick={exportJSON} className="flex items-center gap-2">
                <Download size={16} />
                Export JSON
              </Button>
              <Button variant="secondary" className="flex items-center gap-2" asChild>
                <label>
                  <Copy size={16} />
                  Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={importJSON}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button 
                variant="outline" 
                onClick={copyJSONToClipboard}
                className="flex items-center gap-2"
              >
                <Copy size={16} />
                Copy JSON
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-1">
              <Card>
                <Tabs defaultValue="basic" onValueChange={(value) => setActiveTab(value as any)}>
                  <div className="border-b border-border bg-muted/10">
                    <TabsList className="h-auto p-1 bg-transparent w-full justify-start rounded-none border-0">
                      <TabsTrigger 
                        value="basic"
                        className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
                      >
                        Basic
                      </TabsTrigger>
                      <TabsTrigger 
                        value="parameters"
                        className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
                      >
                        Parameters
                      </TabsTrigger>
                      <TabsTrigger 
                        value="states"
                        className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
                      >
                        State Transitions
                      </TabsTrigger>
                      <TabsTrigger 
                        value="instructions"
                        className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
                      >
                        Instructions
                      </TabsTrigger>
                    </TabsList>
                  </div>

            <TabsContent value="basic" className="mt-6">
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="npc-type">NPC Type</Label>
                      <HelpTooltip>
                        Abstract: Template that other NPCs inherit from. Variant: NPC that extends an Abstract template. Simple: Standalone NPC definition.
                      </HelpTooltip>
                    </div>
                    <Select value={npc.Type} onValueChange={(value) => updateNPC('Type', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Abstract">Abstract</SelectItem>
                        <SelectItem value="Variant">Variant</SelectItem>
                        <SelectItem value="Simple">Simple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="npc-reference">Reference (for Variant type)</Label>
                      <HelpTooltip>
                        When Type is "Variant", specify which Abstract template this NPC extends. Example: "Template_Base_NPC"
                      </HelpTooltip>
                    </div>
                    <Input
                      id="npc-reference"
                      value={npc.Reference || ''}
                      onChange={(e) => updateNPC('Reference', e.target.value)}
                      placeholder="Template_Base_NPC"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="npc-start-state">Start State</Label>
                      <HelpTooltip>
                        The initial state the NPC will be in when spawned. Common states include "Idle", "Sleep", or "Patrol". This must match a state defined in your Instructions.
                      </HelpTooltip>
                    </div>
                    <Input
                      id="npc-start-state"
                      value={npc.StartState || ''}
                      onChange={(e) => updateNPC('StartState', e.target.value)}
                      placeholder="Idle"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="npc-player-attitude">Default Player Attitude</Label>
                      <HelpTooltip>
                        How this NPC initially reacts to players. Hostile: Attacks on sight. Friendly: Helpful interactions. Neutral: Indifferent unless provoked. Ignore: Completely ignores players.
                      </HelpTooltip>
                    </div>
                    <Select value={npc.DefaultPlayerAttitude} onValueChange={(value) => updateNPC('DefaultPlayerAttitude', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hostile">Hostile</SelectItem>
                        <SelectItem value="Friendly">Friendly</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                        <SelectItem value="Ignore">Ignore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="npc-npc-attitude">Default NPC Attitude</Label>
                      <HelpTooltip>
                        How this NPC reacts to other NPCs by default. This can be overridden by faction relationships and specific NPC interactions.
                      </HelpTooltip>
                    </div>
                    <Select value={npc.DefaultNPCAttitude} onValueChange={(value) => updateNPC('DefaultNPCAttitude', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hostile">Hostile</SelectItem>
                        <SelectItem value="Friendly">Friendly</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                        <SelectItem value="Ignore">Ignore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="npc-knockback">Knockback Scale</Label>
                      <HelpTooltip>
                        Multiplier for how much this NPC gets knocked back when hit. 0.5 = half knockback, 1.0 = normal knockback, 2.0 = double knockback.
                      </HelpTooltip>
                    </div>
                    <Input
                      id="npc-knockback"
                      type="number"
                      step="0.1"
                      value={npc.KnockbackScale || 0.5}
                      onChange={(e) => updateNPC('KnockbackScale', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="npc-comment">Comment</Label>
                      <HelpTooltip>
                        Optional comment for developers. Commonly used for debug information or notes about the NPC's purpose. Example: "Debug: DisplayState"
                      </HelpTooltip>
                    </div>
                    <Input
                      id="npc-comment"
                      value={npc.$Comment || ''}
                      onChange={(e) => updateNPC('$Comment', e.target.value)}
                      placeholder="Debug: DisplayState"
                    />
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="parameters" className="mt-6">
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <CardTitle>Parameters</CardTitle>
                    <HelpTooltip>
                      Parameters define computed values for your NPC. Use "Compute" to reference game systems (e.g., Appearance, DropList, MaxHealth) or set custom values. Common compute types: Appearance (visual model), DropList (loot table), MaxHealth (health points), NameTranslationKey (display name).
                    </HelpTooltip>
                  </div>
                  <Button onClick={addParameter} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Parameter
                  </Button>
                </div>

                <div className="space-y-4">
                  {Object.entries(npc.Parameters).map(([key, param]) => (
                    <Card key={key}>
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="space-y-2 flex-1 max-w-xs">
                            <div className="flex items-center">
                              <Label className="text-sm">Parameter Name</Label>
                            </div>
                            <Input
                              value={parameterInputValues[key] !== undefined ? parameterInputValues[key] : key}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setParameterInputValues(prev => ({ ...prev, [key]: newValue }));
                                debouncedRenameParameter(key, newValue);
                              }}
                              onBlur={(e) => {
                                if (parameterRenameTimeouts[key]) {
                                  clearTimeout(parameterRenameTimeouts[key]);
                                  setParameterRenameTimeouts(prev => {
                                    const newTimeouts = { ...prev };
                                    delete newTimeouts[key];
                                    return newTimeouts;
                                  });
                                  renameParameter(key, e.target.value);
                                }
                              }}
                              placeholder="ParameterName"
                              className="font-medium"
                            />
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeParameter(key)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Label>Value</Label>
                              <HelpTooltip>
                                Parameter value. For compute parameters, use JSON like {`{"Compute": "MaxHealth"}`}. For direct values, enter the literal value (text, number, boolean).
                              </HelpTooltip>
                            </div>
                            <Textarea
                              value={typeof param.Value === 'object' ? JSON.stringify(param.Value, null, 2) : String(param.Value)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  updateParameter(key, 'Value', parsed);
                                } catch {
                                  updateParameter(key, 'Value', e.target.value);
                                }
                              }}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Label>Description</Label>
                              <HelpTooltip>
                                Optional description explaining what this parameter does and how it's used by your NPC.
                              </HelpTooltip>
                            </div>
                            <Textarea
                              value={param.Description}
                              onChange={(e) => updateParameter(key, 'Description', e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="states" className="mt-6">
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <CardTitle>State Transitions</CardTitle>
                    <HelpTooltip>
                      State transitions define when your NPC changes from one behavior state to another. Each transition has conditions (from/to states) and actions that execute during the transition.
                    </HelpTooltip>
                  </div>
                  <Button onClick={addStateTransition} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add State Transition
                  </Button>
                </div>

                <div className="space-y-4">
                  {(npc.StateTransitions || []).map((transition, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="flex items-center">
                          <CardTitle className="text-base">Transition {index + 1}</CardTitle>
                          <HelpTooltip>
                            State transition #{index + 1}. Defines when the NPC changes behavior states and what actions to perform during the transition.
                          </HelpTooltip>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeStateTransition(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Label>From States (comma separated)</Label>
                                <HelpTooltip>
                                  States that can trigger this transition. Examples: "Idle, Patrol" means the transition can activate from either Idle or Patrol states.
                                </HelpTooltip>
                              </div>
                              <Input
                                value={transition.States[0]?.From.join(', ') || ''}
                                onChange={(e) => updateStateTransition(index, 'fromStates', e.target.value)}
                                placeholder="Idle, Sleep"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Label>To States (comma separated)</Label>
                                <HelpTooltip>
                                  Destination states this transition can lead to. The NPC will choose one of these based on conditions and weights.
                                </HelpTooltip>
                              </div>
                              <Input
                                value={transition.States[0]?.To.join(', ') || ''}
                                onChange={(e) => updateStateTransition(index, 'toStates', e.target.value)}
                                placeholder="Combat, Alert"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Label className="text-base font-semibold">Actions</Label>
                                <HelpTooltip>
                                  Actions that execute when this state transition occurs. Can include animations, sounds, spawning items, or changing NPC properties.
                                </HelpTooltip>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addActionToTransition(index)}
                              >
                                <Plus size={14} />
                                Add Action
                              </Button>
                            </div>
                            
                            {transition.Actions.map((action, actionIndex) => (
                              <Card key={actionIndex} className="bg-muted/20">
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <Label className="font-medium">Action {actionIndex + 1}</Label>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeActionFromTransition(index, actionIndex)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label>Type</Label>
                                      <Select 
                                        value={action.Type} 
                                        onValueChange={(value) => updateTransitionAction(index, actionIndex, 'Type', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="PlayAnimation">PlayAnimation</SelectItem>
                                          <SelectItem value="Timeout">Timeout</SelectItem>
                                          <SelectItem value="Inventory">Inventory</SelectItem>
                                          <SelectItem value="Beacon">Beacon</SelectItem>
                                          <SelectItem value="State">State</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {action.Type === 'PlayAnimation' && (
                                      <>
                                        <div className="space-y-2">
                                          <Label>Slot</Label>
                                          <Input
                                            value={action.Slot || ''}
                                            onChange={(e) => updateTransitionAction(index, actionIndex, 'Slot', e.target.value)}
                                            placeholder="Status"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Animation</Label>
                                          <Input
                                            value={action.Animation || ''}
                                            onChange={(e) => updateTransitionAction(index, actionIndex, 'Animation', e.target.value)}
                                            placeholder="Laydown"
                                          />
                                        </div>
                                      </>
                                    )}

                                    {action.Type === 'Timeout' && (
                                      <div className="space-y-2 md:col-span-2">
                                        <Label>Delay [min, max]</Label>
                                        <Input
                                          value={Array.isArray(action.Delay) ? action.Delay.join(', ') : action.Delay || ''}
                                          onChange={(e) => {
                                            const values = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                                            updateTransitionAction(index, actionIndex, 'Delay', values.length === 1 ? values[0] : values);
                                          }}
                                          placeholder="1, 3"
                                        />
                                      </div>
                                    )}

                                    {action.Type === 'Inventory' && (
                                      <>
                                        <div className="space-y-2">
                                          <Label>Operation</Label>
                                          <Select 
                                            value={action.Operation || ''} 
                                            onValueChange={(value) => updateTransitionAction(index, actionIndex, 'Operation', value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="SetHotbar">SetHotbar</SelectItem>
                                              <SelectItem value="EquipHotbar">EquipHotbar</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Slot</Label>
                                          <Input
                                            type="number"
                                            value={action.Slot || ''}
                                            onChange={(e) => updateTransitionAction(index, actionIndex, 'Slot', parseInt(e.target.value))}
                                            placeholder="0"
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="instructions" className="mt-6">
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <CardTitle>Instructions</CardTitle>
                    <HelpTooltip>
                      Instructions define how your NPC responds to different conditions. Each instruction has a sensor (what to detect) and actions (what to do). Instructions form the core behavior logic of your NPC.
                    </HelpTooltip>
                  </div>
                  <Button onClick={addInstruction} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Instruction
                  </Button>
                </div>

                <div className="space-y-4">
                  {(npc.Instructions || []).map((instruction, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="flex items-center">
                          <CardTitle className="text-base">Instruction {index + 1}</CardTitle>
                          <HelpTooltip>
                            Instruction #{index + 1}. Defines a condition to watch for (sensor) and what actions to take when that condition is met.
                          </HelpTooltip>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeInstruction(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <Label className="text-base font-semibold">Sensor</Label>
                              <HelpTooltip>
                                Sensors detect conditions that trigger this instruction. State: Detects current NPC state. Target: Detects players/entities. Damage: Detects when NPC takes damage. Beacon: Listens for messages from other NPCs.
                              </HelpTooltip>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Label>Sensor Type</Label>
                                  <HelpTooltip>
                                    State: When NPC is in specific state. Target: When players/NPCs are nearby. Damage: When taking damage. Beacon: When receiving messages. And/Or: Combine multiple sensors.
                                  </HelpTooltip>
                                </div>
                                <Select 
                                  value={instruction.Sensor?.Type || ''} 
                                  onValueChange={(value) => updateInstruction(index, 'sensorType', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="State">State</SelectItem>
                                    <SelectItem value="Target">Target</SelectItem>
                                    <SelectItem value="Damage">Damage</SelectItem>
                                    <SelectItem value="Mob">Mob</SelectItem>
                                    <SelectItem value="Any">Any</SelectItem>
                                    <SelectItem value="And">And</SelectItem>
                                    <SelectItem value="Or">Or</SelectItem>
                                    <SelectItem value="Beacon">Beacon</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {instruction.Sensor?.Type === 'State' && (
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <Label>State</Label>
                                    <HelpTooltip>
                                      The state name to watch for. Examples: "Idle", "Sleep", "Combat". Use dot notation for substates like ".Guard" or ".FindFood".
                                    </HelpTooltip>
                                  </div>
                                  <Input
                                    value={(instruction.Sensor as any)?.State || ''}
                                    onChange={(e) => updateInstruction(index, 'sensorState', e.target.value)}
                                    placeholder="Idle"
                                  />
                                </div>
                              )}

                              {(instruction.Sensor?.Type === 'Target' || instruction.Sensor?.Type === 'Mob') && (
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <Label>Range</Label>
                                    <HelpTooltip>
                                      Detection range in game units. Larger values = detects from further away. Typical values: 3-5 for close detection, 10-20 for medium range, 30+ for long range.
                                    </HelpTooltip>
                                  </div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={(instruction.Sensor as any)?.Range || ''}
                                    onChange={(e) => updateInstruction(index, 'sensorRange', e.target.value)}
                                    placeholder="5"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`continue-${index}`}
                                checked={instruction.Continue || false}
                                onCheckedChange={(checked) => updateInstruction(index, 'Continue', checked)}
                              />
                              <div className="flex items-center">
                                <Label htmlFor={`continue-${index}`}>Continue</Label>
                                <HelpTooltip>
                                  If checked, the NPC will continue processing other instructions after this one executes. If unchecked, instruction processing stops here.
                                </HelpTooltip>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`blocking-${index}`}
                                checked={instruction.ActionsBlocking || false}
                                onCheckedChange={(checked) => updateInstruction(index, 'ActionsBlocking', checked)}
                              />
                              <div className="flex items-center">
                                <Label htmlFor={`blocking-${index}`}>Actions Blocking</Label>
                                <HelpTooltip>
                                  If checked, these actions will block (prevent) other instructions from running while they execute. Useful for ensuring animations or sequences complete.
                                </HelpTooltip>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Label>Reference (optional)</Label>
                              <HelpTooltip>
                                Reference to a reusable instruction component. Allows sharing common instruction logic between multiple NPCs. Example: "Component_Instruction_Standard_Detection"
                              </HelpTooltip>
                            </div>
                            <Input
                              value={instruction.Reference || ''}
                              onChange={(e) => updateInstruction(index, 'Reference', e.target.value)}
                              placeholder="Component_Instruction_Standard_Detection"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Label className="text-base font-semibold">Actions</Label>
                                <HelpTooltip>
                                  Actions executed when this instruction's sensor triggers. Can include state changes, animations, attacks, timeouts, and more. Actions execute in sequence.
                                </HelpTooltip>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addActionToInstruction(index)}
                              >
                                <Plus size={14} />
                                Add Action
                              </Button>
                            </div>
                            
                            {(instruction.Actions || []).map((action, actionIndex) => (
                              <Card key={actionIndex} className="bg-muted/20">
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <Label className="font-medium">Action {actionIndex + 1}</Label>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeActionFromInstruction(index, actionIndex)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label>Type</Label>
                                      <Select 
                                        value={action.Type} 
                                        onValueChange={(value) => updateInstructionAction(index, actionIndex, 'Type', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="State">State</SelectItem>
                                          <SelectItem value="Attack">Attack</SelectItem>
                                          <SelectItem value="Inventory">Inventory</SelectItem>
                                          <SelectItem value="PlayAnimation">PlayAnimation</SelectItem>
                                          <SelectItem value="Timeout">Timeout</SelectItem>
                                          <SelectItem value="Beacon">Beacon</SelectItem>
                                          <SelectItem value="Remove">Remove</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {action.Type === 'State' && (
                                      <div className="space-y-2 md:col-span-2">
                                        <Label>State</Label>
                                        <Input
                                          value={action.State || ''}
                                          onChange={(e) => updateInstructionAction(index, actionIndex, 'State', e.target.value)}
                                          placeholder="Combat"
                                        />
                                      </div>
                                    )}

                                    {action.Type === 'Attack' && (
                                      <div className="space-y-2 md:col-span-2">
                                        <Label>Attack Reference</Label>
                                        <Input
                                          value={action.Attack || ''}
                                          onChange={(e) => updateInstructionAction(index, actionIndex, 'Attack', e.target.value)}
                                          placeholder="Root_NPC_Attack_Melee"
                                        />
                                      </div>
                                    )}

                                    {action.Type === 'PlayAnimation' && (
                                      <>
                                        <div className="space-y-2">
                                          <Label>Slot</Label>
                                          <Input
                                            value={action.Slot || ''}
                                            onChange={(e) => updateInstructionAction(index, actionIndex, 'Slot', e.target.value)}
                                            placeholder="Status"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Animation</Label>
                                          <Input
                                            value={action.Animation || ''}
                                            onChange={(e) => updateInstructionAction(index, actionIndex, 'Animation', e.target.value)}
                                            placeholder="Idle"
                                          />
                                        </div>
                                      </>
                                    )}

                                    {action.Type === 'Timeout' && (
                                      <div className="space-y-2 md:col-span-2">
                                        <Label>Delay [min, max]</Label>
                                        <Input
                                          value={Array.isArray(action.Delay) ? action.Delay.join(', ') : action.Delay || ''}
                                          onChange={(e) => {
                                            const values = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                                            updateInstructionAction(index, actionIndex, 'Delay', values.length === 1 ? values[0] : values);
                                          }}
                                          placeholder="1, 3"
                                        />
                                      </div>
                                    )}

                                    {action.Type === 'Inventory' && (
                                      <>
                                        <div className="space-y-2">
                                          <Label>Operation</Label>
                                          <Select 
                                            value={action.Operation || ''} 
                                            onValueChange={(value) => updateInstructionAction(index, actionIndex, 'Operation', value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="SetHotbar">SetHotbar</SelectItem>
                                              <SelectItem value="EquipHotbar">EquipHotbar</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Slot</Label>
                                          <Input
                                            type="number"
                                            value={action.Slot || ''}
                                            onChange={(e) => updateInstructionAction(index, actionIndex, 'Slot', parseInt(e.target.value))}
                                            placeholder="0"
                                          />
                                        </div>
                                      </>
                                    )}

                                    {action.Type === 'Beacon' && (
                                      <>
                                        <div className="space-y-2">
                                          <Label>Message</Label>
                                          <Input
                                            value={action.Message || ''}
                                            onChange={(e) => updateInstructionAction(index, actionIndex, 'Message', e.target.value)}
                                            placeholder="Goblin_Ogre_Warn"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Target Groups</Label>
                                          <Input
                                            value={action.TargetGroups || ''}
                                            onChange={(e) => updateInstructionAction(index, actionIndex, 'TargetGroups', e.target.value)}
                                            placeholder="Goblin_Scrapper"
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div className="xl:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>JSON Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{ 
                borderRadius: '0.5rem', 
                maxHeight: 'calc(100vh - 12rem)', 
                margin: 0, 
                fontSize: '0.75rem',
                overflow: 'auto'
              }}
            >
              {JSON.stringify(npc, null, 2)}
            </SyntaxHighlighter>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</div>

      <footer className="border-t border-border bg-muted/5 py-4 mt-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            Copyright 2026 © HytaleModding
          </p>
        </div>
      </footer>
    </div>
  );
}
