import { useState, useEffect, useCallback, useMemo } from 'react';

import { ProductVariant } from '@/utils/productVariantUtils';
import {
  validateQuantity,
  getQuantityState,
  calculateQuantityLimits,
  generateQuantityOptions,
  incrementQuantity,
  decrementQuantity,
  getQuantityDisplayText,
  getQuantityWarningMessage,
  requiresQuantityConfirmation,
  formatQuantityDisplay,
  parseQuantityInput,
  QuantityState,
  QuantityValidation,
  QuantityConstraints,
  DEFAULT_QUANTITY_CONSTRAINTS
} from '@/utils/quantityUtils';

export interface UseQuantitySelectorResult {
  // Current state
  quantity: number;
  quantityState: QuantityState | null;
  validation: QuantityValidation | null;
  
  // UI helpers
  quantityOptions: Array<{ value: number; label: string; disabled?: boolean }>;
  displayText: string;
  warningMessage: string | null;
  requiresConfirmation: boolean;
  
  // Limits
  minQuantity: number;
  maxQuantity: number;
  
  // Loading state
  isLoading: boolean;
  
  // Actions
  setQuantity: (quantity: number) => void;
  increment: (step?: number) => void;
  decrement: (step?: number) => void;
  reset: () => void;
  validateCurrent: () => Promise<QuantityValidation>;
  refreshState: () => void;
}

export interface UseQuantitySelectorOptions {
  variantId?: string;
  variant?: ProductVariant;
  initialQuantity?: number;
  constraints?: QuantityConstraints;
  autoValidate?: boolean;
  onQuantityChange?: (quantity: number, isValid: boolean) => void;
  onValidationChange?: (validation: QuantityValidation) => void;
}

export function useQuantitySelector(options: UseQuantitySelectorOptions): UseQuantitySelectorResult {
  const {
    variantId,
    variant,
    initialQuantity = DEFAULT_QUANTITY_CONSTRAINTS.defaultQuantity,
    constraints = DEFAULT_QUANTITY_CONSTRAINTS,
    autoValidate = true,
    onQuantityChange,
    onValidationChange
  } = options;

  // State
  const [quantity, setQuantityState] = useState(initialQuantity);
  const [quantityState, setQuantityState] = useState<QuantityState | null>(null);
  const [validation, setValidation] = useState<QuantityValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current variant ID (from prop or variant object)
  const currentVariantId = variantId || variant?.id;

  // Calculate limits based on variant
  const limits = useMemo(() => {
    if (variant) {
      return calculateQuantityLimits(variant, constraints);
    }
    return {
      min: constraints.minQuantity,
      max: constraints.maxQuantity,
      default: constraints.defaultQuantity
    };
  }, [variant, constraints]);

  // Generate quantity options for dropdowns
  const quantityOptions = useMemo(() => {
    const maxAvailable = quantityState?.maxAllowed || limits.max;
    return generateQuantityOptions(maxAvailable, constraints);
  }, [quantityState, limits.max, constraints]);

  // UI helpers
  const displayText = useMemo(() => {
    if (!quantityState) return formatQuantityDisplay(quantity);
    return getQuantityDisplayText(quantityState);
  }, [quantityState, quantity]);

  const warningMessage = useMemo(() => {
    if (!quantityState) return null;
    return getQuantityWarningMessage(quantityState);
  }, [quantityState]);

  const requiresConfirmation = useMemo(() => {
    if (!quantityState) return false;
    return requiresQuantityConfirmation(quantity, quantityState.stockRemaining);
  }, [quantity, quantityState]);

  // Load quantity state
  const loadQuantityState = useCallback(async () => {
    if (!currentVariantId) {
      setQuantityState(null);
      return;
    }

    setIsLoading(true);

    try {
      const state = await getQuantityState(currentVariantId, quantity, constraints);
      setQuantityState(state);
      
      // Auto-adjust quantity if it exceeds max allowed
      if (quantity > state.maxAllowed && state.maxAllowed > 0) {
        const adjustedQuantity = Math.max(constraints.minQuantity, state.maxAllowed);
        setQuantityState(adjustedQuantity);
        onQuantityChange?.(adjustedQuantity, state.errors.length === 0);
      }
      
    } catch (error) {
      console.error('Error loading quantity state:', error);
      setQuantityState({
        quantity: constraints.defaultQuantity,
        maxAllowed: 0,
        isLowStock: false,
        isOutOfStock: true,
        stockRemaining: 0,
        warnings: [],
        errors: ['Unable to check stock availability']
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentVariantId, quantity, constraints, onQuantityChange]);

  // Validate current quantity
  const validateCurrent = useCallback(async (): Promise<QuantityValidation> => {
    if (!currentVariantId) {
      const emptyValidation: QuantityValidation = {
        isValid: false,
        maxQuantity: 0,
        errors: ['No variant selected'],
        warnings: []
      };
      setValidation(emptyValidation);
      onValidationChange?.(emptyValidation);
      return emptyValidation;
    }

    try {
      const validationResult = await validateQuantity(currentVariantId, quantity, constraints);
      setValidation(validationResult);
      onValidationChange?.(validationResult);
      return validationResult;
    } catch (error) {
      console.error('Error validating quantity:', error);
      const errorValidation: QuantityValidation = {
        isValid: false,
        maxQuantity: 0,
        errors: ['Validation failed'],
        warnings: []
      };
      setValidation(errorValidation);
      onValidationChange?.(errorValidation);
      return errorValidation;
    }
  }, [currentVariantId, quantity, constraints, onValidationChange]);

  // Set quantity with validation
  const setQuantity = useCallback((newQuantity: number) => {
    const parsedQuantity = Math.max(constraints.minQuantity, Math.floor(newQuantity));
    setQuantityState(parsedQuantity);
    
    if (autoValidate) {
      validateCurrent();
    }
    
    const isValid = validation?.isValid ?? true;
    onQuantityChange?.(parsedQuantity, isValid);
  }, [constraints.minQuantity, autoValidate, validateCurrent, validation, onQuantityChange]);

  // Increment quantity
  const increment = useCallback((step: number = 1) => {
    const maxAllowed = quantityState?.maxAllowed || limits.max;
    const newQuantity = incrementQuantity(quantity, maxAllowed, step, constraints);
    setQuantity(newQuantity);
  }, [quantity, quantityState, limits.max, constraints, setQuantity]);

  // Decrement quantity
  const decrement = useCallback((step: number = 1) => {
    const newQuantity = decrementQuantity(quantity, step, constraints);
    setQuantity(newQuantity);
  }, [quantity, constraints, setQuantity]);

  // Reset to default
  const reset = useCallback(() => {
    setQuantity(constraints.defaultQuantity);
  }, [constraints.defaultQuantity, setQuantity]);

  // Refresh state
  const refreshState = useCallback(() => {
    loadQuantityState();
  }, [loadQuantityState]);

  // Load state when variant changes
  useEffect(() => {
    loadQuantityState();
  }, [loadQuantityState]);

  // Auto-validate when quantity changes
  useEffect(() => {
    if (autoValidate && currentVariantId) {
      validateCurrent();
    }
  }, [quantity, autoValidate, currentVariantId, validateCurrent]);

  return {
    // Current state
    quantity,
    quantityState,
    validation,
    
    // UI helpers
    quantityOptions,
    displayText,
    warningMessage,
    requiresConfirmation,
    
    // Limits
    minQuantity: limits.min,
    maxQuantity: quantityState?.maxAllowed || limits.max,
    
    // Loading state
    isLoading,
    
    // Actions
    setQuantity,
    increment,
    decrement,
    reset,
    validateCurrent,
    refreshState
  };
}

/**
 * Simplified hook for basic quantity selection
 */
export function useSimpleQuantitySelector(
  variantId: string | undefined,
  initialQuantity: number = 1
) {
  const result = useQuantitySelector({
    variantId,
    initialQuantity,
    autoValidate: true
  });

  return {
    quantity: result.quantity,
    setQuantity: result.setQuantity,
    increment: result.increment,
    decrement: result.decrement,
    maxQuantity: result.maxQuantity,
    isValid: result.validation?.isValid ?? false,
    errors: result.validation?.errors ?? [],
    isLoading: result.isLoading
  };
}

/**
 * Hook for quantity input handling
 */
export function useQuantityInput(
  variantId: string | undefined,
  onQuantityChange?: (quantity: number) => void
) {
  const [inputValue, setInputValue] = useState('1');
  
  const quantitySelector = useQuantitySelector({
    variantId,
    autoValidate: true,
    onQuantityChange
  });

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    const quantity = parseQuantityInput(value);
    quantitySelector.setQuantity(quantity);
  }, [quantitySelector]);

  const handleInputBlur = useCallback(() => {
    // Ensure input displays current quantity on blur
    setInputValue(quantitySelector.quantity.toString());
  }, [quantitySelector.quantity]);

  return {
    ...quantitySelector,
    inputValue,
    setInputValue: handleInputChange,
    onInputBlur: handleInputBlur
  };
}

/**
 * Hook for quantity validation without selection
 */
export function useQuantityValidation(variantId: string | undefined) {
  const validateQuantityValue = useCallback(async (quantity: number) => {
    if (!variantId) {
      return {
        isValid: false,
        maxQuantity: 0,
        errors: ['No variant selected'],
        warnings: []
      };
    }

    return await validateQuantity(variantId, quantity);
  }, [variantId]);

  return { validateQuantity: validateQuantityValue };
}