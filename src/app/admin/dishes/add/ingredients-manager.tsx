'use client';

import React, { useState } from 'react';
import type { Ingredient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, ListPlus, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const processIngredientsTsv = (tsv: string): Omit<Ingredient, 'id'>[] => {
    const lines = tsv.trim().split('\n');
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
        throw new Error("TSV data is empty.");
    }

    const fixedHeaders: (keyof Omit<Ingredient, 'id'>)[] = [
        'name', 'quantity', 'unit', 'prepNote', 'prepTimeMinutes', 'providedBy', 'isKeyIngredient'
    ];

    return lines.map((line, lineIndex) => {
        const values = line.split('\t');
        const ingredientData: { [key: string]: any } = {};

        fixedHeaders.forEach((header, i) => {
            if (values[i] !== undefined) {
                 ingredientData[header] = values[i].replace(/"/g, '').trim();
            }
        });
        
        // CRITICAL FIX: Skip header rows
        if (!ingredientData.name || 
            ['ingredient_name', 'name', 'ingredient'].includes(ingredientData.name.toLowerCase().trim())) {
            return null;
        }

        return {
            name: ingredientData.name || '',
            quantity: Number(ingredientData.quantity) || 0,
            unit: ingredientData.unit || '',
            prepNote: ingredientData.prepNote || '',
            prepTimeMinutes: Number(ingredientData.prepTimeMinutes) || 0,
            providedBy: (ingredientData.providedBy?.toLowerCase() === 'cook' ? 'Cook' : 'Customer') as 'Customer' | 'Cook',
            isKeyIngredient: ingredientData.isKeyIngredient ? ingredientData.isKeyIngredient.toString().trim().toUpperCase() === 'TRUE' : false,
        };
    }).filter((ing): ing is Omit<Ingredient, 'id'> => ing !== null);
};

interface IngredientsManagerProps {
  value: Ingredient[];
  onChange: (value: Ingredient[]) => void;
}

export function IngredientsManager({ value: ingredients, onChange }: IngredientsManagerProps) {
  const [tsvData, setTsvData] = useState('');
  const { toast } = useToast();
  const [newIngredient, setNewIngredient] = useState({
      name: '',
      quantity: '0',
      unit: '',
      prepNote: '',
      prepTimeMinutes: '0',
      providedBy: 'Customer' as 'Customer' | 'Cook',
      isKeyIngredient: false
  });

  const handleParseTsv = () => {
    try {
      const parsedIngredients = processIngredientsTsv(tsvData);
      const newIngredientsWithIds = parsedIngredients.map(ing => ({
        ...ing,
        id: crypto.randomUUID(),
      }));
      onChange([...ingredients, ...newIngredientsWithIds]);
      toast({
        title: 'Ingredients Parsed',
        description: `${parsedIngredients.length} ingredients added.`,
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

  const handleAddIngredient = () => {
      if (!newIngredient.name || !newIngredient.unit) {
          toast({ title: "Missing Fields", description: "Name and Unit are required.", variant: 'destructive'});
          return;
      }
      const ingredientToAdd: Ingredient = {
          ...newIngredient,
          id: crypto.randomUUID(),
          quantity: parseFloat(newIngredient.quantity) || 0,
          prepTimeMinutes: parseFloat(newIngredient.prepTimeMinutes) || 0,
          prepNote: newIngredient.prepNote || ''
      };
      onChange([...ingredients, ingredientToAdd]);
      setNewIngredient({
          name: '',
          quantity: '0',
          unit: '',
          prepNote: '',
          prepTimeMinutes: '0',
          providedBy: 'Customer',
          isKeyIngredient: false
      });
  }

  const handleRemoveIngredient = (id: string) => {
    onChange(ingredients.filter(ing => ing.id !== id));
  };
  
  const handleUpdateIngredient = (id: string, field: keyof Ingredient, value: any) => {
      const updatedIngredients = ingredients.map(ing => 
          ing.id === id ? { ...ing, [field]: value } : ing
      );
      onChange(updatedIngredients);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewIngredient(prev => ({...prev, [name]: value}));
  }

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <div>
        <Label>Bulk Parse Ingredients (TSV)</Label>
        <div className="flex gap-2 mt-2">
            <Textarea
            placeholder={'Example: Chicken Breast	500	grams	"Cut into cubes"	10	Customer	TRUE'}
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

      {ingredients.length > 0 && (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Added Ingredients ({ingredients.length})</h3>
            <div className="space-y-4">
            {ingredients.map((ing, index) => (
                <Card key={ing.id} className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Ingredient #{index + 1}: {ing.name}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveIngredient(ing.id)}
                                >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input 
                                    value={ing.name} 
                                    onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input 
                                        type="number"
                                        value={ing.quantity}
                                        onChange={(e) => handleUpdateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Input 
                                        value={ing.unit} 
                                        onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Prep Note</Label>
                                <Textarea 
                                    value={ing.prepNote || ''}
                                    onChange={(e) => handleUpdateIngredient(ing.id, 'prepNote', e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Prep Time (mins)</Label>
                                <Input
                                    type="number"
                                    value={ing.prepTimeMinutes || 0}
                                    onChange={(e) => handleUpdateIngredient(ing.id, 'prepTimeMinutes', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="space-y-2">
                                <Label>Provided By</Label>
                                <Select 
                                    value={ing.providedBy}
                                    onValueChange={(value: 'Customer' | 'Cook') => handleUpdateIngredient(ing.id, 'providedBy', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Customer">Customer</SelectItem>
                                        <SelectItem value="Cook">Cook</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Checkbox 
                                    id={`isKey-${ing.id}`}
                                    checked={ing.isKeyIngredient}
                                    onCheckedChange={(checked) => handleUpdateIngredient(ing.id, 'isKeyIngredient', !!checked)}
                                />
                                <Label htmlFor={`isKey-${ing.id}`} className="font-normal">
                                    Is Key?
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>
      )}
      
      <div className="space-y-4 rounded-md border p-4 bg-background">
        <h4 className="font-medium">Add Manual Ingredient</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="ing-name">Name</Label>
                <Input id="ing-name" name="name" value={newIngredient.name} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label htmlFor="ing-qty">Quantity</Label>
                    <Input id="ing-qty" name="quantity" type="number" value={newIngredient.quantity} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="ing-unit">Unit</Label>
                    <Input id="ing-unit" name="unit" value={newIngredient.unit} onChange={handleInputChange} />
                </div>
            </div>
        </div>
         <Button type="button" variant="outline" onClick={handleAddIngredient} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add to List
        </Button>
      </div>

    </div>
  );
}
