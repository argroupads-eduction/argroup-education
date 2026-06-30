'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { MBBS_ABROAD_DOCUMENTS } from '@/lib/mbbsAbroadDocuments';

export function MbbsAbroadDocumentsVault() {
  return (
    <section className="abroad-vault" aria-labelledby="abroad-vault-title">
      <div className="abroad-vault__texture" aria-hidden />
      <div className="mx-auto max-w-7xl px-4">
        <div className="abroad-vault__head">
          <p className="abroad-vault__kicker">
            <FolderOpen className="h-4 w-4" aria-hidden />
            Visa-ready paperwork
          </p>
          <h2 id="abroad-vault-title" className="abroad-vault__title">
            Documents required to study MBBS abroad
          </h2>
          <p className="abroad-vault__lead">
            Keep these ready before counselling, we help you verify formats, attestations, and
            embassy-specific checklists.
          </p>
        </div>

        <ul className="abroad-vault__grid">
          {MBBS_ABROAD_DOCUMENTS.map((doc, i) => {
            const Icon = doc.icon;
            return (
              <motion.li
                key={doc.id}
                className="abroad-vault__item"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: (i % 5) * 0.05 }}
              >
                <div className="abroad-vault__card">
                  <div className="abroad-vault__icon">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="abroad-vault__doc-title">{doc.title}</h3>
                  <p className="abroad-vault__hint">{doc.hint}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>

        <div className="abroad-vault__cta">
          <p>Not sure which documents apply to your country?</p>
          <Link href="/contact" className="program-hub-btn-primary program-hub-btn-primary--lg">
            Get a personalised checklist
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
