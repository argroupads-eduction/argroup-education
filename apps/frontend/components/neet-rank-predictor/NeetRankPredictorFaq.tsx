'use client';

import { Accordion } from '@/components/ui/Accordion';
import { NEET_PREDICTOR_FAQ } from '@/lib/neetRankPredictor/data';

const accordionItems = NEET_PREDICTOR_FAQ.map((faq, i) => ({
  id: `neet-faq-${i}`,
  title: faq.q,
  content: faq.a,
}));

export function NeetRankPredictorFaq() {
  return (
    <Accordion items={accordionItems} defaultOpen={accordionItems[0]?.id} variant="premium" />
  );
}
