'use client'

import { motion } from 'framer-motion'
import BreadcrumbNav from '@/components/breadcrumb-nav'

export default function AboutPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'About' }]} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl tracking-tight">About This Project</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border bg-card p-6 text-sm text-muted-foreground space-y-4"
      >
        <p>
          This dashboard supports Hossein Jamalirad&apos;s PhD research in Medical Informatics at
          Mashhad University of Medical Sciences (MUMS), focused on preoperative prediction of sperm
          retrieval success in non-obstructive azoospermia (NOA) patients undergoing microTESE.
        </p>
        <p>
          The corrected benchmark evaluates 16 machine learning models with leakage-aware methodology
          and identifies <strong>LightGBM</strong> as the best performer (AUC 0.7327 ± 0.0057),
          followed by calibration, decision-curve analysis, and explainability (SHAP + LIME).
        </p>
        <p>
          The pipeline processes 2,450 screened patients (2,413 analytical cohort) through
          73 engineered features derived from 55 raw clinical variables — including pathology
          subgroup decomposition (SCO, MA, CSTH, HS, NS).
        </p>
        <p>
          All pipeline outputs shown here were produced by AI agents trained by Hossein Jamalirad.
          The dashboard is deployed on <strong>Vercel</strong> with PostgreSQL database and GitHub synchronization.
        </p>
      </motion.div>

      {/* Intro Video */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="font-display font-bold text-xl tracking-tight mb-3">Introduction Video</h2>
        <div className="rounded-xl border bg-card overflow-hidden">
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[500px] object-contain bg-black"
          >
            <source src="/videos/intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </motion.div>

      {/* Key Institutions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="font-display font-bold text-xl tracking-tight mb-3">Affiliated Institutions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="font-bold text-sm">Mashhad University of Medical Sciences</p>
            <p className="text-xs text-muted-foreground mt-1">Department of Medical Informatics — PhD program in Health Information Technology</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="font-bold text-sm">Royan Institute</p>
            <p className="text-xs text-muted-foreground mt-1">Department of Reproductive Biomedicine — Clinical data source and domain expertise</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
