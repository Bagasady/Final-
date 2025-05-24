// Add these new validation functions to the existing file
export const validateBox = (req, res, next) => {
  const { category, branch } = req.body;

  if (!category || !branch) {
    return res.status(400).json({ error: 'Category and branch are required' });
  }

  if (!['A', 'B', 'C'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  next();
};

export const validateBoxItem = (req, res, next) => {
  const { sku, name, quantity, price } = req.body;

  if (!sku || !name || quantity === undefined || price === undefined) {
    return res.status(400).json({ 
      error: 'SKU, name, quantity, and price are required' 
    });
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }

  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  next();
};