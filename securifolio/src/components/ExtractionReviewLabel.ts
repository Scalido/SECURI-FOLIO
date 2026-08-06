import React from 'react'

import { getExtractionReviewLabel } from '@/lib/validations'

export function ExtractionReviewLabel() {
  return React.createElement(
    'span',
    {
      className: 'text-[9px] px-1.5 py-0.5 rounded bg-brand-accent/20 text-brand-accent',
    },
    getExtractionReviewLabel(),
  )
}
