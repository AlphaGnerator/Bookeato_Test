'use client';

import React, { useState } from 'react';
import type { RecipeInstruction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, ListPlus, PlusCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const autoTagKeywords = {
    PRE_PREP: ['soak', 'overnight', 'marinate for hours'],
    PASSIVE: ['boil', 'simmer', 'pressure cook', 'bake', 'cover and cook', 'rest'],
    ACTIVE: ['chop', 'fry', 'sauté', 'stir', 'mix', 'knead', 'grind', 'roast']
};

const getAutoCategory = (instruction: string): RecipeInstruction['time_category'] => {
    const lowerInstruction = instruction.toLowerCase();
    if (autoTagKeywords.PRE_PREP.some(kw => lowerInstruction.includes(kw))) return 'PRE_PREP';
    if (autoTagKeywords.PASSIVE.some(kw => lowerInstruction.includes(kw))) return 'PASSIVE';
    return 'ACTIVE';
}

const processInstructionsTsv = (tsv: string): Omit<RecipeInstruction, 'id'>[] => {
    const lines = tsv.trim().split('\n');
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
        throw new Error("TSV data is empty.");
    }
    
    const fixedHeaders: (keyof Omit<RecipeInstruction, 'id' | 'time_category'>)[] = [
        'stepNumber', 'instruction_en', 'instruction_hi', 'imageUrl', 'timeMinutes', 'specialInstruction'
    ];

    return lines.map((line, lineIndex) => {
        const values = line.split('\t');
        const instructionData: { [key: string]: any } = {};

        fixedHeaders.forEach((header, i) => {
            if (values[i] !== undefined) {
                 instructionData[header] = values[i].replace(/"/g, '').trim();
            }
        });

        // CRITICAL FIX: Skip header rows
        if (!instructionData.instruction_en || 
            ['instruction_en', 'instruction', 'step'].includes(instructionData.instruction_en.toLowerCase().trim())) {
            return null;
        }
        
        return {
            stepNumber: Number(instructionData.stepNumber) || 0,
            instruction_en: instructionData.instruction_en || '',
            instruction_hi: instructionData.instruction_hi || '',
            imageUrl: instructionData.imageUrl || '',
            timeMinutes: Number(instructionData.timeMinutes) || 0,
            time_category: getAutoCategory(instructionData.instruction_en),
            specialInstruction: instructionData.specialInstruction || '',
        };
    }).filter((inst): inst is Omit<RecipeInstruction, 'id'> => inst !== null && inst.stepNumber > 0);
};

interface InstructionsManagerProps {
  value: RecipeInstruction[];
  onChange: (value: RecipeInstruction[]) => void;
}

export function InstructionsManager({ value: instructions, onChange }: InstructionsManagerProps) {
  const [tsvData, setTsvData] = useState('');
  const { toast } = useToast();
  const [newInstruction, setNewInstruction] = useState({
      stepNumber: (instructions.length + 1).toString(),
      instruction_en: '',
      instruction_hi: '',
      imageUrl: '',
      timeMinutes: '0',
      time_category: 'ACTIVE' as RecipeInstruction['time_category'],
      specialInstruction: ''
  });

  const handleParseTsv = () => {
    try {
      const parsedInstructions = processInstructionsTsv(tsvData);
      const newInstructionsWithIds = parsedInstructions.map(inst => ({
        ...inst,
        id: crypto.randomUUID(),
      }));
      onChange([...instructions, ...newInstructionsWithIds].sort((a,b) => a.stepNumber - b.stepNumber));
      toast({
        title: 'Instructions Parsed',
        description: `${parsedInstructions.length} steps added.`,
      });
      setTsvData('');
    } catch (error: any) {
      toast({
        title: 'Parsing Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddInstruction = () => {
      if (!newInstruction.instruction_en) {
          toast({ title: "Missing Instruction", description: "The English instruction is required.", variant: 'destructive'});
          return;
      }
      const instructionToAdd: RecipeInstruction = {
          ...newInstruction,
          id: crypto.randomUUID(),
          stepNumber: parseInt(newInstruction.stepNumber) || (instructions.length + 1),
          timeMinutes: parseInt(newInstruction.timeMinutes) || 0,
          time_category: getAutoCategory(newInstruction.instruction_en),
      };
      onChange([...instructions, instructionToAdd].sort((a,b) => a.stepNumber - b.stepNumber));
      setNewInstruction({
          stepNumber: (instructions.length + 2).toString(),
          instruction_en: '',
          instruction_hi: '',
          imageUrl: '',
          timeMinutes: '0',
          time_category: 'ACTIVE',
          specialInstruction: ''
      });
  }

  const handleRemoveInstruction = (id: string) => {
    onChange(instructions.filter(inst => inst.id !== id));
  };
  
  const handleUpdateInstruction = (id: string, field: keyof RecipeInstruction, value: any) => {
      let processedValue = value;
      if (field === 'stepNumber' || field === 'timeMinutes') {
          processedValue = Number(value);
      }
      const updatedInstructions = instructions.map(inst => 
          inst.id === id ? { ...inst, [field]: processedValue } : inst
      );
      onChange(updatedInstructions.sort((a,b) => a.stepNumber - b.stepNumber));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewInstruction(prev => ({...prev, [name]: value}));
  }

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <div>
        <Label>Bulk Parse Instructions (TSV)</Label>
        <div className="flex gap-2 mt-2">
            <Textarea
            placeholder={'1	"In a bowl..."	"एक कटोरे में..."	https://...	40	"Cover it"'}
            className="h-24 font-mono text-xs"
            value={tsvData}
            onChange={(e) => setTsvData(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={handleParseTsv} className="h-24">
                <ListPlus className="mr-2 h-4 w-4" />
                Parse
            </Button>
        </div>
      </div>
      
      <Separator />

      {instructions.length > 0 && (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Added Steps ({instructions.length})</h3>
            <div className="space-y-4">
            {instructions.map((inst) => (
                <Card key={inst.id} className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Step #{inst.stepNumber}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveInstruction(inst.id)}
                                >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Instruction (EN)</Label>
                                <Textarea 
                                    value={inst.instruction_en}
                                    onChange={(e) => handleUpdateInstruction(inst.id, 'instruction_en', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Instruction (HI)</Label>
                                <Textarea 
                                    value={inst.instruction_hi || ''}
                                    onChange={(e) => handleUpdateInstruction(inst.id, 'instruction_hi', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Step #</Label>
                                <Input 
                                    type="number"
                                    value={inst.stepNumber}
                                    onChange={(e) => handleUpdateInstruction(inst.id, 'stepNumber', e.target.value)}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Mins</Label>
                                <Input 
                                    type="number"
                                    value={inst.timeMinutes || 0}
                                    onChange={(e) => handleUpdateInstruction(inst.id, 'timeMinutes', e.target.value)}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={inst.time_category}
                                    onValueChange={(value: RecipeInstruction['time_category']) => handleUpdateInstruction(inst.id, 'time_category', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                        <SelectItem value="PASSIVE">PASSIVE</SelectItem>
                                        <SelectItem value="PRE_PREP">PRE_PREP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>
      )}
      
      <div className="space-y-4 rounded-md border p-4 bg-background">
        <h4 className="font-medium">Add Manual Step</h4>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="inst-en">Instruction (EN)</Label>
                <Textarea id="inst-en" name="instruction_en" value={newInstruction.instruction_en} onChange={handleInputChange} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="inst-step">Step #</Label>
                    <Input id="inst-step" name="stepNumber" type="number" value={newInstruction.stepNumber} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="inst-time">Mins</Label>
                    <Input id="inst-time" name="timeMinutes" type="number" value={newInstruction.timeMinutes} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2 pt-8">
                    <Button type="button" variant="outline" onClick={handleAddInstruction} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}
