import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LiveItem } from '@/types/bookeato-live';

interface ItemEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<LiveItem, 'id'>) => Promise<void>;
  editingItem: LiveItem | null;
}

const defaultItem: Omit<LiveItem, 'id'> = {
  name: "",
  price: 0,
  imageUrl: "",
  category: "Healthy Signatures",
  inStock: true,
  isSpicy: false,
  isVeg: true,
  ingredients: [],
  nutritionalProfile: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  brandStory: "",
  societyId: "global"
};

export function ItemEditorDialog({ isOpen, onClose, onSave, editingItem }: ItemEditorDialogProps) {
  const [formData, setFormData] = useState<Omit<LiveItem, 'id'>>(defaultItem);
  const [ingredientsStr, setIngredientsStr] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
      setIngredientsStr(editingItem.ingredients.join(', '));
    } else {
      setFormData(defaultItem);
      setIngredientsStr("");
    }
  }, [editingItem, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('nutritionalProfile.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nutritionalProfile: { ...prev.nutritionalProfile, [key]: Number(value) }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalData = {
        ...formData,
        ingredients: ingredientsStr.split(',').map(i => i.trim()).filter(i => i)
      };
      await onSave(finalData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-stone-50 border-stone-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-stone-900">
            {editingItem ? 'Edit Menu Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. (V) Quinoa Golgappas" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input required type="number" name="price" value={formData.price} onChange={handleNumberChange} className="bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                required 
                name="category" 
                value={formData.category} 
                onChange={handleChange as any} 
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background"
              >
                <option value="The Guilt-Free Chaats">The Guilt-Free Chaats</option>
                <option value="Superfood Bowls">Superfood Bowls</option>
                <option value="Cold Pressed Sips">Cold Pressed Sips</option>
                <option value="Rolls & Tacos">Rolls & Tacos</option>
                <option value="Healthy Signatures">Healthy Signatures</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Image URL (or path)</Label>
              <Input required name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="/live_menu/item.png" className="bg-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Brand Story</Label>
            <Textarea required name="brandStory" value={formData.brandStory} onChange={handleChange} rows={3} className="bg-white resize-none" />
          </div>

          <div className="space-y-2">
            <Label>Ingredients (comma separated)</Label>
            <Input required value={ingredientsStr} onChange={e => setIngredientsStr(e.target.value)} placeholder="Quinoa, Mint, Tamarind..." className="bg-white" />
          </div>

          <div className="grid grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-stone-200">
            <div className="space-y-2">
              <Label className="text-xs">Calories</Label>
              <Input type="number" name="nutritionalProfile.calories" value={formData.nutritionalProfile.calories} onChange={handleNumberChange} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Protein (g)</Label>
              <Input type="number" name="nutritionalProfile.protein" value={formData.nutritionalProfile.protein} onChange={handleNumberChange} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Carbs (g)</Label>
              <Input type="number" name="nutritionalProfile.carbs" value={formData.nutritionalProfile.carbs} onChange={handleNumberChange} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fat (g)</Label>
              <Input type="number" name="nutritionalProfile.fat" value={formData.nutritionalProfile.fat} onChange={handleNumberChange} />
            </div>
          </div>

          <div className="flex gap-6 p-4 bg-stone-100 rounded-xl">
            <div className="flex items-center space-x-2">
              <Switch checked={formData.isSpicy} onCheckedChange={(c) => setFormData(p => ({ ...p, isSpicy: c }))} />
              <Label className="cursor-pointer">Spicy Item</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.isVeg} onCheckedChange={(c) => setFormData(p => ({ ...p, isVeg: c }))} />
              <Label className="cursor-pointer">Vegetarian</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.inStock} onCheckedChange={(c) => setFormData(p => ({ ...p, inStock: c }))} />
              <Label className="cursor-pointer">In Stock</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold">
              {isSaving ? 'Saving...' : 'Save Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
