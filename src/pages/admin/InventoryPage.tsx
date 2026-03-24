

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Minus, Package, AlertTriangle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { products, addProduct, adjustStock } = useStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortByStock, setSortByStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formThreshold, setFormThreshold] = useState('');
  const [formPrice, setFormPrice] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockLevel <= p.reorderThreshold),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (sortByStock) {
      result = [...result].sort((a, b) => a.stockLevel - b.stockLevel);
    }

    return result;
  }, [products, search, categoryFilter, sortByStock]);

  const handleAddStock = (id: string, name: string) => {
    adjustStock(id, 5);
    toast.success(`Added 5 units to ${name}`);
  };

  const handleUseStock = (id: string, name: string) => {
    const product = products.find((p) => p.id === id);
    if (product && product.stockLevel <= 0) {
      toast.error(`${name} is already out of stock`);
      return;
    }
    adjustStock(id, -1);
    toast.success(`Used 1 unit of ${name}`);
  };

  const resetForm = () => {
    setFormName('');
    setFormCategory('');
    setFormStock('');
    setFormThreshold('');
    setFormPrice('');
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formCategory.trim()) {
      toast.error('Name and category are required');
      return;
    }

    const stock = parseInt(formStock) || 0;
    const threshold = parseInt(formThreshold) || 0;
    const price = parseFloat(formPrice) || 0;

    addProduct({
      id: `prod-${Date.now()}`,
      name: formName.trim(),
      category: formCategory.trim(),
      stockLevel: stock,
      reorderThreshold: threshold,
      price,
    });

    toast.success(`Product "${formName.trim()}" added`);
    resetForm();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage product stock levels and reorder thresholds"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        }
      />

      {/* Low stock alert banner */}
      {lowStockProducts.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {lowStockProducts.length} item{lowStockProducts.length > 1 ? 's' : ''} below reorder threshold!
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={sortByStock ? 'default' : 'outline'}
          onClick={() => setSortByStock(!sortByStock)}
          className="whitespace-nowrap"
        >
          Sort: Low Stock First
        </Button>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Add products to manage your salon inventory or adjust your search filters."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock Level</TableHead>
                  <TableHead className="text-right">Reorder Threshold</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLow = product.stockLevel <= product.reorderThreshold;
                  return (
                    <TableRow
                      key={product.id}
                      className={
                        isLow
                          ? 'bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : ''
                      }
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          isLow ? 'text-red-600 dark:text-red-400' : ''
                        }`}
                      >
                        {product.stockLevel}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.reorderThreshold}
                      </TableCell>
                      <TableCell className="text-right">
                        ${product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-400">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddStock(product.id, product.name)}
                            title="Add 5 units"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUseStock(product.id, product.name)}
                            title="Use 1 unit"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="e.g. Shampoo Premium"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">Category</Label>
              {categories.length > 0 ? (
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? '')}>
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="product-category"
                  placeholder="e.g. Hair Care"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-stock">Stock Level</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-threshold">Reorder Threshold</Label>
                <Input
                  id="product-threshold"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Price ($)</Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
