'use client';

import { motion } from 'framer-motion';
import { MBBS_ABROAD_INTAKE_STEPS } from '@/lib/mbbsAbroadDocuments';

export function MbbsAbroadIntakeRibbon() {
  return (
    <section className="abroad-intake" aria-label="MBBS abroad admission steps">
      <div className="mx-auto max-w-7xl px-4">
        <div className="abroad-intake__track">
          {MBBS_ABROAD_INTAKE_STEPS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.id}
                className="abroad-intake__card"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="abroad-intake__icon-wrap">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="abroad-intake__title">{item.title}</h3>
                <p className="abroad-intake__body">{item.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
