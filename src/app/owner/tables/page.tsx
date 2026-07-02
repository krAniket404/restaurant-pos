'use client';
import React, { useState, useEffect } from 'react';
import { getGeneralSettings, updateGeneralSettings } from '../../../lib/firebase/db';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Settings, Save, Loader2 } from 'lucide-react';

export default function TableManagementPage() {
  const [numberOfTables, setNumberOfTables] = useState<number>(20);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getGeneralSettings()
      .then((settings) => {
        if (settings?.numberOfTables) {
          setNumberOfTables(settings.numberOfTables);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching settings:', error);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateGeneralSettings({ numberOfTables });
      alert('Number of tables updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Table Management</h1>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-600" />
            Restaurant Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Tables
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={numberOfTables}
                onChange={(e) => setNumberOfTables(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. 20"
              />
              <p className="text-xs text-slate-500 mt-2">
                This will update the number of tables available for waiters to create orders on.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || numberOfTables <= 0}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
