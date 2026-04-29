import React from 'react';
import CircleLoader from './CircleLoader';

const BRAND_BLUE = '#007AFF';

export default function AppLoader({ size = 'small', color = BRAND_BLUE, style }) {
  // Map 'small'/'large' to pixel sizes for CircleLoader
  const pixelSize = size === 'large' ? 40 : 20;
  
  return (
    <CircleLoader 
      size={pixelSize} 
      color={color} 
      style={style} 
    />
  );
}
