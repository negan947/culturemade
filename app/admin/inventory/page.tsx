'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Download, Upload, Plus, Minus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';

interface VariantRow {
	variant_id: string;
	product_id: string;
	product_name: string;
	variant_name: string;
	sku: string | null;
	quantity: number;
}

export default function InventoryPage() {
	const [rows, setRows] = useState<VariantRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [sort, setSort] = useState<{ field: keyof VariantRow; direction: 'asc' | 'desc' }>({ field: 'product_name', direction: 'asc' });

	useEffect(() => {
		(async () => {
			try {
				const supabase = createClient();
				const { data, error } = await supabase
					.from('product_variants')
					.select('id, name, sku, quantity, product_id, products!inner(name)')
					.order('name');
				if (error) throw error;
				const mapped: VariantRow[] = (data || []).map((v: any) => ({
					variant_id: v.id,
					product_id: v.product_id,
					product_name: v.products.name,
					variant_name: v.name,
					sku: v.sku,
					quantity: v.quantity ?? 0,
				}));
				setRows(mapped);
			} catch {
				toast.error('Failed to load inventory');
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		const sorted = [...rows].sort((a, b) => {
			const dir = sort.direction === 'asc' ? 1 : -1;
			const av = a[sort.field];
			const bv = b[sort.field];
			if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
			return String(av).localeCompare(String(bv)) * dir;
		});
		if (!term) return sorted;
		return sorted.filter(r =>
			r.product_name.toLowerCase().includes(term) ||
			r.variant_name.toLowerCase().includes(term) ||
			(r.sku || '').toLowerCase().includes(term)
		);
	}, [rows, search, sort]);

	const toggleAll = (checked: boolean) => {
		const next: Record<string, boolean> = {};
		filtered.forEach(r => { next[r.variant_id] = checked; });
		setSelected(next);
	};

	const toggleOne = (id: string, checked: boolean) => {
		setSelected(prev => ({ ...prev, [id]: checked }));
	};

	const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected]);

	const applyBulkAdjust = async (delta: number) => {
		if (selectedIds.length === 0) {
			toast.message('Select at least one variant');
			return;
		}
		try {
			const res = await fetch('/api/admin/inventory/adjust', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ adjustments: selectedIds.map(id => ({ variant_id: id, adjustment: delta, reference_type: 'adjustment' })) })
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Failed');
			// Reflect locally
			setRows(prev => prev.map(r => selected[idOf(r)] ? { ...r, quantity: Math.max(0, r.quantity + delta) } : r));
			toast.success('Inventory adjusted');
		} catch (e: any) {
			toast.error(e.message || 'Adjustment failed');
		}
	};

	const idOf = (r: VariantRow) => r.variant_id;

	const exportCSV = () => {
		const header = ['Product', 'Variant', 'SKU', 'Quantity'];
		const lines = [header.join(',')].concat(filtered.map(r => [r.product_name, r.variant_name, r.sku || '', String(r.quantity)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')));
		const csv = lines.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'inventory.csv';
		a.click();
		URL.revokeObjectURL(url);
	};

	const importCSV = async (file: File) => {
		const text = await file.text();
		const [headerLine, ...dataLines] = text.split(/\r?\n/).filter(Boolean);
		const headers = headerLine.split(',').map(h => h.replace(/^"|"$/g, ''));
		const skuIdx = headers.findIndex(h => h.toLowerCase() === 'sku');
		const qtyIdx = headers.findIndex(h => h.toLowerCase() === 'quantity');
		if (skuIdx === -1 || qtyIdx === -1) {
			toast.error('CSV must include SKU and Quantity columns');
			return;
		}
		const supabase = createClient();
		const updates: Array<{ variant_id: string; newQty: number }> = [];
		for (const line of dataLines) {
			const cols = line.split(',').map(c => c.replace(/^"|"$/g, ''));
			const sku = cols[skuIdx];
			const qty = Number(cols[qtyIdx]);
			if (!sku) continue;
			const { data: v } = await supabase.from('product_variants').select('id, quantity').eq('sku', sku).maybeSingle();
			if (v?.id) updates.push({ variant_id: v.id, newQty: Math.max(0, qty) });
		}
		if (updates.length === 0) {
			toast.message('No matching SKUs found');
			return;
		}
		// Apply as absolute set via adjust route using difference
		const diffs: Array<{ variant_id: string; adjustment: number }> = [];
		for (const up of updates) {
			const row = rows.find(r => r.variant_id === up.variant_id);
			const current = row ? row.quantity : 0;
			diffs.push({ variant_id: up.variant_id, adjustment: up.newQty - current });
		}
		const res = await fetch('/api/admin/inventory/adjust', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ adjustments: diffs })
		});
		if (!res.ok) {
			const j = await res.json();
			throw new Error(j.error || 'Failed to import');
		}
		setRows(prev => prev.map(r => {
			const up = updates.find(u => u.variant_id === r.variant_id);
			return up ? { ...r, quantity: up.newQty } : r;
		}));
		toast.success('Inventory imported');
	};

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary">Inventory</h1>
					<p className="text-admin-light-text-secondary dark:text-admin-text-secondary">Manage stock levels and movements</p>
				</div>
				<div className="flex items-center gap-2">
					<button onClick={() => exportCSV()} className="px-3 py-2 bg-admin-light-bg-surface dark:bg-admin-bg-surface border border-admin-light-border dark:border-admin-border rounded-lg text-sm flex items-center gap-2">
						<Download className="h-4 w-4" /> Export CSV
					</button>
					<label className="px-3 py-2 bg-admin-accent text-white rounded-lg text-sm flex items-center gap-2 cursor-pointer" htmlFor="inventory-import-input">
						<Upload className="h-4 w-4" /> Import CSV
						<input id="inventory-import-input" type="file" accept=".csv" className="hidden" onChange={e => e.target.files && importCSV(e.target.files[0])} />
					</label>
				</div>
			</div>

			<div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border">
				<div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
					<div className="flex items-center gap-2 flex-1">
						<Search className="h-4 w-4 text-admin-light-text-secondary dark:text-admin-text-secondary" />
						<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, variant, or SKU" className="w-full bg-transparent outline-none text-admin-light-text-primary dark:text-admin-text-primary" />
					</div>
					<div className="flex items-center gap-2">
						<button onClick={() => applyBulkAdjust(1)} className="px-3 py-2 bg-admin-accent text-white rounded-lg text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> +1</button>
						<button onClick={() => applyBulkAdjust(-1)} className="px-3 py-2 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-lg text-sm flex items-center gap-2"><Minus className="h-4 w-4" /> -1</button>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[900px]">
						<thead>
							<tr className="border-b border-admin-light-border dark:border-admin-border">
								<th className="px-4 py-3 text-left"><input aria-label="Select all variants" type="checkbox" onChange={e => toggleAll(e.target.checked)} /></th>
								{[
									{ key: 'product_name', label: 'Product' },
									{ key: 'variant_name', label: 'Variant' },
									{ key: 'sku', label: 'SKU' },
									{ key: 'quantity', label: 'Quantity' },
								].map(col => (
									<th key={col.key} className="px-4 py-3 text-left">
										<button onClick={() => setSort(prev => ({ field: col.key as keyof VariantRow, direction: prev.field === col.key && prev.direction === 'asc' ? 'desc' : 'asc' }))} className="flex items-center gap-1 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
											<span>{col.label}</span>
											<ArrowUpDown className="h-4 w-4" />
										</button>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr><td className="px-4 py-6" colSpan={5}>Loading...</td></tr>
							) : filtered.length === 0 ? (
								<tr><td className="px-4 py-6" colSpan={5}>No variants found</td></tr>
							) : (
								filtered.map(r => (
									<tr key={r.variant_id} className="border-b border-admin-light-border-soft dark:border-admin-border-soft">
										<td className="px-4 py-2"><input aria-label={`Select ${r.product_name} ${r.variant_name}`} type="checkbox" checked={!!selected[r.variant_id]} onChange={e => toggleOne(r.variant_id, e.target.checked)} /></td>
										<td className="px-4 py-2">{r.product_name}</td>
										<td className="px-4 py-2">{r.variant_name}</td>
										<td className="px-4 py-2">{r.sku || '-'}</td>
										<td className="px-4 py-2 font-medium {r.quantity === 0 ? 'text-admin-error' : r.quantity <= 10 ? 'text-admin-warning' : 'text-admin-success'}">{r.quantity}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}


