export function getRecycleInfo(prediction: string): string {
  if (prediction.includes('plastic')) {
    return 'This item is recyclable in most curbside recycling programs. Please ensure it is clean and dry before recycling.';
  }  if (prediction.includes('paper')) {
    return 'This item is recyclable in curbside recycling programs. Please remove any non-paper components before recycling.';
  }  if (prediction.includes('glass')) {
    return 'This item is recyclable in most curbside recycling programs. Please rinse it out before recycling.';
  }  if (prediction.includes('metal')) {
    return 'This item is recyclable in most curbside recycling programs. Please ensure it is clean before recycling.';
  } if (prediction.includes('cardboard')) {
    return 'This item is recyclable in curbside recycling programs. Please flatten it and remove any non-cardboard materials before recycling.';
  } if (prediction.includes('shoes')) {
    return 'Shoes can often be recycled through specialized programs. Please check with local recycling centers for options.';
  } if (prediction.includes('clothing')) {
    return 'Clothing can be donated or recycled through textile recycling programs. Please ensure items are clean and in good condition.';
  } if (prediction.includes('battery')) {
    return 'Batteries should be recycled at designated battery recycling locations. Do not dispose of them in regular trash or recycling bins.';
  } return 'Recycling information for this item is not available. Please check with your local recycling program for guidance.';
}

export function isRecyclable(prediction: string): boolean {
  const recyclableItems = ['paper', 'glass', 'metal', 'cardboard', 'plastic'];
  return recyclableItems.some(item => prediction.includes(item));
}

export function isCompostable(prediction: string): boolean {
    const compostableItems = ['biological'];
    return compostableItems.some(item => prediction.includes(item));
  }

export function classifyRecyclability(prediction: string): 'recyclable' | 'compostable' | 'landfill' {
    if (isRecyclable(prediction)) {
        return 'recyclable';
    } else if (isCompostable(prediction)) {
        return 'compostable';
    } else {
        return 'landfill';
    }
}