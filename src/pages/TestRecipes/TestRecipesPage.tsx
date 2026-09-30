import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../../store/recipeStore';
import { useToastStore } from '../../store/toastStore';
import { TestRecipe } from '../../types/recipe';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  BookOpen,
  Plus,
  Copy,
  Trash2,
  PlaySquare,
  Eye,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrent } from '../../utils/formatters';

export const TestRecipesPage: React.FC = () => {
  const navigate = useNavigate();
  const { recipes, selectRecipeAndApply, addRecipe, duplicateRecipe, deleteRecipe } = useRecipeStore();
  const toast = useToastStore();

  const [selectedRecipe, setSelectedRecipe] = useState<TestRecipe | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeCode, setNewRecipeCode] = useState('');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newCurrent, setNewCurrent] = useState(6000);
  const [newPf, setNewPf] = useState(0.48);

  const handleSelectRecipe = (recipeId: string) => {
    const ok = selectRecipeAndApply(recipeId);
    if (ok) {
      toast.success('Recipe Applied', 'Configuration loaded into Test Wizard.');
      navigate('/new-test');
    }
  };

  const handleDuplicate = (recipeId: string) => {
    const dup = duplicateRecipe(recipeId);
    if (dup) toast.success('Recipe Duplicated', `Created "${dup.name}"`);
  };

  const handleDelete = (recipe: TestRecipe) => {
    if (recipe.isSystemDefault) {
      toast.warning('Protected Recipe', 'System default IEC standard recipes cannot be deleted.');
      return;
    }
    if (window.confirm(`Delete recipe "${recipe.name}"?`)) {
      deleteRecipe(recipe.id);
      toast.success('Recipe Deleted', 'Removed from recipe list.');
    }
  };

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeName.trim()) return;

    addRecipe({
      name: newRecipeName,
      code: newRecipeCode || `CUST-${Math.floor(100 + Math.random() * 900)}`,
      description: newRecipeDesc || 'Custom test parameters profile.',
      category: 'CUSTOM',
      targetStandard: 'IEC 60898-1:2015',
      author: 'Current Operator',
      mcbTemplate: {
        manufacturer: 'Generic MCB',
        modelNumber: 'Custom Specimen',
        poles: 'SP',
        ratedCurrentA: 16,
        ratedVoltageV: 240,
        trippingCurve: 'C',
        instantaneousTrippingRange: '5 In – 10 In',
        ratedBreakingCapacityA: newCurrent,
        standardsComplied: 'IEC 60898-1:2015',
      },
      testConfig: {
        testType: 'Icn',
        prospectiveCurrentA: newCurrent,
        targetPowerFactor: newPf,
        systemVoltageV: 240,
        systemFrequencyHz: 50,
        shotCycle: 'O - t - CO',
        openCloseIntervalSec: 180,
        breakArcInceptionAngleDeg: 45,
        arcChamberPressureMonitoring: true,
        ambientTemperatureC: 24.0,
        relativeHumidityPct: 45,
      },
    });

    setShowAddModal(false);
    setNewRecipeName('');
    toast.success('Recipe Created', 'New test configuration recipe saved.');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
            NORMATIVE TEMPLATES • IEC 60898-1 PRESETS
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Standard Test Recipes & Parameter Profiles
          </h1>
          <p className="text-xs text-slate-500">
            Pre-configured test parameters, duty cycles, and prospective ratings for standard certification batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create New Recipe
          </Button>
        </div>
      </div>

      {/* Professional Laboratory Recipe Table (replaces SaaS pricing cards) */}
      <div className="bg-white border border-slate-200 rounded-md shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-700 uppercase">
            Active Test Recipes ({recipes.length})
          </span>
          <span className="text-slate-400 text-[10px]">
            IEC 60898-1:2015 STANDARDS DIRECTORY
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Recipe Code</th>
                <th className="py-2.5 px-3">Recipe Name & Description</th>
                <th className="py-2.5 px-3">Standard</th>
                <th className="py-2.5 px-3">Prospective I</th>
                <th className="py-2.5 px-3">Power Factor</th>
                <th className="py-2.5 px-3">Duty Cycle</th>
                <th className="py-2.5 px-3">MCB Rating</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {recipes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{r.code}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="font-semibold text-slate-900 block">{r.name}</span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-xs">{r.description}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{r.targetStandard}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {formatCurrent(r.testConfig.prospectiveCurrentA)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    {r.testConfig.targetPowerFactor.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-sans">
                    {r.testConfig.shotCycle}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">
                    {r.mcbTemplate.poles} {r.mcbTemplate.trippingCurve}{r.mcbTemplate.ratedCurrentA}A
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.isSystemDefault
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSelectRecipe(r.id)}
                        title="Load into Test Wizard"
                      >
                        <PlaySquare className="w-3 h-3 mr-1" /> Use
                      </Button>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipe(r)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors cursor-pointer"
                        title="View Full Parameters"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(r.id)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors cursor-pointer"
                        title="Duplicate Recipe"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!r.isSystemDefault && (
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Delete Recipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipe Detail Drawer / Modal */}
      {selectedRecipe && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRecipe(null)}
          title={`Recipe Details: ${selectedRecipe.name}`}
          maxWidth="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedRecipe(null)}>
                Close
              </Button>
              <Button size="sm" variant="primary" onClick={() => handleSelectRecipe(selectedRecipe.id)}>
                Load into Wizard
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs font-mono">
            <p className="text-slate-600 font-sans">{selectedRecipe.description}</p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">STANDARD:</span>
                <span className="font-bold text-slate-900">{selectedRecipe.targetStandard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PROSPECTIVE CURRENT:</span>
                <span className="font-bold text-slate-900">{formatCurrent(selectedRecipe.testConfig.prospectiveCurrentA)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">POWER FACTOR:</span>
                <span className="font-bold text-slate-900">{selectedRecipe.testConfig.targetPowerFactor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DUTY CYCLE:</span>
                <span className="font-bold text-slate-900">{selectedRecipe.testConfig.shotCycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SYSTEM VOLTAGE:</span>
                <span className="font-bold text-slate-900">{selectedRecipe.testConfig.systemVoltageV} V / {selectedRecipe.testConfig.systemFrequencyHz} Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SPECIMEN SPEC:</span>
                <span className="font-bold text-teal-700">
                  {selectedRecipe.mcbTemplate.poles} Curve {selectedRecipe.mcbTemplate.trippingCurve}{selectedRecipe.mcbTemplate.ratedCurrentA}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Recipe Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Test Recipe Profile"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRecipe} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
              Recipe Name
            </label>
            <input
              type="text"
              placeholder="e.g. IEC 60898-1 6kA / 20A Curve C"
              value={newRecipeName}
              onChange={(e) => setNewRecipeName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Recipe Code
              </label>
              <input
                type="text"
                placeholder="e.g. IEC-6kA-C20"
                value={newRecipeCode}
                onChange={(e) => setNewRecipeCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Prospective Current (A)
              </label>
              <input
                type="number"
                value={newCurrent}
                onChange={(e) => setNewCurrent(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Power Factor (cos φ)
              </label>
              <input
                type="number"
                step="0.01"
                value={newPf}
                onChange={(e) => setNewPf(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Routine production verification"
                value={newRecipeDesc}
                onChange={(e) => setNewRecipeDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button size="sm" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary">
              Save Recipe
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
