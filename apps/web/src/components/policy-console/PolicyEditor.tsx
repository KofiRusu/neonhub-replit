/**
 * Policy Editor - Interactive Policy Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { fetchAPI } from './utils';
import type { GovernancePolicy } from './types';
import type { PolicyRule } from '../../types/governance';

export interface PolicyEditorProps {
  policyId?: string;
  onSave?: (policy: GovernancePolicy) => void;
  onCancel?: () => void;
}

export function PolicyEditor({ policyId, onSave, onCancel }: PolicyEditorProps) {
  const [policy, setPolicy] = useState<Partial<GovernancePolicy>>({
    name: '',
    description: '',
    rules: [],
    enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policyId) {
      fetchPolicy(policyId);
    }
  }, [policyId]);

  const fetchPolicy = async (id: string) => {
    try {
      setLoading(true);
      const policies = await fetchAPI<GovernancePolicy[]>('/api/governance/policies');
      const found = policies.find(p => p.id === id);
      if (found) setPolicy(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetchAPI<GovernancePolicy>('/api/governance/policies', {
        method: 'POST',
        body: JSON.stringify(policy),
      });
      onSave?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setPolicy(prev => ({
      ...prev,
      rules: [
        ...(prev.rules || []),
        { id: `rule-${Date.now()}`, condition: '', action: 'allow', priority: 0 } as PolicyRule,
      ],
    }));
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">{policyId ? 'Edit Policy' : 'Create New Policy'}</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Policy Name</label>
          <Input
            value={policy.name || ''}
            onChange={e => setPolicy({ ...policy, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={policy.description || ''}
            onChange={e => setPolicy({ ...policy, description: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Rules</h3>
            <Button type="button" onClick={addRule} variant="outline">
              Add Rule
            </Button>
          </div>
          
          <div className="space-y-4">
            {policy.rules?.map((rule, index) => (
              <Card key={rule.id} className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Condition"
                    value={rule.condition}
                    onChange={e => {
                      const newRules = [...(policy.rules || [])];
                      newRules[index] = { ...rule, condition: e.target.value };
                      setPolicy({ ...policy, rules: newRules });
                    }}
                  />
                  <select
                    value={rule.action}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === 'allow' || value === 'deny' || value === 'review') {
                        const newRules = [...(policy.rules || [])];
                        newRules[index] = { ...rule, action: value };
                        setPolicy({ ...policy, rules: newRules });
                      }
                    }}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="allow">Allow</option>
                    <option value="deny">Deny</option>
                    <option value="review">Review</option>
                  </select>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </form>
    </Card>
  );
}