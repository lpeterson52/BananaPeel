export function getRecycleInfo(prediction: string): string {
  const lowerPrediction = prediction.toLowerCase();
  if (lowerPrediction.includes('plastic')) {
    return 'This item is recyclable in most curbside recycling programs. Please ensure it is clean and dry before recycling.';
  }  if (lowerPrediction.includes('paper')) {
    return 'This item is recyclable in curbside recycling programs. Please remove any non-paper components before recycling.';
  }  if (lowerPrediction.includes('glass')) {
    return 'This item is recyclable in most curbside recycling programs. Please rinse it out before recycling.';
  }  if (lowerPrediction.includes('metal')) {
    return 'This item is recyclable in most curbside recycling programs. Please ensure it is clean before recycling.';
  } if (lowerPrediction.includes('cardboard')) {
    return 'This item is recyclable in curbside recycling programs. Please flatten it and remove any non-cardboard materials before recycling.';
  } if (lowerPrediction.includes('shoes')) {
    return 'Shoes can often be recycled through specialized programs. Please check with local recycling centers for options.';
  } if (lowerPrediction.includes('clothing')) {
    return 'Clothing can be donated or recycled through textile recycling programs. Please ensure items are clean and in good condition.';
  } if (lowerPrediction.includes('battery')) {
    return 'Batteries should be recycled at designated battery recycling locations. Do not dispose of them in regular trash or recycling bins.';
  } return 'Recycling information for this item is not available. Please check with your local recycling program for guidance.';
}